import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';
import Crypto from 'crypto-js';
import dayjs from 'dayjs';

let siteUrl = 'https://m.360ba.co/';
let headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Redmi K30 Build/SKQ1.210908.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36',
    'Referer': siteUrl,
    'Origin': siteUrl,
};

async function request(reqUrl, postData, post) {

    let res = await req(reqUrl, {
        method: post ? 'post' : 'get',
        headers: headers,
        data: postData || {},
        postType: post ? 'form' : '',
    });

    let content = res.data;
    return content;
}

async function init(inReq, _outResp) {
    return{}
}

async function home(filter) {
    let classes = [{
        type_id: '1',
        type_name: '全部',
    },{
        type_id: '2',
        type_name: '足球',
    },{
        type_id: '3',
        type_name: '篮球',
    },{
        type_id: '99',
        type_name: '综合',
    }];
    //let filterObj = genFilterObj();
    return ({
        class: classes,
       // filters: filterObj
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    let url = siteUrl + 'api/web/live_lists/' + tid;
    let videos = await getVideos(url);
    return ({
        list: videos,
        page: 1,
        pagecount: 1,
        limit: 0,
        total: videos.length
    });
}

async function detail(inReq, _outResp) {
    try {const id = inReq.body.id;
        const video = {
            vod_play_from: 'Leo',
            vod_play_url: '播放' + '$' + id,
            vod_content: 'Leo',
        };
        const list = [video];
        const result = { list };
        return (result);
    } catch (e) {
       //console.log('err', e);
    }
    return null;
}

async function search(inReq, _outResp) {
return{}
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return ({
        parse: 0,
        url: id,
        header: headers
    });
}

async function getVideos(url) {
    const data = await request(url);
    let videos = _.map(data.data.data, (n) => {
        let id = n.url;
        let name = n.league_name_zh + ' ' + n.home_team_zh + ' VS ' + n.away_team_zh;
        let pic = n.cover;
        let remarks = 'LIVING';
        return {
            vod_id: id,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: remarks,
        };
    });
    return videos;
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
        key: '_360ba',
        name: '🟢 看球',
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
