// 搜索滑块验证
import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';

let HOST = 'http://www.sharenice.net';
let PC_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || PC_UA,
        },
    });
    return res.data;
}

async function init(inReq, outResp) {
    return {}
}

function clsjoin(cls) {
    _.each(cls, (s) => {
        let typeId = s.attribs['href'];
        typeId = typeId.substring(typeId.lastIndexOf('t/') + 2);
        classes.push({
            type_id: typeId,
            type_name: s.children[0].data,
        });
    });
}

let classes = [];

async function home(filter) {
    let filterObj = {};
    let html = await request(HOST);
    let $ = load(html);
    let series = $('div.nav > ul > li > a[href*=net/]');
    let tag = $('div.hot-tags-list > a[href*=net]');
    clsjoin(series);
    clsjoin(tag);
    return ({
        class: classes,
        filters: filterObj,
    });
}


async function category(inReq, outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0 || typeof(pg) == 'undefined') pg = 1;
    let link = HOST + '/' + tid + '?page=' + pg;
    let html = await request(link);
    let $ = load(html);
    let items = $('div.item-box ul li');
    let videos = _.map(items, (item) => {
        let a = $(item).find('a:first')[0];
        let img = $(item).find('img:first')[0];
        return {
            vod_id: a.attribs.href,
            vod_name: a.attribs.title,
            vod_pic: img.attribs['data-original'],
            vod_remarks: '',
        };
    });
    let hasMore = $('ul.pagination > li > a:contains(»)').length > 0;
    let pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 16,
        total: 16 * pgCount,
        list: videos,
    });
}

async function detail(inReq, outResp) {
    const id = inReq.body.id;
    let vod = {
        vod_id: id,
        vod_remarks: '',
    };
    let playlist = ['观看视频' + '$' + id];
    vod.vod_play_from = '道长在线';
    vod.vod_play_url = playlist.join('#');
    return ({
        list: [vod],
    });
}

async function play(inReq, outResp) {
    const id = inReq.body.id;
    let html = await request(id);
    let $ = load(html);
    let playUrl = $('div.video-play-box').find('video:first')[0].attribs.src + '#.mp4';
    return ({
        parse: 0,
        url: playUrl,
    });
}

async function search(wd, quick, pg) {
    return '{}';
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
        key: 'sharenice',
        name: '🟢 分享',
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