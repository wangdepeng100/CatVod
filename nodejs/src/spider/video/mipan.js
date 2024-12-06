import req from '../../util/req.js';
import {load}from 'cheerio';
import { Apic, Qpic, ua, init ,detail as _detail ,proxy ,play ,test ,isEmpty } from '../../util/pan.js';
import dayjs from 'dayjs';

let url = 'https://www.misou.fun';

async function request(reqUrl) {
    let res = await req.get(reqUrl, {
        headers: {
            'User-Agent': ua,
        },
    });
    return res.data;
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;;
    const videos = [];
    for (const id of ids) {
        const resp = await request(url + id);
        const $ = load(resp);
        const shareUrls = $('._resource-link_1u20h_158').find('a').attr('href');
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
    const resp = await request(url + `/search?exact=false&page=1&q=${wd}&share_time=&type=&user=`);
    const $ = load(resp);
    const videos = $('.rm-search-content > div.semi-space-align-start')
        .map((_, div) => {
        let pic;
        if($(div).find('span').eq(3).text().indexOf('夸克') == 0) pic = Qpic;
        else if($(div).find('span').eq(3).text().indexOf('阿里') == 0) pic = Apic;
        else return;
            return {
                vod_id: $(div).eq(0).find('a').attr('href'),
                vod_name: $(div).eq(0).find('span').eq(0).text().trim(),
                vod_pic: pic,
                vod_remarks: $(div).find('span').eq(5).text(),
            };
        })
        .get();
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
        key: 'mipan',
        name: '🔍 米搜',
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