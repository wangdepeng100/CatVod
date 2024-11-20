import req from '../../util/req.js';
import { load } from 'cheerio';
import { ua, init ,detail0 ,proxy ,play } from '../../util/pan.js';
import CryptoJS from 'crypto-js';
import dayjs from 'dayjs';


async function support(inReq, _outResp) {
    // const clip = inReq.body.clip;
    return 'true';
}

async function sniff(inReq, _outResp) {
    if (inReq.body.action == 'request') {
        if (inReq.body.url.indexOf('.html') > 0 || inReq.body.url.indexOf('url=') > 0) {
            const resp = await req.get(inReq.body.url, {
                headers: inReq.body.headers,
            });
            const respHeaders = resp.headers.toJSON();
            delete respHeaders['transfer-encoding'];
            delete respHeaders['cache-control'];
            delete respHeaders['content-length'];
            if (respHeaders['content-encoding'] == 'gzip') {
                delete respHeaders['content-encoding'];
            }
            _outResp.headers(respHeaders);
            return resp.data
                .replaceAll(`var p = navigator.platform;`, `var p ='';`)
                .replaceAll(
                    `</html>`,
                    `<script>
            const loop1 = setInterval(function () {
              if (
                document.querySelectorAll('[onclick*=playlist]').length > 0 &&
                window.playlist
              ) {
                clearInterval(loop1);
                document.querySelectorAll('[onclick*=playlist]')[0].click();
                return;
              }
            }, 200);</script></html>`
                )
                .replaceAll(`autoplay: false`, `autoplay: true`)
                .replaceAll(`<video`, `<video autoplay=true `);
        } else if (inReq.body.url.indexOf('video_mp4') > 0) {
            _outResp.header('sniff_end', '1');
            return 'block';
        }
    }
    return '';
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    let shareUrls = ids;
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
        videos.push(await detail0(shareUrls ,vod));
        }
    }
    return {
        list: videos,
    };
}

async function play0(inReq, _outResp){
        const result = await play(inReq, _outResp);
        if(!result){
        const id = inReq.body.id;
        if (id.startsWith('https://m.nmddd.com/vod-play')) {
        const sniffer = await inReq.server.messageToDart({
            action: 'sniff',
            opt: {
                ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
                url: id,
                timeout: 10000,
                // rule: 'xxxxxxx'
                intercept: inReq.server.address().url + inReq.server.prefix + '/sniff',
            },
        });
        if (sniffer && sniffer.url) {
            return {
                parse: 0,
                url: sniffer.url,
            };
        }
    }
    return {
            parse: 0,
            url: id,
        };
    }
    else
        return result;
}

async function test(inReq, _outResp) {
    try {
        const printErr = function (json) {
            if (json.statusCode && json.statusCode == 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject().post(`${prefix}/support`).payload({
            clip: 'https://xx.xx/1.m3u8',
        });
        dataResult.support = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
            id: 'https://xx.xx/1.m3u8',
        });
        dataResult.detail = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/play`).payload({
            flag: 'xx',
            id: 'https://xx.xx/1.m3u8',
        });
        dataResult.play = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        _outResp.code(500);
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
        fastify.post('/sniff', sniff);
        fastify.post('/detail', detail);
        fastify.post('/play', play0);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};