import { _ } from "../../util/cat.js";
import req from '../../util/req.js';
import CryptoJS from 'crypto-js';

let url = "",
    siteKey = "",
    siteType = 0;
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
    cookie = {};
async function request(reqUrl, referer, mth, data) {
    var headers = {
            "User-Agent": UA,
            "X-CLIENT": "open",
            Cookie: _.map(cookie, (value, key) => key + "=" + value).join(";")
        },
        referer = (referer && (headers.referer = encodeURIComponent(referer)), await req(reqUrl, {
            method: mth || "get",
            headers: headers,
            data: data,
            postType: "post" === mth ? "form" : ""
        }));
        console.log(referer.data);
    return referer.data
}

async function init(inReq, _outResp) {
    // siteKey = cfg.skey, siteType = cfg.stype, 
    url = inReq.server.config.xiaoya.url;
    return {};
}

async function home(inReq, _outResp) {
    return (await request(url)); //.replaceAll("1$/$1", "1$/$0")
}

async function category(inReq, _outResp) {
    
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;

	if(pg <= 0) pg = 1;

    let api = url + "?t=" + tid + "&pg=" + pg;

    // return extend && (tid = Object.entries(extend).map(([key, val] = entry) => "&" + key + "=" + val), api = (api += tid) + ("&f=" + encodeURIComponent(JSON.stringify(extend)))), request(api)

    return extend && request(api)
    // 这个转换还在研究转换方法
    // (tid = Object.entries(extend).map(([key, val] = entry) => "&" + key + "=" + val), api = (api += tid) + ("&f=" + encodeURIComponent(JSON.stringify(extend)))),
}

async function detail(inReq, _outResp) {
    
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    // const videos = [];

    for (const id of ids) {
        let data = request(url + "?ids=" + id);
        return data;
    }
}

async function play(inReq, _outResp) {
    // flag, id, flags
    const id = inReq.body.id;
    return request(url.replace("/vod1", "/play") + "?id=" + id + "&from=open")
}
async function search(inReq, _outResp) {
    // wd, quick
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;

    let data = (await request(url + "?wd=" + wd));

    let videos = [];
    // for (const vod of data.data) {
    for (const vod of data.list) {
        videos.push({
            vod_id: vod.vod_id,
            vod_name: vod.vod_name,
            vod_pic: vod.vod_pic,
            vod_remarks: vod.vod_content,
        });
    }
    return JSON.stringify({
        page: page,
        list: videos,
    });
    // return request(url + "?wd=" + wd)
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
        printErr("" + resp.json());
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
            wd: '暴走',
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
        key: 'xiaoya',
        name: '🟢 小雅',
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