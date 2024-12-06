import req from '../../util/req.js';
import {load}from 'cheerio';
import {Apic, Qpic, ua, init, detail as _detail, proxy, play, test, isEmpty}from '../../util/pan.js';
import dayjs from 'dayjs';

let url = 'https://qkpanso.com';

async function request(reqUrl, data) {
    let res = await req(reqUrl, {
        method: 'post',
        headers: {
            'User-Agent': ua,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(data),
    });
    return res.data;
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const shareUrls = ids;
    const videos = [];
    for (const id of ids) {
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
    const param = {
        "page": pg,
        "q": wd,
        "user": "",
        "exact": false,
        "format": [],
        "share_time": "",
        "size": 15,
        "type": "",
        "exclude_user": [],
        "adv_params": {
            "wechat_pwd": ""
        }
    }
    const items = (await request(url + `/v1/search/disk`,param)).data.list;
    const videos = [];
    for (const item of items) {
        videos.push({
            vod_id: item.link,
            vod_name: item.disk_name.replace(/<[^>]+>/g, ''),
            vod_pic: Qpic,
            vod_remarks: item.shared_time,
        });
    }
    const hasMore = !isEmpty(items);
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

export
default {
    meta: {
        key: 'qkpanso',
        name: '🔍 夸克',
        type: 3,
    },
    api: async(fastify) => {
        fastify.post('/init', init);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};