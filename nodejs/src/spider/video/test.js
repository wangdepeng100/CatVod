import CryptoJS from 'crypto-js';
import req from '../../util/req.js';
import pkg from 'lodash';
const {_} = pkg;
import {load}from 'cheerio';

let host = 'http://m.ttvbox.com';
let UA = 'Mozilla/5.0 (Linux; Android 14; 22127RK46C Build/UKQ1.230804.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36';
let headers = {
    'User-Agent': UA,
};

async function request(reqUrl, postData, post) {
    let res = await req(reqUrl, {
        method: post ? 'post' : 'get',
        headers: headers,
        data: postData || {},
        postType: post ? 'form' : '',
    });
    return res.data;
}

async function init(inReq, _outResp) {
    return {};
}

async function home(filter) {
    return {};
}



async function category(inReq, _outResp) {
    return {};
}

async function detail(inReq, _outResp) {

    return {};
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let url = siteUrl + '/index.php?s=vod-search-name';
    const html = await req(url, {
        method: 'post',
        headers: {
            'User-Agent': UA,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: `wd=${wd}`,
        postType: 'form',
    });
    const $ = load(html);
    return {};
}

async function sniff(inReq, _outResp) {
    return '';
}

async function play(inReq, _outResp) {
    return {};
}



async function test(inReq, outResp) {
    try {
        const printErr = function(json) {
            if (json.statusCode && json.statusCode == 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject()
            .post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject()
            .post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr(resp.json());
        if (dataResult.home.class && dataResult.home.class.length > 0) {
            resp = await inReq.server.inject()
                .post(`${prefix}/category`)
                .payload({
                id: dataResult.home.class[1].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list && dataResult.category.list.length > 0) {
                resp = await inReq.server.inject()
                    .post(`${prefix}/detail`)
                    .payload({
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
                                resp = await inReq.server.inject()
                                    .post(`${prefix}/play`)
                                    .payload({
                                    flag: flag,
                                    id: urls[i].split('$')[1],
                                });
                                dataResult.play.push(resp);
                            }
                        }
                    }
                }
            }
        }
        resp = await inReq.server.inject()
            .post(`${prefix}/search`)
            .payload({
            wd: '都市',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return {
            err: err.message,
            tip: 'check debug console output'
        };
    }
}

export default {
    meta: {
        key: 'test',
        name: '🟢 测试',
        type: 3,
    },
    api: async(fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/sniff', sniff);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};