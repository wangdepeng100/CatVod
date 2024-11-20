import req from '../../util/req.js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;

let HOST = 'https://www.tuxiaobei.com';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || IOS_UA,
        },
    });
    return res.data
}

async function init(inReq, outResp) {
return {}
}

async function home(filter) {
    const classes = [{ type_id: '', type_name: '🐰全部' }, { type_id: 2, type_name: '🐰儿歌' }, { type_id: 3, type_name: '🐰故事' }, { type_id: 27, type_name: '🐰公益' }, { type_id: 9, type_name: '🐰十万个为什么' }, { type_id: 28, type_name: '🐰安全教育' }, { type_id: 29, type_name: '🐰动物奇缘' }, { type_id: 7, type_name: '🐰弟子规' }, { type_id: 5, type_name: '🐰古诗' }, { type_id: 6, type_name: '🐰三字经' }, { type_id: 8, type_name: '🐰千字文' }, { type_id: 11, type_name: '🐰数学' }, { type_id: 25, type_name: '🐰英语' }, { type_id: 24, type_name: '🐰折纸' }];
    const filterObj = {};
    return ({
        class: _.map(classes, (cls) => {
            cls.land = 1;
            cls.ratio = 1.78;
            return cls;
        }),
        filters: filterObj,
    })
}


async function category(inReq, outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0 || typeof pg == 'undefined') pg = 1;
    const link = await request(HOST + '/list/mip-data?typeId=' + tid + '&page=' + pg + '&callback=');
    const html = link.match(/\((.*?)\);/)[1];
    const data = JSON.parse(html).data;
    let videos = _.map(data.items, (it) => {
        return {
            vod_id: it.video_id,
            vod_name: it.name,
            vod_pic: it.image,
            vod_remarks: it.root_category_name + ' | ' + it.duration_string || '',
        }
    });
    const pgCount = pg * 30 > data.totalCount ? parseInt(pg) : parseInt(pg) + 1;
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 30,
        total: data.totalCount,
        list: videos,
    })
}

async function detail(inReq, outResp) {
    const id = inReq.body.id;
    const vod = {
        vod_id: id,
        vod_remarks: '',
    };
    const playlist = ['点击播放' + '$' + HOST + '/play/' + id];
    vod.vod_play_from = "道长在线";
    vod.vod_play_url = playlist.join('#');
    return ({
        list: [vod],
    });
}

async function play(inReq, outResp) {
    const id = inReq.body.id;
    const html = await request(id);
    const $ = load(html);
    const pvideo = $("body mip-search-video[video-src*=http]");
    const purl = pvideo[0].attribs['video-src'];
    // console.debug('兔小贝 purl =====>' + purl); // js_debug.log
    return ({
        parse: 0,
        url: purl,
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    const link = HOST + "/search/" + wd;
    const html = await request(link);
    const $ = load(html);
    const list = $("div.list-con > div.items");
    let videos = _.map(list, (it) => {
        const a = $(it).find("a:first")[0];
        const img = $(it).find("mip-img:first")[0];
        const tt = $(it).find("p:first")[0];
        const remarks = $(it).find("p")[1];
        return {
            vod_id: a.attribs.href.replace(/.*?\/play\/(.*)/g, '$1'),
            vod_name: tt.children[0].data,
            vod_pic: img.attribs["src"],
            vod_remarks: remarks.children[0].data || "",
        };
    });
    return ({
        list: videos,
        land: 1,
        ratio: 1.78,
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
        // return { err: err.message, tip: 'check debug console output' };
    }
}




export default {
    meta: {
        key: 'tuxiaobei',
        name: '🟢 兔贝',
        type: 3,
    },
api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        // fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};