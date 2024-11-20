import req from '../../util/req.js';
import { MAC_UA, formatPlayUrl } from '../../util/misc.js';
import { load } from 'cheerio';
import * as HLS from 'hls-parser';
import * as Ali from '../../util/ali.js';
import * as Quark from '../../util/quark.js';
import dayjs from 'dayjs';
import pkg from 'lodash';
const { _ } = pkg;

let url = 'https://www.meijumi.net';


async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': MAC_UA,
            'Referer': url,
        },
    });
    let content = res.data;
 //    console.log(content);
    return content;
}

// ali token 相关配置放在 index.config.js
/*
ali: {
    token: 'xxxxxxxxxxxxxxxxxxxxxxxxx',
    token280: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
},
wogg: {
    url: 'https://wogg.xyz',
},
*/

async function init(inReq, _outResp) {
    // url = inReq.server.config.meijumi.url;
    await Ali.initAli(inReq.server.db, inReq.server.config.ali);
    await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
    return {};
}




async function home(_inReq, _outResp) {
    const classes = [{'type_id':'usa','type_name':'美剧'},{'type_id':'usa/xuanyi','type_name':'灵异/惊悚'},{'type_id':'usa/mohuan','type_name':'魔幻/科幻'},{'type_id':'usa/zuian','type_name':'罪案/动作谍战'},{'type_id':'usa/qinggan','type_name':'剧情/历史'},{'type_id':'usa/xiju','type_name':'喜剧'},{'type_id':'usa/yiwu','type_name':'律政/医务'},{'type_id':'usa/katong','type_name':'动漫/动画'},{'type_id':'usa/jilu','type_name':'纪录片'},{'type_id':'usa/zongyi','type_name':'综艺/真人秀'},{'type_id':'en','type_name':'英剧'},{'type_id':'news','type_name':'最近更新'}];
    const filterObj = {};

    return {
        class: classes,
        filters: filterObj,
    };
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    // console.log(tid);
    let pg = inReq.body.page;
    if (pg <= 0 || tid == 'news') pg = 1;
    let page = '';
    if (pg > 1) {
        page = '/page/' + pg;
    }
  //  const html = await request(url + '/category/' + (extend || tid) + page + '/' );
 //   const html =await request(url + "/" + tid  + page + '/');
    const html = await request(`${url}/${tid}${page}/`);
   // console.log(pg);
    return parseHtmlList1(html, pg, tid);
}

function parseHtmlList1(html, pg, tid) {
    const $ = load(html);
    if (tid == 'news') {
        const list = $('div.xuhao ol li');
            // console.log(list);
        let videos = [];
        for(var item of list) {
            const $item = $(item);
            // console.log($item);
            const title = $item.find('.zuo a');
            // console.log(title);
            const remarks = $item.find('.zhong').text();
             videos.push({
                vod_id: title.attr('href'),
                vod_name:  title.text().replace(/《|》/g,'').trim(),
                // vod_name: '西瓜',
                vod_pic: '',
                vod_remarks: remarks,
            });
        }
        return {
            list: videos,
        };
    }   
    else{
    const list = $('div#post_list_box article');
    // console.log(list);
    let videos = [];
    for(var item of list) {
        const $item = $(item);
        const title = $item.find('a');
       // console.log(title);
        const img = $item.find('img');
        const remarks = $item.find('.gxts').text();
        videos.push({
            vod_id: title.attr('href'),
            vod_name: title.attr('title').match(/《(.*?)》/)[0].replace(/《|》/g,'').trim(),
            vod_pic: img.attr('src'),
            vod_remarks: remarks,
        });
    }
//    const pgCount = _.isEmpty(videos) ? pg : pg + 1;
    const pgCount = $('.page-numbers').length > 0 ? pg + 1 : pg;
    const limit = 30;
    return {
        page: pg,
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    };
    }
}


function parseHtmlList(html, pg) {
    const $ = load(html);
    const list = $('main article figure');
    // console.log(list);
    let videos = [];
    for(var item of list) {
        const $item = $(item);
        const title = $item.find('a');
    //    console.log(title);
        const img = $item.find('img');
        const remarks = $item.find('.gxts').text();
        videos.push({
            vod_id: title.attr('href'),
            vod_name: title.attr('title').match(/《(.*?)》/)[0].replace(/《|》/g,'').trim(),
            vod_pic: img.attr('src'),
            vod_remarks: remarks,
        });
    }
    
    const pgCount = $('.page-numbers').length > 0 ? pg + 1 : pg;
    const limit = 30;
    return {
        page: pg,
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    };
}


async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (const id of ids) {
 //       const html = await request( url + '/' + id);
        const html = await request(`${url}/${id}`);
        const $ = load(html);
        let vod = {
            vod_id: id,
            vod_name: $('.entry-title').toString().match(/《(.*?)》/)[0].replace(/《|》/g,'').trim(),
            vod_pic: $('div.single-content img').attr('src'),
            vod_remarks: $('h2 span').text(),
            vod_content: $("blockquote p").text().trim(),
        };
        const shareUrls = $('.single-content p a[href*=/s/]')
        .map((_, a) =>$(a).attr('href'))
        .get();
       const froms = [];
        const urls = [];
        let ali = '';
        let quark = '';
        for (const shareUrl of shareUrls) {
            const shareData = Ali.getShareData(shareUrl);
            if (shareData && ali <= 1) {
                ali++;
                const videos = await Ali.getFilesByShareUrl(shareData);
                if (videos.length > 0) {
                    froms.push('Ali-' + shareData.shareId);
                    urls.push(
                        videos
                            .map((v) => {
                                const ids = [v.share_id, v.file_id, v.subtitle ? v.subtitle.file_id : ''];
                                return formatPlayUrl('', v.name) + '$' + ids.join('*');
                            })
                            .join('#'),
                    );
                }
            } else if(!shareData && quark <= 1){
                quark++;
                const shareData = Quark.getShareData(shareUrl);
                if (shareData) {
                    const videos = await Quark.getFilesByShareUrl(shareData);
                    if (videos.length > 0) {
                        froms.push('Quark-' + shareData.shareId);
                        urls.push(
                            videos
                                .map((v) => {
                                    const ids = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                                    return formatPlayUrl('', v.file_name) + '$' + ids.join('*');
                                })
                                .join('#'),
                        );
                    }
                }
            }
        }
        vod.vod_play_from = froms.join('$$$');
        vod.vod_play_url = urls.join('$$$');
        videos.push(vod);
    }
    return {
        list: videos,
    };
}

const aliTranscodingCache = {};
const aliDownloadingCache = {};

const quarkTranscodingCache = {};
const quarkDownloadingCache = {};

async function proxy(inReq, outResp) {
    await Ali.initAli(inReq.server.db, inReq.server.config.ali);
    await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
    const site = inReq.params.site;
    const what = inReq.params.what;
    const shareId = inReq.params.shareId;
    const fileId = inReq.params.fileId;
    if (site == 'ali') {
        if (what == 'trans') {
            const flag = inReq.params.flag;
            const end = inReq.params.end;

            if (aliTranscodingCache[fileId]) {
                const purl = aliTranscodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0].url;
                if (parseInt(purl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                    delete aliTranscodingCache[fileId];
                }
            }

            if (aliTranscodingCache[fileId] && end.endsWith('.ts')) {
                const transcoding = aliTranscodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0];
                if (transcoding.plist) {
                    const tsurl = transcoding.plist.segments[parseInt(end.replace('.ts', ''))].suri;
                    if (parseInt(tsurl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                        delete aliTranscodingCache[fileId];
                    }
                }
            }

            if (!aliTranscodingCache[fileId]) {
                const transcoding = await Ali.getLiveTranscoding(shareId, fileId);
                aliTranscodingCache[fileId] = transcoding;
            }

            const transcoding = aliTranscodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0];
            if (!transcoding.plist) {
                const resp = await req.get(transcoding.url, {
                    headers: {
                        'User-Agent': MAC_UA,
                    },
                });
                transcoding.plist = HLS.parse(resp.data);
                for (const s of transcoding.plist.segments) {
                    if (!s.uri.startsWith('http')) {
                        s.uri = new URL(s.uri, transcoding.url).toString();
                    }
                    s.suri = s.uri;
                    s.uri = s.mediaSequenceNumber.toString() + '.ts';
                }
            }

            if (end.endsWith('.ts')) {
                outResp.redirect(transcoding.plist.segments[parseInt(end.replace('.ts', ''))].suri);
                return;
            } else {
                const hls = HLS.stringify(transcoding.plist);
                let hlsHeaders = {
                    'content-type': 'audio/x-mpegurl',
                    'content-length': hls.length.toString(),
                };
                outResp.code(200).headers(hlsHeaders);
                return hls;
            }
        } else {
            const flag = inReq.params.flag;
            if (aliDownloadingCache[fileId]) {
                const purl = aliDownloadingCache[fileId].url;
                if (parseInt(purl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                    delete aliDownloadingCache[fileId];
                }
            }
            if (!aliDownloadingCache[fileId]) {
                const down = await Ali.getDownload(shareId, fileId, flag == 'down');
                aliDownloadingCache[fileId] = down;
            }
            outResp.redirect(aliDownloadingCache[fileId].url);
            return;
        }
    } else if (site == 'quark') {
        let downUrl = '';
        const ids = fileId.split('*');
        const flag = inReq.params.flag;
        if (what == 'trans') {
            if (!quarkTranscodingCache[ids[1]]) {
                quarkTranscodingCache[ids[1]] = (await Quark.getLiveTranscoding(shareId, decodeURIComponent(ids[0]), ids[1], ids[2])).filter((t) => t.accessable);
            }
            downUrl = quarkTranscodingCache[ids[1]].filter((t) => t.resolution.toLowerCase() == flag)[0].video_info.url;
            outResp.redirect(downUrl);
            return;
        } else {
            if (!quarkDownloadingCache[ids[1]]) {
                const down = await Quark.getDownload(shareId, decodeURIComponent(ids[0]), ids[1], ids[2], flag == 'down');
                if (down) quarkDownloadingCache[ids[1]] = down;
            }
            downUrl = quarkDownloadingCache[ids[1]].download_url;
            if (flag == 'redirect') {
                outResp.redirect(downUrl);
                return;
            }
        }
        return await Quark.chunkStream(
            inReq,
            outResp,
            downUrl,
            ids[1],
            Object.assign(
                {
                    Cookie: Quark.cookie,
                },
                Quark.baseHeader,
            ),
        );
    }
}

async function play(inReq, _outResp) {
    const flag = inReq.body.flag;
    const id = inReq.body.id;
    const ids = id.split('*');
    if (flag.startsWith('Ali-')) {
        const transcoding = await Ali.getLiveTranscoding(ids[0], ids[1]);
        aliTranscodingCache[ids[1]] = transcoding;
        transcoding.sort((a, b) => b.template_width - a.template_width);
        const urls = [];
        const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/ali';
        transcoding.forEach((t) => {
            urls.push(t.template_id);
            urls.push(`${proxyUrl}/trans/${t.template_id.toLowerCase()}/${ids[0]}/${ids[1]}/.m3u8`);
        });
        urls.push('SRC');
        urls.push(`${proxyUrl}/src/down/${ids[0]}/${ids[1]}/.bin`);
        const result = {
            parse: 0,
            url: urls,
        };
        if (ids[2]) {
            result.extra = {
                subt: `${proxyUrl}/src/subt/${ids[0]}/${ids[2]}/.bin`,
            };
        }
        return result;
    } else if (flag.startsWith('Quark-')) {
        const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
        quarkTranscodingCache[ids[2]] = transcoding;
        const urls = [];
        const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/quark';
        transcoding.forEach((t) => {
            urls.push(t.resolution.toUpperCase());
            urls.push(`${proxyUrl}/trans/${t.resolution.toLowerCase()}/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.mp4`);
        });
        urls.push('SRC');
        urls.push(`${proxyUrl}/src/redirect/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
        urls.push('SRC_Proxy');
        urls.push(`${proxyUrl}/src/down/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
        const result = {
            parse: 0,
            url: urls,
            header: Object.assign(
                {
                    Cookie: Quark.cookie,
                },
                Quark.baseHeader,
            ),
        };
        if (ids[3]) {
            result.extra = {
                subt: `${proxyUrl}/src/subt/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[4]}*${ids[5]}/.bin`,
            };
        }
        return result;
    }
}

async function search(inReq, _outResp) {
    let pg = inReq.body.page;
    const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    let page = '';
    if (pg > 1) {
        page = '/page/' + pg;
    }
  //  const html = await request(url + page + "/?s=" + encodeURIComponent(wd));
    const html = await request(`${url}/${page}/?s=${wd}`);
    return parseHtmlList(html, pg);
}


async function test(inReq, outResp) {
        const printErr = function (json) {
            if (json.statusCode && json.statusCode == 500) {
                // console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr(resp.json());
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                if (dataResult.detail.list && dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    for (const vod of dataResult.detail.list) {
                        const flags = vod.vod_play_from.split('$$$');
                        const ids = vod.vod_play_url.split('$$$');
                        for (let j = 0; j < flags.length; j++) {
                            const flag = flags[j];
                            const urls = ids[j].split('#');
                            for (let i = 0; i < urls.length && i < 2; i++) {
                                resp = await inReq.server
                                    .inject()
                                    .post(`${prefix}/play`)
                                    .payload({
                                        flag: flag,
                                        id: urls[i].split('$')[1],
                                    });
                                dataResult.play.push(resp.json());
                            }
                        }
                    }
                }
            }
        }
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '光环',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    }


export default {
    meta: {
        key: 'meijumi',
        name: '美剧资源',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};