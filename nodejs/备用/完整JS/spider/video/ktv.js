import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';

let HOST = 'https://vpsdn.leuse.top/searchmv';
let mktvUrl = 'http://txysong.mysoto.cc/songs/';
let host = '';

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 11; M2007J3SC Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045714 Mobile Safari/537.36';

async function request(reqUrl, extHeader) {
    let headers = {
        'User-Agent': MOBILE_UA,
        'Referer': host,
    };
    const res = await req(reqUrl, {
        method: 'get',
        headers: headers,
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(cfg) {
   return {}
}

async function home(filter) {
    let classes = [{
            type_id: 1,
            type_name: '歌手',
        },{
            type_id: 2,
            type_name: '曲库',
    }];
    const filterObj = {
        1: [{ key: 'region', name: '地区', init: '', value: [{ n: '全部', v: '' }, { v: '1', n: '大陆' }, { v: '2', n: '港台' }, { v: '3', n: '国外' }] },{ key: 'form', name: '类别', init: '', value: [{ n: '全部', v: '' }, { v: '1', n: '男' }, { v: '2', n: '女' }, { v: '3', n: '组合' }] }],
        2: [{ key: 'lan', name: '语言', init: '2', value: [{ n: '全部', v: '' }, { v: '1', n: '藏语' }, { v: '2', n: '国语' }, { v: '3', n: '韩语' }, { v: '4', n: '日语' }, { v: '5', n: '闽南语' }, { v: '6', n: '英语' }, { v: '7', n: '粤语' }, { v: '8', n: '其他' }, { v: '9', n: '马来语' }, { v: '10', n: '泰语' }, { v: '11', n: '印尼语' }, { v: '12', n: '越南语' }] },{ key: 'type', name: '类型', init: '', value: [{ n: '全部', v: '' }, { v: '1', n: '流行' }, { v: '2', n: '合唱' }, { v: '3', n: '怀旧' },{ v: '4', n: '儿歌' }, { v: '5', n: '革命' }, { v: '6', n: '民歌' }, { v: '7', n: '舞曲' },{ v: '8', n: '喜庆' }, { v: '9', n: '迪高' }, { v: '10', n: '无损DISCO' }, { v: '11', n: '影视' }] }],
    };
    return ({
        class: classes,
        filters: filterObj,
    });
}



async function category(inReq, outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0 || typeof (pg) == 'undefined') pg = 1;
    let videos = [];
    let url = HOST;
    if(tid == 1) {
        url = url + `?table=singer&pg=${pg}`;
        if(extend['region']) url = url + '&where=region_id&keywords=' + extend['region'];
        if(extend['form']) url += '&where=form_id&keywords=' + extend['form'];
        let res = await request(url);
        videos = _.map(res, item => {
            return {
                vod_id: item.name,
                vod_name: item.name,
                vod_pic: mktvUrl + item.id + '.jpg',
                vod_remarks: '',
            }
        });
    } else if(tid == 2) {
        url = url + `?table=song&pg=${pg}`;
        if(extend['lan']) url = url + '&where=language_id&keywords=' + extend['lan'];
        if(extend['type']) url += '&where=type_id&keywords=' + extend['type'];
        let res = await request(url);
        videos = _.map(res, item => {
            return {
                vod_id: mktvUrl + item.number + '.mkv',
                vod_name: item.name,
                vod_pic: '',
                vod_remarks: '',
            }
        });
    }
    return ({
        list: videos,
        page: pg,
        limit: 20,
        total: videos.length
    });
}

async function detail(inReq, outResp) {
    const id = inReq.body.id;
    const name = inReq.body.name;
    let vod = [];
    if (id.endsWith('.mkv')) {
    vod = {
        vod_id: id,
        vod_name: name,
        vod_play_from: 'Leo',
        vod_content: '所有资源收集于网络',
    }
    }
    else
    vod = {
        vod_id: id,
        vod_name: id,
        vod_play_from: 'Leo',
        vod_content: '所有资源收集于网络',
    }
    if (id.endsWith('.mkv')) {
        vod.vod_play_url = '播放$' + id;
    } else {
        let url = HOST + '?table=song&where=singer_names&keywords=' + id + '&size=999';
        let res = await request(url);
        vod.vod_play_url = (_.map(res, item => {
            return item.name + '$' + mktvUrl + item.number + '.mkv';
        })).join('#');
    }
    return ({
        list: [vod],
    });
}

async function play(inReq, outResp) {
    const id = inReq.body.id;
    return ({
        parse: 0,
        url: id,
    });
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    let data = JSON.parse(await request(HOST + 'keywords=' + wd));
    let videos = _.map(data, (it) => {
        return {
            vod_id: mktvUrl + it.number + '.mkv',
            vod_name: it.name,
            vod_pic: '',
            vod_remarks: '',
        }
    });
    return ({
        list: videos,
        limit: 50,
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
            wd: '大日子',
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
        key: 'ktv',
        name: '🟢 KTV',
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