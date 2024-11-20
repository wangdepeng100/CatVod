import req from '../../util/req.js';
import {
    load
}
from 'cheerio';
import {
    Apic, Qpic, ua, init, detail0, proxy, play, test, isEmpty
}
from '../../util/pan.js';
import dayjs from 'dayjs';

let siteUrl = 'http://www.662688.xyz';

async function request(reqUrl) {
    let res = await req.get(reqUrl, {
        headers: {
            'User-Agent': ua,
        },
    });
    return res.data;
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const shareUrl = id;
    const videos = [];
    let vod = ({
        vod_id: id,
    });
    videos.push(await detail0(shareUrl, vod));
    return {
        list: videos,
    };
}


async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    const limit = 10;
    const html = await request(siteUrl + "/api/get_zy?keyword=" + encodeURIComponent(wd));
    const videos = [];
    for (const item of html.data) {
        videos.push({
            vod_id: item.url,
            vod_name: item.title,
            vod_pic: item.url.indexOf('quark') >=0 ? Qpic : Apic,
        })
    }
    const pageCount = pg;
    const pgCount = parseInt(pageCount);
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    });
}

export
default {
    meta: {
        key: 'ps',
        name: '86盘搜',
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