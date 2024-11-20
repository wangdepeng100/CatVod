// import {_,} from "../lib/cat.js"
// import * as _ from 'lodash';
import * as Ali from '../util/ali.js';
import * as Quark from '../util/quark.js';
import * as HLS from 'hls-parser';
import { MAC_UA, formatPlayUrl } from '../util/misc.js';
import dayjs from 'dayjs';

import Crypto from 'crypto-js';
import req from '../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;

const transcodingCache = {};
const downloadingCache = {};

const aliTranscodingCache = {};
const aliDownloadingCache = {};

const quarkTranscodingCache = {};
const quarkDownloadingCache = {};

class Spider {
    constructor() {}

    getName() { return `🍥┃基础┃🍥` }

    getAppName() { return `基础` }

    getJSName() { return "base" }

    getType() { return 3 }

    // 调用资源进行嗅探处理{ request: parse: site: url:}
    async stringify(res) {

        // 判断请求地址是否是以http开头.
        let playUrl = res.url;
        if (_.isEmpty(playUrl) || !playUrl.toLowerCase().startsWith("http")) { res.parse = 1 }
        if (res.parse == 1) {
            // 嗅探处理部份
            const sniffer = await res.request.server.messageToDart({
                action: 'sniff',
                opt: {
                    url: res.site,
                    timeout: 10000,
                    // rule: "http((?!http).){12,}?\\.(m3u8|mp4|mkv|flv|mp3|m4a|aac)\\?.*|http((?!http).){12,}\\.(m3u8|mp4|mkv|flv|mp3|m4a|aac)|http((?!http).)*?video/tos*|http((?!http).)*?obj/tos*",
                    rule: 'http((?!http).){12,}?\\.(m3u8|mp4|mkv|flv|m4a|aac)\\?.*|http((?!http).){12,}\\.(m3u8|mp4|mkv|flv|m4a|aac)|http((?!http).)*?video/tos*|http((?!http).)*?obj/tos*',
                },
            });
            if (sniffer && sniffer.url) {
                if (sniffer.url.indexOf('url=http')!==-1) {
                    sniffer.url=sniffer.url.match(/url=(.*?)&/)[1];
                }
                const hds = {};
                if (sniffer.headers) {
                    if (sniffer.headers['user-agent']) {
                        hds['User-Agent'] = sniffer.headers['user-agent'];
                    }
                    if (sniffer.headers['referer']) {
                        hds['Referer'] = sniffer.headers['referer'];
                    }
                }
                playUrl = sniffer.url;
            }
        }

        // 采用接口识别返回,这里是免去波菜广告,如果接口是非200,原url返回
        if ((/\.(m3u8)$/i).test(playUrl)) {
            const index = playUrl.lastIndexOf('.m3u8');
            let data = await req("https://jx.m3u8.biz/gg.php?url=" + playUrl.slice(0, index) + '.m3u8')
            if (data.data.code == 200) {
                data = data.data; // JSON.parse()
                return data.url;
            }
        }
        return playUrl;
    }

    base64Decode(text) {
        return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text));
    }

    async test(inReq, outResp) {
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
            printErr(resp.json());
            if (dataResult.home.class.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                    id: dataResult.home.class[1].type_id,                
                    page: 1,
                    filter: true,
                    filters: {},
                });
                dataResult.category = resp.json();
                printErr(resp.json());
                if (dataResult.category.list.length > 0) {
                    resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                        id: dataResult.category.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),                    
                        // id: 68208
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
                                    resp = await inReq.server.inject().post(`${prefix}/play`).payload({
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
                wd: '爱',
                page: 1,
            });
            dataResult.search = resp.json();
            if (dataResult.search.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.search.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),                    
                });
            }
            printErr(resp.json());
            return dataResult;
        } catch (err) {
            console.error(err);
            outResp.code(500);
            return { err: err.message, tip: 'check debug console output' };
        }
    }

    async testSearch(inReq, outResp) {
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
            printErr(resp.json());

            resp = await inReq.server.inject().post(`${prefix}/search`).payload({
                wd: '暴走',
                page: 1,
            });
            dataResult.search = resp.json();
            printErr(resp.json());

            if (dataResult.search.list &&dataResult.search.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.search.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),
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
                                resp = await inReq.server.inject().post(`${prefix}/play`).payload({
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

    async proxy666(inReq, outResp) {
        await Ali.initAli(inReq.server.db, inReq.server.config.ali);
        const what = inReq.params.what;
        const shareId = inReq.params.shareId;
        const fileId = inReq.params.fileId;
        if (what == 'trans') {
            const flag = inReq.params.flag;
            const end = inReq.params.end;

            if (transcodingCache[fileId]) {
                const purl = transcodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0].url;
                if (parseInt(purl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                    delete transcodingCache[fileId];
                }
            }

            if (transcodingCache[fileId] && end.endsWith('.ts')) {
                const transcoding = transcodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0];
                if (transcoding.plist) {
                    const tsurl = transcoding.plist.segments[parseInt(end.replace('.ts', ''))].suri;
                    if (parseInt(tsurl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                        delete transcodingCache[fileId];
                    }
                }
            }

            if (!transcodingCache[fileId]) {
                const transcoding = await Ali.getLiveTranscoding(shareId, fileId);
                transcodingCache[fileId] = transcoding;
            }

            const transcoding = transcodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0];
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
            if (downloadingCache[fileId]) {
                const purl = downloadingCache[fileId].url;
                if (parseInt(purl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                    delete downloadingCache[fileId];
                }
            }
            if (!downloadingCache[fileId]) {
                const down = await Ali.getDownload(shareId, fileId, flag == 'down');
                downloadingCache[fileId] = down;
            }
            outResp.redirect(downloadingCache[fileId].url);
            return;
        }
    }

    async play666(inReq, _outResp) {
        const id = inReq.body.id;
        const ids = id.split('*');
        const transcoding = await Ali.getLiveTranscoding(ids[0], ids[1]);
        transcoding.sort((a, b) => b.template_width - a.template_width);
        const urls = [];
        const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy';
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
    }

    async proxy(inReq, outResp) {
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
    
    findElementIndex(arr, elem) {
      return arr.indexOf(elem);
    }
    
    async play(inReq, _outResp) {
        const flag = inReq.body.flag;
        const id = inReq.body.id;
        const ids = id.split('*');
        let idx = 0;
        if (flag.startsWith('Ali-')) {
            const transcoding = await Ali.getLiveTranscoding(ids[0], ids[1]);
            aliTranscodingCache[ids[1]] = transcoding;
            transcoding.sort((a, b) => b.template_width - a.template_width);
            const p= ['1440P','1080P','720P','480P','360P'];
            const arr =['QHD','FHD','HD','SD','LD'];
            const urls = [];
            const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/ali';
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
            transcoding.forEach((t) => {
                idx = this.findElementIndex(arr,t.template_id);
                urls.push(p[idx]);
                urls.push(`${proxyUrl}/trans/${t.template_id.toLowerCase()}/${ids[0]}/${ids[1]}/.m3u8`);
            });
            return result;
        } else if (flag.startsWith('Quark-')) {
            const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
            quarkTranscodingCache[ids[2]] = transcoding;
            const urls = [];
            const p= ['2160P','1440P','1080P','720P','480P','360P'];
            const arr =['4k','2k','super','high','low','normal'];
            const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/quark';
            urls.push('Proxy');
            urls.push(`${proxyUrl}/src/down/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
            urls.push('SRC');
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
                idx = this.findElementIndex(arr,t.resolution);
                urls.push(p[idx]);
                urls.push(`${proxyUrl}/trans/${t.resolution.toLowerCase()}/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.mp4`);
            });
            return result;
        } else { //  if (id.indexOf('.m3u8') < 0) 
            let noAdurl = await super.stringify({
                request: inReq,
                parse: 1,
                site: id,
                url: id,
            });
    
            return JSON.stringify({
                parse: 0,
                url: noAdurl,
            });

            /* 嗅探处理部份
            const sniffer = await inReq.server.messageToDart({
                action: 'sniff',
                opt: {
                    url: id,
                    timeout: 20000,
                    rule: 'http((?!http).){12,}?\\.(m3u8|mp4|mkv|flv|m4a|aac)\\?.*|http((?!http).){12,}\\.(m3u8|mp4|mkv|flv|m4a|aac)|http((?!http).)*?video/tos*|http((?!http).)*?obj/tos*',
                },
            });
            if (sniffer && sniffer.url) {
                if (sniffer.url.indexOf('url=http')!==-1) {
                    sniffer.url=sniffer.url.match(/url=(.*?)&/)[1];
                }
                const hds = {};
                if (sniffer.headers) {
                    if (sniffer.headers['user-agent']) {
                        hds['User-Agent'] = sniffer.headers['user-agent'];
                    }
                    if (sniffer.headers['referer']) {
                        hds['Referer'] = sniffer.headers['referer'];
                    }
                }
                return {
                    parse: 0,
                    url: sniffer.url,
                    header: hds,
                };
            }*/
        }
        return {
            parse: 0,
            url: id,
        }
    }

    async getShareDataByUrl(shareUrl) {
        const froms = [];
        const urls = [];
        const shareData = Ali.getShareData(shareUrl);
        if (shareData) {
            const videos = await Ali.getFilesByShareUrl(shareData);
            if (videos.length > 0) {
                froms.push('Ali-' + shareData.shareId);
                urls.push(
                    videos.map((v) => {
                        const ids = [v.share_id, v.file_id, v.subtitle ? v.subtitle.file_id : ''];
                        return formatPlayUrl('', v.name) + '$' + ids.join('*');
                    }).join('#'),
                );
            }
        } else {
            const shareData = Quark.getShareData(shareUrl);
            if (shareData) {
                const videos = await Quark.getFilesByShareUrl(shareData);
                if (videos.length > 0) {
                    froms.push('Quark-' + shareData.shareId);
                    urls.push(
                        videos.map((v) => {
                            const ids = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                            return formatPlayUrl('', v.file_name) + '$' + ids.join('*');
                        }).join('#'),
                    );
                }
            }
        }
        return {
            shareUrl: shareUrl,
            froms: froms,
            urls: urls
        }
    }

    async panDetail(shareUrls) {
        let teams = [];
        (typeof shareUrls === 'string') ? teams.push(shareUrls) : teams = shareUrls;
        const promiseList = _.map(teams, (t) => {
            return this.getShareDataByUrl(t);
        });

        const froms = [];
        const urls = [];
        await Promise.allSettled(promiseList).then(res=> {
            // console.log(res)

            // 未考察返回值的顺序,暂时按shareUrls的顺序进行取值
            for (const shareUrl of teams) {
                _.map(res, (vk) => {
                    try {
                        if (vk.status === 'fulfilled' && vk.value !== undefined) {
                            if (vk.value.shareUrl === shareUrl) {
                                froms.push(vk.value.froms);
                                urls.push(vk.value.urls);
                            }
                        }
                    } catch (error) {
                    }
                });
            }
        });

        return {
            play_from: froms.join('$$$'),
            play_url: urls.join('$$$')
        }
    }
}

export {
    Spider
}