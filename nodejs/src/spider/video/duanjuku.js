import req from '../../util/req.js';
import {load}from 'cheerio';
import {ua, init, detail as _detail, proxy, play, test, isEmpty}from '../../util/pan.js';
import CryptoJS from 'crypto-js';
import dayjs from 'dayjs';

let url = 'https://duanjuku.top';

async function request(reqUrl) {
    let res = await req.get(reqUrl, {
        headers: {
            'User-Agent': ua,
        },
    });
    return res.data;
}

async function home(filter) {
    const classes = [{'type_id':1,'type_name':'热门搜索'},{'type_id':2,'type_name':'短剧列表'}];
    const filterObj = {};
    return {
        class: classes,
        filters: filterObj,
    };
}

async function category(inReq, _outResp) {
    const id = inReq.body.id;
    let pg = inReq.body.page;
    var idx;
    if (pg <= 0) pg = 1;
    const resp = await request(url + `/page_${pg}.html`);
    const $ = load(resp);
    if(id == 1)  idx = 1;
    else  idx = 2;
    const videos = $(`.sou-con-list:eq(${idx}) > ul > li`)
        .map((_, li) => {
            return {
                vod_id: $(li).find('a').eq(id-1).attr('href'),
                vod_name: $(li).find('a').eq(3-id).text(),
                vod_pic: 'https://img.omii.top/i/2024/03/17/vqmr8m.webp',
                vod_remarks: $(li).find('span.date').text(),
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

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;;
    const videos = [];
    for (const id of ids) {
        const resp = await request(id);
        const $ = load(resp);
        const shareUrls = $('.umCopyright').find('a:eq(1)').eq(0).attr('href');
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
    const resp = await request(url + `/search.php?q=${wd}`);
    const $ = load(resp);
    const videos = $('.sou-con-list:eq(0) > ul > li')
        .map((_, li) => {
            return {
                vod_id: $(li).find('a').eq(1).attr('href'),
                vod_name: $(li).find('a').text().replace(' 短剧 ',''),
                vod_pic: 'https://img.omii.top/i/2024/03/17/vqmr8m.webp',
                vod_remarks: $(li).find('span.date').text(),
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
        key: 'duanjuku',
        name: '🔍 短剧',
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