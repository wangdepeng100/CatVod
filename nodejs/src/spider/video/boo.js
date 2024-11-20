import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';

let HOST = 'https://www.boosj.com';

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 11; M2007J3SC Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045714 Mobile Safari/537.36';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || MOBILE_UA,
            'Referer': HOST
        },
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, outResp) {
    return{}
}

async function home(filter) {
    const classes = [{ type_id: '', type_name: '全部' }, { type_id: 28, type_name: '辅食' }, { type_id: 582, type_name: '动画' }, { type_id: 3364, type_name: '儿童舞蹈' }, { type_id: 3366, type_name: '少儿英语' }, { type_id: 3367, type_name: '儿童歌曲' }, { type_id: 3622, type_name: '才艺' }, { type_id: 3782, type_name: '播视自制' }, { type_id: 3822, type_name: '故事' }, { type_id: 3842, type_name: '亲子教育' }, { type_id: 4402, type_name: '美术' }, { type_id: 4583, type_name: '其他' }, { type_id: 4762, type_name: '儿童游戏' }, { type_id: 4842, type_name: '识物' }, { type_id: 4843, type_name: '绘本' }, { type_id: 4844, type_name: '古诗' }, { type_id: 4845, type_name: '科普' }, { type_id: 5102, type_name: '儿童玩具' }, { type_id: 5142, type_name: '播视童趣儿童玩具' }];
    const filterObj = {};
    const jsonData = [
        {
            key: 'age',
            name: '年龄段',
            value: [
                { n: '全部', v: '' },
                { n: '6岁以上', v: '?p367=370' },
                { n: '3~6岁', v: '?p367=369' },
                { n: '0~3岁', v: '?p367=368' },
            ],
            init: '',
        },
        {
            key: 'by',
            name: '排序',
            value: [
                { n: '全部', v: '' },
                { n: '最新发布', v: 'lately' },
                { n: '最多播放', v: 'pop' },
                { n: '最多评论', v: 'view' },
            ],
            init: '',
        },
    ];
    return ({
        class: _.map(classes, (cls) => {
            cls.land = 1;
            cls.ratio = 1.78;
            filterObj[cls.type_id] = jsonData;
            return cls;
        }),
        filters: filterObj,
    });
}


async function category(inReq, outResp) {
const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0 || typeof (pg) == 'undefined') pg = 1;
    const link = HOST + '/search_res_3362__' + tid + '_' + pg + '_' + (extend.by || '') + '.html' + (extend.age || '');
    const html = await request(link);
    const $ = load(html);
    const items = $('body div.bj-col4:has(h3)');
    let videos = _.map(items, (it) => {
        const a = $(it).find('a:first')[0];
        const img = $(it).find('img:first')[0];
        const remarks = $(it).find('span.played')[0];
        return {
            vod_id: a.attribs.href,
            vod_name: a.attribs.title,
            vod_pic: img.attribs['data-original'],
            vod_remarks: remarks.children[0].data || '',
        };
    });
    const hasMore = $('div.pub_paging > a:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 30,
        total: 30 * pgCount,
        list: videos,
    });
}

async function detail(inReq, outResp) {
const id = inReq.body.id;
    const vod = {
        vod_id: id,
        vod_remarks: "",
    };
    const playlist = ["点击播放" + "$" + vod.vod_id];
    vod.vod_play_from = "道长在线";
    vod.vod_play_url = playlist.join("#");
    return ({
        list: [vod],
    });
}

async function play(inReq, outResp) {
const id = inReq.body.id;
    const body =await request('https://gslb.boosj.com/ipv2.json');
    body._id = id.match(/\d+/)[0];
    const json = await request(buildUrl(body.gslb, body));
    const purl = json.url + '?' + json.t
    // console.debug('童趣purl =====>' + purl); // js_debug.log
    let headers = {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; 22081212C Build/PQ3B.190801.002)',
    };
    return ({
        parse: 0,
        url: purl,
        header: headers,
    });
}

async function search(inReq, outResp) {
const wd = inReq.body.wd;
    let pg = inReq.body.page;
    var data = await request('https://search.boosj.com/m_ajax?q=' + wd + '&p=' + pg + '&typeId=3362').body;
    let videos = _.map(data.result, (it) => {
        return {
            vod_id: it.playUrl,
            vod_name: it.resourceName,
            vod_pic: it.imageUrl,
            vod_remarks: it.clickNumStr || '',
        }
    });
    return ({
        page: parseInt(pg),
        pagecount: data.pageCount,
        limit: 30,
        total: data.rowCount,
        list: videos,
    });
}

function buildUrl(url, obj) {
    obj = obj || {};
    if (url.indexOf('?') < 0) {
        url += '?'
    }
    let param_list = [];
    let keys = Object.keys(obj);
    keys.forEach(it => {
        param_list.push(it + '=' + obj[it])
    });
    let prs = param_list.join('&');
    if (keys.length > 0 && !url.endsWith('?')) {
        url += '&'
    }
    url += prs;
    return url
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
        key: 'boo',
        name: '🟢 童趣',
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