// 无搜索功能
import req from '../../util/req.js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;

let HOST = 'https://vd.ubestkid.com';
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl, referer, mth, data, hd) {
    const headers = {
        "User-Agent": MOBILE_UA,
    };
    if (referer) headers.referer = encodeURIComponent(referer);
    let res = await req(reqUrl, {
        method: mth || "get",
        headers: headers,
        data: data,
        postType: mth === "post" ? "json" : "",
    });
    return res.data;
}

async function init(inReq, outResp) {
return{}
}

async function home(filter) {
    const classes = [{ type_id: 65, type_name: '🐯最新上架' }, { type_id: 113, type_name: '🐯人气热播' }, { type_id: 56, type_name: '🐯经典童谣' }, { type_id: 137, type_name: '🐯开心贝乐虎' }, { type_id: 53, type_name: '🐯律动儿歌' }, { type_id: 59, type_name: '🐯经典儿歌' }, { type_id: 101, type_name: '🐯超级汽车1' }, { type_id: 119, type_name: '🐯超级汽车第二季' }, { type_id: 136, type_name: '🐯超级汽车第三季' }, { type_id: 95, type_name: '🐯三字经' }, { type_id: 133, type_name: '🐯幼儿手势舞' }, { type_id: 117, type_name: '🐯哄睡儿歌' }, { type_id: 70, type_name: '🐯英文儿歌' }, { type_id: 116, type_name: '🐯节日与节气' }, { type_id: 97, type_name: '🐯恐龙世界' }, { type_id: 55, type_name: '🐯动画片儿歌' }, { type_id: 57, type_name: '🐯流行歌曲' }, { type_id: 118, type_name: '🐯贝乐虎入园记' }, { type_id: 106, type_name: '🐯贝乐虎大百科' }, { type_id: 62, type_name: '🐯经典古诗' }, { type_id: 63, type_name: '🐯经典故事' }, { type_id: 128, type_name: '🐯萌虎学功夫' }, { type_id: 100, type_name: '🐯绘本故事' }, { type_id: 121, type_name: '🐯开心贝乐虎英文版' }, { type_id: 96, type_name: '🐯嗨贝乐虎情商动画' }, { type_id: 108, type_name: '🐯动物音乐派对' }, { type_id: 126, type_name: '🐯动物音乐派对英文版' }, { type_id: 105, type_name: '🐯奇妙的身体' }, { type_id: 124, type_name: '🐯奇妙的身体英文版' }, { type_id: 64, type_name: '🐯认知卡片' }, { type_id: 109, type_name: '🐯趣味简笔画' }, { type_id: 78, type_name: '🐯数字儿歌' }, { type_id: 120, type_name: '🐯识字体验版' }, { type_id: 127, type_name: '🐯启蒙系列体验版' }];
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
    const link = HOST + "/api/v1/bv/video";
    const pdata = { age: 1, appver: "6.1.9", egvip_status: 0, svip_status: 0, vps: 60, subcateId: tid, "p": pg };
    const jo = await request(link, "", "post", pdata);
    const videos = [];
    _.each(jo.result.items, (it) => {
        videos.push({
            vod_id: it.url,
            vod_name: it.title,
            vod_pic: it.image,
            vod_remarks: '👀' + it.viewcount || '',
        })
    });
    const pgCount = pg * 60 > jo.total ? parseInt(pg) : parseInt(pg) + 1;
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 60,
        total: jo.total,
        list: videos,
    })
}

async function detail(inReq, outResp) {
    const id = inReq.body.id;
    const vod = {
        vod_id: id,
        vod_remarks: '',
    };
    const playlist = ['点击播放' + '$' + id];
    vod.vod_play_from = "默认";
    vod.vod_play_url = playlist.join('#');
    return ({
        list: [vod],
    });
}

async function play(inReq, outResp) {
    const id = inReq.body.id;
    // console.debug('贝乐虎 id =====>' + id); // js_debug.log
    return ({
        parse: 0,
        url: id,
    });
}

async function search(wd, quick) {
    return '{}'
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
        key: 'ub',
        name: '🟢 乐虎',
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