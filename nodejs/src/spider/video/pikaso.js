import req from '../../util/req.js';
import { MAC_UA,  formatPlayUrl } from '../../util/misc.js';
import { load } from 'cheerio';
import * as HLS from 'hls-parser';
import * as Ali from '../../util/ali.js';
import * as Quark from '../../util/quark.js';
import axios from 'axios';
import dayjs from 'dayjs';

let sieturl = 'https://www.pikaso.top';
/**
 * pikaso: {
 *     name: '皮卡资源',
 *     url: 'https://www.pikaso.top',
 * }
 */

async function request(reqUrl) {
    try {
        const response = await axios.get(reqUrl);
        return response.data;
    } catch (error) {
        console.error('Error during HTTP request:', error.message);
        return null;
    }
}

    async function init(inReq, _outResp) {
        await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
        return {};
    }

    async function home(filter) {
        let classes = [];
        let filterObj = {};
        return({
            class: classes,
            filters: filterObj,
        });
    }
    
    
    async function category(inReq, _outResp) {
        return '{}';
    }

function conversion(bytes){
  let mb = bytes / (1024 * 1024);
  if(mb > 1024){
    return `${(mb/1024).toFixed(2)}GB`;
    }else{
        return `${parseInt(mb).toFixed(0)}MB`;
    }
}
    async function detail(inReq, _outResp) {
        const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
        console.log(ids);
        const videos = [];
        for (const id of ids) {
            let vod = ({
                vod_id: id,
				vod_pic: 'https://img.omii.top/i/2024/03/17/vrgul5.webp',
            });        
            const froms = [];
            const urls = [];
            let newid = id.split('/folder')[0]; 
            let shareUrl = newid;
    
                const shareData = Ali.getShareData(shareUrl);
                console.log('Share data: ' + JSON.stringify(shareData));
                if (shareData) {
                    let videos = await Ali.getFilesByShareUrl(shareData);
                    if (videos.length > 0) {
                        froms.push('阿里云盘' + shareData.shareId);
                        urls.push(
                            videos
                                .map((v) => {
                                    //const ids = [v.share_id, v.file_id, v.subtitle ? v.subtitle.file_id : ''];
                                    //return formatPlayUrl('', v.name) + '$' + ids.join('*');
								   const ids = [v.share_id, v.file_id, v.subtitle ? v.subtitle.file_id : ''];
                                   const size = conversion(v.size);
                                   return formatPlayUrl('', ` ${v.name.replace(/.[^.]+$/,'')}  [${size}]`) + '$' + ids.join('*');
                                })
                                .join('#'),
                        );
                    }
                } else {
                    const shareData = Quark.getShareData(shareUrl);
                    console.log(shareData);
                    if (shareData) {
                        const videos = await Quark.getFilesByShareUrl(shareData);
                        if (videos.length > 0) {
                            froms.push('夸克网盘' + shareData.shareId);
                            urls.push(
                                videos
                                    .map((v) => {
                                        const ids = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                                        const size = conversion(v.size);
                                        return formatPlayUrl('', ` ${v.file_name.replace(/.[^.]+$/,'')}  [${size}]`) + '$' + ids.join('*');
                                    })
                                    .join('#'),
                            );
                        }
                    }
                }
    //        }
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
    
  function findElementIndex(arr, elem) {
  return arr.indexOf(elem);
}
    async function play(inReq, _outResp) {
        const flag = inReq.body.flag;
        const id = inReq.body.id;
        const ids = id.split('*');
        if (flag.startsWith('阿里云盘')) {
            const transcoding = await Ali.getLiveTranscoding(ids[0], ids[1]);
            aliTranscodingCache[ids[1]] = transcoding;
            transcoding.sort((a, b) => b.template_width - a.template_width);
			const p= ['超清','高清','标清','普画','极速'];
            const arr =['QHD','FHD','HD','SD','LD'];
            const urls = [];
            const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/ali';
            
            urls.push('原画');
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
			transcoding.forEach((t) => {
                idx = findElementIndex(arr,t.template_id);
                urls.push(p[idx]);
                urls.push(`${proxyUrl}/trans/${t.template_id.toLowerCase()}/${ids[0]}/${ids[1]}/.m3u8`);
            });
            return result;
        } else if (flag.startsWith('夸克网盘')) {
            const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
            quarkTranscodingCache[ids[2]] = transcoding;
			const p= ['4K','超清','高清','标清','普画','极速'];
            const arr =['4k','2k','super','high','low','normal'];
            const urls = [];
            const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/quark';
            
			urls.push('代理');
            urls.push(`${proxyUrl}/src/down/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
            urls.push('原画');
            urls.push(`${proxyUrl}/src/redirect/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
            
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
			transcoding.forEach((t) => {
                idx = findElementIndex(arr,t.resolution);
                urls.push(p[idx]);
                urls.push(`${proxyUrl}/trans/${t.resolution.toLowerCase()}/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.mp4`);
            });
            return result;
        }
    }



    async function search(inReq, _outResp) {
        let pg = inReq.body.page;
        const wd = inReq.body.wd;
        const limit = 10;
        if (pg <= 0) pg = 1;
        let urll = `${sieturl}/search/?pan=aliyundrive&type=folder&q=${encodeURIComponent(wd)}&page=${pg}`;
        let html = await request(urll);
        console.log(html);
        if (html) {
            const $ = load(html);
            let results = [];
            $('.search-item').each((_, element) => {
                let title = $(element).find('h2').text();
                console.log(title);
                let url = $(element).find('a').attr('href');
                console.log(url);
                let pic = $(element).find('img').attr('src');
                let desc = $(element).find('p').text();
    
                if (pic) { 
                    results.push({
                        vod_name: title,
                        vod_pic: sieturl + pic, 
                        vod_id: url,
                        vod_remarks: desc
                    });
                }
            });
            const pgCount = $('.page-num-box').length > 0 ? pg + 1 : pg;
            return {
            page: pg,
            pagecount: pgCount,
            limit: limit,
            total: limit * pgCount,
            list: results
          };
        } else {
            return [];
        }
    }

    function formatTitle(text) {
        return text.replaceAll(/<\/?[^>]+>/g, '')
                  .replaceAll('\u2714', '')
                  .replace('名称：', '')
                  .replace('资源标题：', '')
                  .replace('中文片名：', '');
    }

    async function test(inReq, outResp) {
        try {
            const printErr = function (json) {
                if (json.statusCode && json.statusCode == 500) {
                    console.error(json);
                }
            };
            const prefix = inReq.server.prefix;
            const dataResult = {};
            let resp = await inReq.server.inject().post(`${prefix}/init`);
            dataResult.init = resp.json();
            printErr(resp.json());
            resp = await inReq.server.inject().post(`${prefix}/home`);
            dataResult.home = resp.json();
            printErr("" + resp.json());
            if (dataResult.home.class.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                    id: dataResult.home.class[0].type_id,
                    page: 1,
                    filter: true,
                    filters: {},
                });
                dataResult.category = resp.json();
                printErr(resp.json());
            }
            resp = await inReq.server.inject().post(`${prefix}/search`).payload({
                wd: '与凤行',
                page: 1,
            });
            dataResult.search = resp.json();
            printErr(resp.json());
    
            if (dataResult.search.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.search.list[1].vod_id, // dataResult.category.list.map((v) => v.vod_id),
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
            return dataResult;
        } catch (err) {
            console.error(err);
            outResp.code(500);
            return { err: err.message, tip: 'check debug console output' };
        }
    }
    
    export default {
        meta: {
            key: 'pikaso',
            name: '🔍 皮卡',
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