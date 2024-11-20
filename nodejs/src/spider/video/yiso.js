import req from '../../util/req.js';
import { MAC_UA, UA, formatPlayUrl, jsonParse } from '../../util/misc.js';
import CryptoJS from 'crypto-js';
import * as HLS from 'hls-parser';
import * as Ali from '../../util/ali.js';
import * as Quark from '../../util/quark.js';
import dayjs from 'dayjs';

//let siteKey = 'yiso';
//let siteType = 0;
let url = '';
//let patternAli = /(https:\/\/www\.(aliyundrive|alipan)\.com\/s\/[^"]+)/;
let cookie = '';

//const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';


async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': UA,
            'Referer': url,
            'Cookie': cookie,
        },
    });
    let content = res.data;
 //    console.log(content);
    return content;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    cookie = inReq.server.config.yiso.cookie;
    url = inReq.server.config.yiso.url;
    await Ali.initAli(inReq.server.db, inReq.server.config.ali);
    await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
    const configs = cookie.split('');
//    console.log(configs);
    if (configs.length == 1) {
        cookie = configs[0];
    };
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
    const videos = [];
    const shareUrls = ids;
        let vod = ({
            vod_id: shareUrls,
        });
        const froms = [];
        const urls = [];
        for (const shareUrl of shareUrls) {
            const shareData = Ali.getShareData(shareUrl);
            if (shareData) {
                const videos = await Ali.getFilesByShareUrl(shareData);
                if (videos.length > 0) {
                    froms.push('阿里云盘');
                    urls.push(
                        videos
                            .map((v) => {
                                const ids = [v.share_id, v.file_id, v.subtitle ? v.subtitle.file_id : ''];
                                const size = conversion(v.size);
                                return formatPlayUrl('', ` ${v.name.replace(/.[^.]+$/,'')}  [${size}]`) + '$' + ids.join('*');
                            })
                            .join('#'),
                    );
                }
            }
        }
        vod.vod_play_from = froms.join('$$$');
        vod.vod_play_url = urls.join('$$$');
        videos.push(vod);
    return {
        list: videos,
    };
}

const transcodingCache = {};
const downloadingCache = {};

async function proxy(inReq, outResp) {
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
        if (downloadingCache[fileId]) {
            const purl = downloadingCache[fileId].url;
            if (parseInt(purl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                delete downloadingCache[fileId];
            }
        }
        if (!downloadingCache[fileId]) {
            const down = await Ali.getDownload(shareId, fileId);
            downloadingCache[fileId] = down;
        }
        outResp.redirect(downloadingCache[fileId].url);
        return;
    }
}

function findElementIndex(arr, elem) {
  return arr.indexOf(elem);
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const ids = id.split('*');
    const transcoding = await Ali.getLiveTranscoding(ids[0], ids[1]);
    transcoding.sort((a, b) => b.template_width - a.template_width);
	const p= ['超清','高清','标清','普画','极速'];
    const arr =['QHD','FHD','HD','SD','LD'];
    const urls = [];
    const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy';
 
    urls.push('原画');
    urls.push(`${proxyUrl}/src/nil/${ids[0]}/${ids[1]}/.bin`);
    const result = {
        parse: 0,
        url: urls,
    };
    if (ids[2]) {
        result.extra = {
            subt: `${proxyUrl}/src/nil/${ids[0]}/${ids[2]}/.bin`,
        };
    }
	 	transcoding.forEach((t) => {
        idx = findElementIndex(arr,t.template_id);
        urls.push(p[idx]);
        urls.push(`${proxyUrl}/trans/${t.template_id.toLowerCase()}/${ids[0]}/${ids[1]}/.m3u8`);
    });
    return result;
}

async function search(inReq, _outResp) {
    let pg = inReq.body.page;
    const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    const limit = 10;
    const resp = await request(url + "/api/search?name=" + encodeURIComponent(wd) + '&pageNo=' + pg + '&from=ali');
 //   console.log(resp);
    const json = resp.data;
//   console.log(json);
    const total = json.total;
    const videos = [];
    for(const item of json.list) {       
        const url = decryptUrl(item.url);
        const pname = item.fileInfos[0].fileName;
        const remark = item.gmtCreate;
        videos.push({
            vod_id: url,
            vod_name: pname,
            vod_pic: "https://img.omii.top/i/2024/03/17/vrgul5.webp",
            vod_remarks: remark,
        });
    }
    const pgCount = parseInt(total / limit) + 1;
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: limit,
        total: total,
        list: videos,
    });
}

function decryptUrl(url) {
    const data = {
        ciphertext: CryptoJS.enc.Base64.parse(url),
    };
    const key = CryptoJS.enc.Utf8.parse('4OToScUFOaeVTrHE');
    const iv = CryptoJS.enc.Utf8.parse('9CLGao1vHKqm17Oz');
    const mode = CryptoJS.mode.CBC;
    const padding = CryptoJS.pad.Pkcs7;
    const decrypted = CryptoJS.AES.decrypt(data, key, {
        'iv': iv,
        'mode': mode,
        'padding': padding
    });
    const decryptedUrl = CryptoJS.enc.Utf8.stringify(decrypted);
    return decryptedUrl;
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
            wd: '暴走',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());

        if (dataResult.search.list.length > 0) {
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
        key: 'yiso',
        name: '🔍 易搜',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};