import req from '../../util/req.js';
import {MOBILE_UA, PC_UA} from '../../util/misc.js';
import {load} from 'cheerio';
import pkg from 'lodash';

const {_} = pkg;
import CryptoJS from 'crypto-js';


let url = 'https://www.javbibi.com';


async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8',
            'User-Agent': MOBILE_UA,
        },
    });
    return resp.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    return {};
}

async function home(inReq, _outResp) {
    const classes = [{'type_id':'all','type_name':'all'}];
    const filterObj = {
        'all':[
            {
                "key": "other",
                "name":"欧美女星",
                "value":[
                    {"n":"Anais Alexander","v":"Anais-Alexander"},
                    {"n":"Autumn Falls","v":"Autumn-Falls"},
                    {"n":"Alexa Grace","v":"Alexa-Grace"},
                    {"n":"Angela White","v":"Angela-White"},
                    {"n":"Ava Addams","v":"Ava-Addams"},
                    {"n":"Abigaile Johnson","v":"Abigaile-Johnson"},
                    {"n":"Cory Chase","v":"Cory-Chase"},
                    {"n":"dasha taran","v":"dasha-taran"},
                    {"n":"eva elfie","v":"eva-elfie"},
                    {"n":"Evelyn Clairere","v":"Evelyn-Clairere"},
                    {"n":"emily bloom","v":"emily-bloom"},
                    {"n":"karla kush","v":"karla-kush"},
                    {"n":"Kendra Lust","v":"Kendra-Lust"},
                    {"n":"katya clover","v":"katya-clover"},
                    {"n":"Katrina Jade","v":"Katrina-Jade"},
                    {"n":"Kayden Kross","v":"Kayden-Kross"},
                    {"n":"Kendra Sunderland","v":"Kendra-Sunderland"},
                    {"n":"lena anderson","v":"lena-anderson"},
                    {"n":"Lena Paul","v":"Lena-Paul"},
                    {"n":"Metart","v":"Metart"},
                    {"n":"Mia Melano","v":"Mia-Melano"},
                    {"n":"Melody Marks","v":"Melody-Marks"},
                    {"n":"sweetie fox","v":"sweetie-fox"},
                    {"n":"Skylar Vox","v":"Skylar-Vox"},
                    {"n":"stella cox","v":"stella-cox"},
                    {"n":"Skye Blue","v":"Skye-Blue"},
                    {"n":"Tru Kait","v":"Tru-Kait"}
                ]
            },
            {
                "key": "other",
                "name":"类型",
                "value":[
                    {"n":"x-art","v":"x-art"},
                    {"n":"美女","v":"beautiful"},
                    {"n":"臀部","v":"Anal"},
                    {"n":"动画","v":"Anime"},
                    {"n":"屁股","v":"Ass"},
                    {"n":"巨乳","v":"breasts"},
                    {"n":"金发","v":"Blonde"},
                    {"n":"口交","v":"BlowJob"},
                    {"n":"中出","v":"Creampie"},
                    {"n":"颜射","v":"Cumshot"},
                    {"n":"跨种族","v":"InterRacial"},
                    {"n":"拉拉","v":"Lesbian"},
                    {"n":"母乳","v":"breasts-milf"},
                    {"n":"自慰","v":"Solo"},
                    {"n":"BDSM","v":"BDSM"},
                    {"n":"美足","v":"Feet"},
                    {"n":"内衣","v":"Lingerie"},
                    {"n":"按摩","v":"Massage"},
                    {"n":"喷尿","v":"Pissing"},
                    {"n":"白虎","v":"ShavedPussy"},
                    {"n":"潮吹","v":"Squirting"},
                    {"n":"幼女","v":"Teen"},
                    {"n":"鞭打","v":"whipping"}
                ]
            },
            {
                "key": "other",
                "name":"地区",
                "value":[
                    {"n":"JAV","v":"uncensored-JAV"},
                    {"n":"加拿大","v":"uncensored-Canada"},
                    {"n":"乌克兰","v":"uncensored-Ukraine"},
                    {"n":"俄罗斯","v":"uncensored-Russia"},
                    {"n":"法国","v":"uncensored-France"},
                    {"n":"日本","v":"uncensored-japan"},
                    {"n":"中国","v":"uncensored-China"},
                    {"n":"韩国","v":"uncensored-korean"}
                ]
            }
        ],
        "hot-av":[
            {
                "key": "year",
                "name":"年份",
                "value":[
                    {"n":"2024","v":"2024-"},
                    {"n":"2023","v":"2023-"},
                    {"n":"2022","v":"2022-"},
                    {"n":"2021","v":"2021-"},
                    {"n":"2020","v":"2020-"},
                    {"n":"2019","v":"2019-"},
                    {"n":"2018","v":"2018-"}
                ]
            },
            {
                "key": "other",
                "name":"月份",
                "value":[
                    {"n":"12月","v":"12"},
                    {"n":"11月","v":"11"},
                    {"n":"10月","v":"10"},
                    {"n":"9月","v":"09"},
                    {"n":"8月","v":"08"},
                    {"n":"7月","v":"07"},
                    {"n":"6月","v":"06"},
                    {"n":"5月","v":"05"},
                    {"n":"4月","v":"04"},
                    {"n":"3月","v":"03"},
                    {"n":"2月","v":"02"},
                    {"n":"1月","v":"01"}
                ]
            }
        ]
    };

    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters
    if (pg <= 0) pg = 0;
    //https://javbibi.com/{cateId}-{year}{tid}/{catePg}/-page={catePg}
    const html = await request(`${url}/avi-${(extend.other || '')}+jav-page=${pg}`);
    const $ = load(html);
    const items = $('a.adexo');
    let videos = _.map(items, (item) => {
        const it = $(item)[0];
        const k = $(item).find('img:first')[0];
        const remarks = $(item).find('span.duration:first');
        return {
            vod_id: it.attribs.href,
            vod_name: k.attribs.alt,
            vod_pic: k.attribs['src'],
            vod_remarks: remarks.text(),
        };
    });
    const hasMore = $('ul >  li > a.next-page:contains(Next)').length > 0;
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
    const html = await request(url+id);
    const matches = html.match(/<script type=".*">.*eval(.*)/);
    const eval1 = eval(matches[1])
    let m3u8 = eval1.match(/file:.*?.m3u8/)[0].replace('file:"','');
    let list=[];
    let vod = {
        vod_id: id,
        vod_pic: '',
        vod_remarks: '',
        vod_content: '',
    };
    list.push({name:"默认",url:m3u8||""})
    list.push({name:"720p",url:m3u8||""})
    list.push({name:"480p",url:m3u8||""})
    let playlist = []
    list.map((a, b) => {
        if (a.url!=''){
            return playlist.push(a.name +'$' + a.url);
        }
    });
    vod.vod_play_from = "道长在线";
    vod.vod_play_url = playlist.join('#');
    return JSON.stringify({
        list: [vod],
    });
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return JSON.stringify({
        parse: 0,
        url: id
    });
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    let data = await request(url + '/avi-' + wd + '-page=' + pg );//https://javbibi.com/avi-{wd}-page={catePg}
    const $ = load(data);
    const items = $('a.adexo');
    let videos = _.map(items, (item) => {
        const it = $(item)[0];
        const k = $(item).find('img:first')[0];
        const remarks = $(item).find('span.duration:first');
        return {
            vod_id: it.attribs.href,
            vod_name: k.attribs.alt,
            vod_pic: k.attribs['src'],
            vod_remarks: remarks.text(),
        };
    });
    const hasMore = $('ul >  li > a.next-page:contains(Next)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 24,
        total: 24 * pgCount,
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
        key: 'jv',
        name: 'jv',
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