import req from '../../util/req.js';
import { MAC_UA, formatPlayUrl } from '../../util/misc.js';
import { load } from 'cheerio';
import * as HLS from 'hls-parser';
import * as Ali from '../../util/ali.js';
import * as Quark from '../../util/quark.js';
import dayjs from 'dayjs';

let flag = '';

async function init(inReq, _outResp) {
    await Ali.initAli(inReq.server.db, inReq.server.config.ali);
    await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
    return {};
}

async function support(_inReq, _outResp) {
    // const clip = inReq.body.clip;
    return 'true';
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    const regex = new RegExp('/s/');
    for (const id of ids) {
        let vod = {
            vod_id: id,
            vod_content: id,
            vod_name: '推送',
            vod_pic: 'https://pic.rmb.bdstatic.com/bjh/1d0b02d0f57f0a42201f92caba5107ed.jpeg',
        };
    if(!regex.test(id)){
        vod.vod_play_from = '推送';
        vod.vod_play_url = '测试$' + id;
        videos.push(vod);
    }
    else{
        const shareUrl = id;
        const froms = [];
        const urls = [];
            const shareData = Ali.getShareData(shareUrl);
            if (shareData) {
                const videos = await Ali.getFilesByShareUrl(shareData);
                if (videos.length > 0) {
                    froms.push('Ali-' + shareData.shareId);
                    console.log(flag);
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
        vod.vod_play_from = froms.join('$$$');
        flag = vod.vod_play_from;
        vod.vod_play_url = urls.join('$$$');
        videos.push(vod);
        }
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
    const id = inReq.body.id;
    const ids = id.split('*');
    if (flag.startsWith('Ali-')) {
        const transcoding = await Ali.getLiveTranscoding(ids[0], ids[1]);
        aliTranscodingCache[ids[1]] = transcoding;
        transcoding.sort((a, b) => b.template_width - a.template_width);
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
            urls.push(t.template_id);
            urls.push(`${proxyUrl}/trans/${t.template_id.toLowerCase()}/${ids[0]}/${ids[1]}/.m3u8`);
        });
        return result;
    } else if (flag.startsWith('Quark-')) {
        const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
        quarkTranscodingCache[ids[2]] = transcoding;
        const urls = [];
        const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/quark';
     
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
		   transcoding.forEach((t) => {
            urls.push(t.resolution.toUpperCase());
            urls.push(`${proxyUrl}/trans/${t.resolution.toLowerCase()}/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.mp4`);
        });
        return result;
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
        let resp = await inReq.server.inject().post(`${prefix}/support`).payload({
            clip: 'https://www.alipan.com/s/xxxx9',
        });
        dataResult.support = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
            id: 'https://www.alipan.com/s/xxxx9',
        });
        dataResult.detail = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/play`).payload({
            flag: 'xx',
            id: 'https://www.alipan.com/s/xxxx9',
        });
        dataResult.play = resp.json();
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
        key: 'push',
        name: '🟢 推送',
        type: 4,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/support', support);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};
