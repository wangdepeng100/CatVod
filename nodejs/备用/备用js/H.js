import req from '../../util/req.js';
import {MOBILE_UA} from '../../util/misc.js';
import {load} from 'cheerio';
import pkg from 'lodash';

const {_} = pkg;
import CryptoJS from 'crypto-js';

let url = 'https://bad.news';


async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'Accept-Language': 'zh,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
            'User-Agent': MOBILE_UA,
        }
    });
    return resp.data;
}

async function init(inReq, _outResp) {
    return {};
}

async function home(inReq, _outResp) {
    var html = await request(url+'/dm');
    const $ = load(html);
    let classes = [];
    for (const a of $('ul.nav a[href!="/dm/tags"]')) {
        classes.push({
            type_id: a.attribs.href,
            type_name: a.children[0].data==undefined ? '动漫' : a.children[0].data.trim(),
        });
    }
    return {
        class: classes,
    };
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    const html = await request(`${url}${tid}/page-${pg}`);
    const $ = load(html);
    let videos = [];
    for (const item of $('.stui-vodlist__box')) {
        const a = $(item).find('a')[0];
        videos.push({
            vod_id: a.attribs.href,
            vod_name: a.attribs.title,
            vod_pic: a.attribs['data-echo-background']
        });
    }
    const hasMore = $('a > span.mobile-hide:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 24,
        total: 24 * pgCount,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    var html = await request(`${url}${id}`);
    var $ = load(html);
    var vod = {
        vod_id: id,
        vod_name: $('h1.title').text().trim(),
        vod_type: $('.detail-content a').text(),
        vod_content: $('p.desc').text().trim(),
    }
    let playFroms = [];
    let playUrls = [];
    const temp = [];
    playFroms.push('默认');
    const playUrl = $('video').attr('data-source').split('?')[0];
    temp.push(vod.vod_name+'$'+playUrl);
    playUrls.push(temp.join('#'));
    vod.vod_play_from = playFroms.join('$$$');
    vod.vod_play_url = playUrls.join('$$$');
    return JSON.stringify({
        list: [vod],
    });
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return JSON.stringify({
        parse: 0,
        url: id,
    });
}


async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let html = await request(`${url}/dm/search/q-${wd}`);
    const $ = load(html);
    let videos = [];
    for (const item of $('.stui-vodlist__box')) {
        const a = $(item).find('a')[0];
        videos.push({
            vod_id: a.attribs.href,
            vod_name: a.attribs.title,
            vod_pic: a.attribs['data-echo-background']
        });
    }
    return JSON.stringify({
        list: videos,
    });
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
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
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
        return {err: err.message, tip: 'check debug console output'};
    }
}

export default {
    meta: {
        key: 'hs',
        name: '🟡 坏坏',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};