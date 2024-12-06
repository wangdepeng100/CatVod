import req2 from '../../util/req2.js';
import {load}from 'cheerio';
import { Apic, Qpic, ua, init ,detail as _detail ,proxy ,play ,test ,isEmpty } from '../../util/pan.js';
import dayjs from 'dayjs';

let url = 'https://www.nmme.xyz';

async function requestRaw(reqUrl, redirect) {
    const res = await req2(reqUrl, {
            method: 'get',
            headers: {
                'User-Agent': ua,
            },
            validateStatus: status => status >= 200 && status < 400,
            maxRedirects: redirect,
        });
        return res;
}

async function request(reqUrl) {
        return (await requestRaw(reqUrl)).data;
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (const id of ids) {
        const shareUrls = id;
        let vod = ({
            vod_id: id,
        });
        const vodFromUrl = await _detail(shareUrls);
        if (vodFromUrl){
            vod.vod_play_from = vodFromUrl.froms;
            vod.vod_play_url = vodFromUrl.urls;
        }
        videos.push(vod);
    }
    return {
        list: videos,
    };
}

async function parseHtmlList(pg, wd) {
    const resp = await request(url + `/s/${pg}/${wd}`);
    const $ = load(resp);
    const videos =[];
    const items = $('.search-list > div.item');
    for(const item of items){
            var dataUrl = $(item).find('a').attr('data-url');
            var dataId = $(item).find('a').attr('data-id');
            var name = $(item).find('a').eq(0).text().trim();
            var date = $(item).find('a').eq(1).text();
            var pic = $(item).find('img').attr('src');
            const urlx = `${url}/open/${dataId}/${dataUrl}`;
            const html = (await requestRaw(urlx)).data;
            const $1 = load(html);
            const id = $1('meta[http-equiv="refresh"]').attr('content').match(/url=(.*)\?entry=/);
            if(isEmpty(id)) continue;
            const idx = id[1];
            if(idx.indexOf('ali') >= 0 || idx.indexOf('quark') >= 0)
            videos.push({
                vod_id: idx,
                vod_name: name,
                vod_pic: url + pic,
                vod_remarks: date,
            });
        }
    const hasMore = !isEmpty(videos);
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return {
        page: parseInt(pg),
        pagecount: pgCount,
        list: videos,
    };
}

async function search(inReq, _outResp) {
    let pg = inReq.body.page;
    const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    return parseHtmlList(pg, wd);
}

export default {
    meta: {
        key: 'juzi',
        name: '🔍 橘子',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};