import req from '../../util/req.js';
import { MAC_UA, formatPlayUrl } from '../../util/misc.js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;
import * as HLS from 'hls-parser';
import * as Ali from '../../util/ali.js';
import { getDownload, getFilesByShareUrl, getLiveTranscoding, getShareData, initAli} from '../../util/ali.js';
import dayjs from 'dayjs';
import CryptoJS from 'crypto-js';

let patternAli = /(https:\/\/www\.(aliyundrive|alipan)\.com\/s\/[^"]+)/

let url = 'https://upapi.juapp9.com';

async function request(reqUrl) {
    let res = await req.get(reqUrl, {
        headers: {
            'Referer': url,
        },
    });
    return res.data;
}


async function init(inReq, _outResp) {
    await initAli(inReq.server.db, inReq.server.config.ali);
    return {}
}


async function home(inReq,_outResp){
    return {}
}
function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
}

async function category(inReq, _outResp) {
    return{}
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
    const shareUrl = inReq.body.id;
    const videos = [];
        let vod = ({
            vod_id: shareUrl,
        });
        const froms = [];
        const urls = [];
            const shareData = Ali.getShareData(shareUrl);
            if (shareData) {
                const videos = await Ali.getFilesByShareUrl(shareData);
                if (videos.length > 0) {
                    froms.push('阿里云盘' + shareData.shareId);
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
        vod.vod_play_from = froms.join('$$$');
        vod.vod_play_url = urls.join('$$$');
        videos.push(vod);
    return {
        list: videos,
    };
}

function isShareUrl(url){
    const regex = new RegExp('/s|^[^.]+$/g');
    return regex.test(url);
}


async function parseHtmlList(pg, wd) {
    const resp = await request(url + '/search?keyword=' + encodeURIComponent(wd) + '&page=' + pg + '&s_type=2');
    const data = base64Decode(resp);
    const items = JSON.parse(data).result.items;
    const videos = [];
    for (const item of items) {
        const url = item.page_url;
        if (!isShareUrl(url)) continue;
        const title = _.isEmpty(item.content) ? item.title : item.content[0].title;
        videos.push({
            vod_id: url,
            vod_name: title.replaceAll(/<\/?[^>]+>/g, ''),
            vod_pic: 'https://img.omii.top/i/2024/03/17/vrgul5.webp',
            vod_remarks: item.insert_time,
        });
    }
    const hasMore = !_.isEmpty(items);
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return {
        page: parseInt(pg),
        pagecount: pgCount,
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
}




async function search(inReq, _outResp) {
    let pg = inReq.body.page;
    const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    return parseHtmlList(pg,wd);
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
        printErr(resp.json());
        if (dataResult.home.class && dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list &&dataResult.category.list.length > 0) {
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
            wd: '爱',
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
        key: 'upyun',
        name: '🔍 云搜',
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
