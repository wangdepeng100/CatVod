// 自动从 地址发布页 获取&跳转url地址
// import { load, _ } from './lib/cat.js';
import req from '../../util/req.js';
import CryptoJS from 'crypto-js';

import Crypto from 'crypto-js';
import { load } from 'cheerio';

import pkg from 'lodash';
const { _ } = pkg;
import * as Ali from '../../util/ali.js';
import * as Quark from '../../util/quark.js';
import * as HLS from 'hls-parser';
import { MAC_UA, formatPlayUrl } from '../../util/misc.js';

var key = 'libvio';
// var HOST = 'https://libvio.app'; // 地址发布页
var host = '';
var siteKey = '';
var siteType = 0;

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 11; M2007J3SC Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045714 Mobile Safari/537.36';

async function request(reqUrl, agentSp) {
    var res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || MOBILE_UA,
            'Referer': host
        },
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, outResp) {
    // siteKey = cfg.skey;
    // siteType = cfg.stype;
    var html = await request(inReq.server.config.libvio.url);
    var $ = load(html);
    host = $('div.content-top > ul > li').find('a:first')[0].attribs.href;
    console.debug('libvio跳转地址 =====>' + host); // js_debug.log

    await Ali.initAli(inReq.server.db, inReq.server.config.ali);
    await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
    return {};
}

async function home(inReq, _outResp) {
    var html = await request(host);
    var $ = load(html);
    var class_parse = $('ul.stui-header__menu > li > a[href*=type]');
    var classes = [];
    classes = _.map(class_parse, (cls) => {
        var typeId = cls.attribs['href'];
        typeId = typeId.substring(typeId.lastIndexOf('/') + 1).replace('.html','');
        return {
            type_id: typeId,
            type_name: cls.children[0].data,
        };
    });
    var filterObj = {
        1:[{key:'area',name:'地区',value:[{n:'全部',v:''},{n:'中国大陆',v:'中国大陆'},{n:'中国香港',v:'中国香港'},{n:'中国台湾',v:'中国台湾'},{n:'美国',v:'美国'},{n:'法国',v:'法国'},{n:'英国',v:'英国'},{n:'日本',v:'日本'},{n:'韩国',v:'韩国'},{n:'德国',v:'德国'},{n:'泰国',v:'泰国'},{n:'印度',v:'印度'},{n:'意大利',v:'意大利'},{n:'西班牙',v:'西班牙'},{n:'加拿大',v:'加拿大'},{n:'其他',v:'其他'}]},{key:'year',name:'年份',value:[{n:'全部',v:''},{n:'2023',v:'2023'},{n:'2022',v:'2022'},{n:'2021',v:'2021'},{n:'2020',v:'2020'},{n:'2019',v:'2019'},{n:'2018',v:'2018'},{n:'2017',v:'2017'},{n:'2016',v:'2016'},{n:'2015',v:'2015'},{n:'2014',v:'2014'},{n:'2013',v:'2013'},{n:'2012',v:'2012'},{n:'2011',v:'2011'},{n:'2010',v:'2010'}]},{key:'lang',name:'语言',value:[{n:'全部',v:''},{n:'国语',v:'国语'},{n:'英语',v:'英语'},{n:'粤语',v:'粤语'},{n:'闽南语',v:'闽南语'},{n:'韩语',v:'韩语'},{n:'日语',v:'日语'},{n:'法语',v:'法语'},{n:'德语',v:'德语'},{n:'其它',v:'其它'}]},{key:'by',name:'排序',value:[{n:'时间',v:'time'},{n:'人气',v:'hits'},{n:'评分',v:'score'}]}],
        2:[{key:'area',name:'地区',value:[{n:'全部',v:''},{n:'中国大陆',v:'中国大陆'},{n:'中国台湾',v:'中国台湾'},{n:'中国香港',v:'中国香港'},{n:'韩国',v:'韩国'},{n:'日本',v:'日本'},{n:'美国',v:'美国'},{n:'泰国',v:'泰国'},{n:'英国',v:'英国'},{n:'新加坡',v:'新加坡'},{n:'其他',v:'其他'}]},{key:'year',name:'年份',value:[{n:'全部',v:''},{n:'2023',v:'2023'},{n:'2022',v:'2022'},{n:'2021',v:'2021'},{n:'2020',v:'2020'},{n:'2019',v:'2019'},{n:'2018',v:'2018'},{n:'2017',v:'2017'},{n:'2016',v:'2016'},{n:'2015',v:'2015'},{n:'2014',v:'2014'},{n:'2013',v:'2013'},{n:'2012',v:'2012'},{n:'2011',v:'2011'},{n:'2010',v:'2010'}]},{key:'lang',name:'语言',value:[{n:'全部',v:''},{n:'国语',v:'国语'},{n:'英语',v:'英语'},{n:'粤语',v:'粤语'},{n:'闽南语',v:'闽南语'},{n:'韩语',v:'韩语'},{n:'日语',v:'日语'},{n:'其它',v:'其它'}]},{key:'by',name:'排序',value:[{n:'时间',v:'time'},{n:'人气',v:'hits'},{n:'评分',v:'score'}]}],
        4:[{key:'area',name:'地区',value:[{n:'全部',v:''},{n:'中国',v:'中国'},{n:'日本',v:'日本'},{n:'欧美',v:'欧美'},{n:'其他',v:'其他'}]},{key:'year',name:'年份',value:[{n:'全部',v:''},{n:'2023',v:'2023'},{n:'2022',v:'2022'},{n:'2021',v:'2021'},{n:'2020',v:'2020'},{n:'2019',v:'2019'},{n:'2018',v:'2018'},{n:'2017',v:'2017'},{n:'2016',v:'2016'},{n:'2015',v:'2015'},{n:'2014',v:'2014'},{n:'2013',v:'2013'},{n:'2012',v:'2012'},{n:'2011',v:'2011'},{n:'2010',v:'2010'},{n:'2009',v:'2009'},{n:'2008',v:'2008'},{n:'2007',v:'2007'},{n:'2006',v:'2006'},{n:'2005',v:'2005'},{n:'2004',v:'2004'}]},{key:'lang',name:'语言',value:[{n:'全部',v:''},{n:'国语',v:'国语'},{n:'英语',v:'英语'},{n:'粤语',v:'粤语'},{n:'闽南语',v:'闽南语'},{n:'韩语',v:'韩语'},{n:'日语',v:'日语'},{n:'其它',v:'其它'}]},{key:'by',name:'排序',value:[{n:'时间',v:'time'},{n:'人气',v:'hits'},{n:'评分',v:'score'}]}],
        27:[{key:'by',name:'排序',value:[{n:'时间',v:'time'},{n:'人气',v:'hits'},{n:'评分',v:'score'}]}],
        15:[{key:'area',name:'地区',value:[{n:'全部',v:''},{n:'日本',v:'日本'},{n:'韩国',v:'韩国'}]},{key:'year',name:'年份',value:[{n:'全部',v:''},{n:'2023',v:'2023'},{n:'2022',v:'2022'},{n:'2021',v:'2021'},{n:'2020',v:'2020'},{n:'2019',v:'2019'},{n:'2018',v:'2018'},{n:'2017',v:'2017'},{n:'2016',v:'2016'},{n:'2015',v:'2015'},{n:'2014',v:'2014'},{n:'2013',v:'2013'},{n:'2012',v:'2012'},{n:'2011',v:'2011'},{n:'2010',v:'2010'}]},{key:'lang',name:'语言',value:[{n:'全部',v:''},{n:'国语',v:'国语'},{n:'英语',v:'英语'},{n:'粤语',v:'粤语'},{n:'闽南语',v:'闽南语'},{n:'韩语',v:'韩语'},{n:'日语',v:'日语'},{n:'其它',v:'其它'}]},{key:'by',name:'排序',value:[{n:'时间',v:'time'},{n:'人气',v:'hits'},{n:'评分',v:'score'}]}],
        16:[{key:'area',name:'地区',value:[{n:'全部',v:''},{n:'美国',v:'美国'},{n:'英国',v:'英国'},{n:'德国',v:'德国'},{n:'加拿大',v:'加拿大'},{n:'其他',v:'其他'}]},{key:'year',name:'年份',value:[{n:'全部',v:''},{n:'2023',v:'2023'},{n:'2022',v:'2022'},{n:'2021',v:'2021'},{n:'2020',v:'2020'},{n:'2019',v:'2019'},{n:'2018',v:'2018'},{n:'2017',v:'2017'},{n:'2016',v:'2016'},{n:'2015',v:'2015'},{n:'2014',v:'2014'},{n:'2013',v:'2013'},{n:'2012',v:'2012'},{n:'2011',v:'2011'},{n:'2010',v:'2010'}]},{key:'lang',name:'语言',value:[{n:'全部',v:''},{n:'国语',v:'国语'},{n:'英语',v:'英语'},{n:'粤语',v:'粤语'},{n:'闽南语',v:'闽南语'},{n:'韩语',v:'韩语'},{n:'日语',v:'日语'},{n:'其它',v:'其它'}]},{key:'by',name:'排序',value:[{n:'时间',v:'time'},{n:'人气',v:'hits'},{n:'评分',v:'score'}]}]
    };
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function homeVod() {
    var link = host + '/show/1--hits---------.html';
    var html = await request(link);
    var $ = load(html);
    var items = $('ul.stui-vodlist > li');
    let videos = _.map(items, (item) => {
        var a = $(item).find('a:first')[0];
        var remarks = $($(item).find('span.pic-text')[0]).text().trim();
        return {
            vod_id: a.attribs.href.replace(/.*?\/detail\/(.*).html/g, '$1'),
            vod_name: a.attribs.title,
            vod_pic: a.attribs['data-original'],
            vod_remarks: remarks || '',
        };
    });
    return JSON.stringify({
        list: videos,
    });
}

async function category(inReq, _outResp) {
    // tid, pg, filter, extend
    // if (pg <= 0 || typeof(pg) == 'undefined') pg = 1;
    let tid = inReq.body.id;
    const pg = inReq.body.page;
    let extend = inReq.body.filters;

	if(pg <= 0) pg = 1;
    var link = host + '/show/' + tid + '-' + (extend.area || '') + '-' + (extend.by || 'time') + '--' + (extend.lang || '') + '----' + pg + '---' + (extend.year || '') + '.html';
    var html = await request(link);
    var $ = load(html);
    var items = $('ul.stui-vodlist > li');
    let videos = _.map(items, (item) => {
        var a = $(item).find('a:first')[0];
        var remarks = $($(item).find('span.pic-text')[0]).text().trim();
        return {
            vod_id: a.attribs.href.replace(/.*?\/detail\/(.*).html/g, '$1'),
            vod_name: a.attribs.title,
            vod_pic: a.attribs['data-original'],
            vod_remarks: remarks || '',
        };
    });
    var hasMore = $('ul.stui-page__item > li > a:contains(下一页)').length > 0;
    var pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 24,
        total: 24 * pgCount,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        var html = await request(host + '/detail/' + id + '.html');
        var $ = load(html);
        var vod = {
            vod_id: id,
            vod_name: $('h1:first').text().trim(),
            vod_type: $('.stui-content__detail p:first a').text(),
            vod_actor: $('.stui-content__detail p:nth-child(3)').text().replace('主演：',''),
            vod_pic: $('.stui-content__thumb img:first').attr('data-original'),
            vod_remarks : $('.stui-content__detail p:nth-child(5)').text() || '',
            vod_content: $('span.detail-content').text().trim(),
        };

        // 原方法处理(后续要处理掉)
        var playMap = {};
        var tabs = $('div.stui-pannel__head > h3[class*=iconfont]');
        var playlists = $('ul.stui-content__playlist');
        _.each(tabs, (tab, i) => {
            var from = tab.children[0].data;
            var list = playlists[i];
            list = $(list).find('a');
            _.each(list, (it) => {
                var title = it.children[0].data;
                var playUrl = it.attribs.href;
                if (title.length == 0) title = it.children[0].data.trim();
                if (!playMap.hasOwnProperty(from)) {
                    playMap[from] = [];
                }
                playMap[from].push( title + '$' + playUrl);
            });
        });
        vod.vod_play_from = _.keys(playMap).join('$$$');
        var urls = _.values(playMap);
        var vod_play_url = _.map(urls, (urlist) => {
            return urlist.join('#');
        });
        vod.vod_play_url = vod_play_url.join('$$$');
        videos.push(vod);

        /* 借ysche的方法重新处理视频播放地址
        const shareUrls = $('div.module-row-info p')
            .map((_, p) => p.children[0].data)
            .get();
        const froms = [];
        const urls = [];
        for (const shareUrl of shareUrls) {
            const shareData = Ali.getShareData(shareUrl);
            if (shareData) {
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
            } else {
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
        }*/
    }
    return JSON.stringify({
        list: videos,
    });
}

async function play(inReq, _outResp) {
    const tid = inReq.body.id;
    var html = await request(host + tid);
    html = html.match(/r player_.*?=(.*?)</)[1];
    var js = JSON.parse(html);
    var url = js.url;
    var from = js.from;
    var next = js.link_next;
    var id = js.id;
    var nid = js.nid;


    // 进入判断
    if (url.match('quark')) {

        // 根据地址进行处理
        const shareData = Quark.getShareData(url);
        if (shareData) {
            const videos = await Quark.getFilesByShareUrl(shareData);
            if (videos.length > 0) {
                
                let iddd = videos
                                .map((v) => {
                                    const ids = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                                    return formatPlayUrl('', v.file_name) + '$' + ids.join('*');
                                })
                                .join('#');

                
                const ids = iddd.split('*');
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
    } else {
        var paurl = await request(host +'/static/player/' + from + '.js');
        paurl = paurl.match(/ src="(.*?)'/)[1];
        var purl = paurl + url + '&next=' + next + '&id=' + id + '&nid=' + nid;
        if (!purl.startsWith('http')) purl = host + purl;
        var playUrl = await request(purl);
        playUrl = playUrl.match(/var .* = '(.*?)'/)[1];
        // console.debug('libvio playUrl =====>' + playUrl); // js_debug.log
        return JSON.stringify({
            parse: 0,
            url: playUrl,
        });
    }
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;

    var data = (await request(host + '/index.php/ajax/suggest?mid=1&wd=' + wd + '&limit=50')).list;
    var videos = [];
    for (const vod of data) {
        videos.push({
            vod_id: vod.id,
            vod_name: vod.name,
            vod_pic: vod.pic,
            vod_remarks: '',
        });
    }
    return JSON.stringify({
        list: videos,
        limit: 50,
    });
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
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    // id: dataResult.category.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),
                    id: 714890831
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
            wd: '暴走',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'libvio',
        name: 'LIBVIO影视(暂时BD路线可用)',
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