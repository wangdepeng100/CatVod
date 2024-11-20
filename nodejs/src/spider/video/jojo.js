import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';
import { load } from 'cheerio';
import axios from 'axios';
import Crypto from 'crypto-js';
import dayjs from 'dayjs';

let key = 'jiohub';
let url = 'https://jiohub.top';
let siteKey = '';
let siteType = 0;

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

const cookie = {};

async function request(reqUrl, referer, mth, data, hd) {
    const headers = {
        'User-Agent': UA,
        Cookie: _.map(cookie, (value, key) => {
            return `${key}=${value}`;
        }).join(';'),
        'Authorization' : null,
        'Sec-Fetch-Dest' : 'empty',
        'Sec-Fetch-Mode' : 'cors',
        'Sec-Fetch-Site' : 'cross-site',
        'Content-Type' : 'application/json'
    };
    if (referer) headers.referer = encodeURIComponent(referer);
    let res = await req(reqUrl, {
        method: mth || 'get',
        headers: headers,
        data: data,
        postType: mth === 'post' ? 'form' : '',
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    // siteKey = cfg.skey;
    // siteType = cfg.stype;
    return {};
}

async function home(inReq, _outResp) {

    return JSON.stringify({
        'class': [{'type_id':'最新','type_name':'最新'},{'type_id':'电影','type_name':'电影'},{'type_id':'美剧','type_name':'美剧'},{'type_id':'韩剧','type_name':'韩剧'},{'type_id':'日剧','type_name':'日剧'},{'type_id':'动漫','type_name':'动漫'},{'type_id':'国产','type_name':'国产'}],
        'filters': {
			"最新3":[{"key":"tag","name":"标签","value":[{"n":"全部","v":"标签"},{"n":"国产剧","v":"国产剧"},{"n":"港台剧","v":"港台剧"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":"地区"},{"n":"内地","v":"内地"},{"n":"香港地区","v":"香港地区"},{"n":"台湾地区","v":"台湾地区"}]},{"key":"year","name":"年份","value":[{"n":"全部","v":"年份"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"10年代","v":"10年代"},{"n":"00年代","v":"00年代"},{"n":"90年代","v":"90年代"},{"n":"80年代","v":"80年代"}]},{"key":"by","name":"排序","value":[{"n":"热播榜","v":"热播榜"},{"n":"好评榜","v":"好评榜"},{"n":"新上线","v":"新上线"}]}],
			
            
            "1":[{"key":"class","name":"类型","value":[{"n":"全部","v":"类型"},{"n":"动作片","v":"动作片"},{"n":"喜剧片","v":"喜剧片"},{"n":"爱情片","v":"爱情片"},{"n":"科幻片","v":"科幻片"},{"n":"恐怖片","v":"恐怖片"},{"n":"剧情片","v":"剧情片"},{"n":"战争片","v":"战争片"},{"n":"惊悚片","v":"惊悚片"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":"地区"},{"n":"华语","v":"华语"},{"n":"香港地区","v":"香港地区"},{"n":"美国","v":"美国"},{"n":"欧洲","v":"欧洲"},{"n":"韩国","v":"韩国"},{"n":"日本","v":"日本"},{"n":"台湾地区","v":"台湾地区"},{"n":"泰国","v":"泰国"},{"n":"台湾地区","v":"台湾地区"},{"n":"印度","v":"印度"},{"n":"其它","v":"其它"}]},{"key":"year","name":"年份","value":[{"n":"全部","v":"年份"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"10年代","v":"10年代"},{"n":"00年代","v":"00年代"},{"n":"90年代","v":"90年代"},{"n":"80年代","v":"80年代"}]},{"key":"by","name":"排序","value":[{"n":"热播榜","v":"热播榜"},{"n":"好评榜","v":"好评榜"},{"n":"新上线","v":"新上线"}]}],
			"4":[{"key":"class","name":"类型","value":[{"n":"全部","v":"类型"},{"n":"国产漫","v":"国产漫"},{"n":"欧美漫","v":"欧美漫"},{"n":"日韩漫","v":"日韩漫"},{"n":"港台漫","v":"港台漫"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":"地区"},{"n":"中国大陆","v":"中国大陆"},{"n":"日本","v":"日本"},{"n":"韩国","v":"韩国"},{"n":"欧美","v":"欧美"},{"n":"其它","v":"其它"}]},{"key":"year","name":"年份","value":[{"n":"全部","v":"年份"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"10年代","v":"10年代"},{"n":"00年代","v":"00年代"},{"n":"90年代","v":"90年代"},{"n":"80年代","v":"80年代"}]},{"key":"by","name":"排序","value":[{"n":"热播榜","v":"热播榜"},{"n":"新上线","v":"新上线"}]},{"key":"total","name":"状态","value":[{"n":"全部","v":"状态"},{"n":"连载","v":"连载"},{"n":"完结","v":"完结"}]}],
			"3":[{"key":"class","name":"类型","value":[{"n":"全部","v":"类型"},{"n":"大陆","v":"大陆"},{"n":"港台","v":"港台"},{"n":"日韩","v":"日韩"},{"n":"欧美","v":"欧美"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":"地区"},{"n":"内地","v":"内地"},{"n":"港台","v":"港台"},{"n":"日韩","v":"日韩"},{"n":"欧美","v":"欧美"},{"n":"其它","v":"其它"}]},{"key":"year","name":"年份","value":[{"n":"全部","v":"年份"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"10年代","v":"10年代"},{"n":"00年代","v":"00年代"},{"n":"90年代","v":"90年代"},{"n":"80年代","v":"80年代"}]},{"key":"by","name":"排序","value":[{"n":"热播榜","v":"热播榜"},{"n":"新上线","v":"新上线"}]}],
			"8":[{"key":"class","name":"类型","value":[{"n":"全部","v":"类型"},{"n":"日韩剧","v":"日韩剧"},{"n":"欧美剧","v":"欧美剧"},{"n":"海外剧","v":"海外剧"}]},{"key":"area","name":"地区","value":[{"n":"全部","v":"地区"},{"n":"韩国","v":"韩国"},{"n":"美剧","v":"美剧"},{"n":"日本","v":"日本"},{"n":"泰国","v":"泰国"},{"n":"英国","v":"英国"},{"n":"新加坡","v":"新加坡"},{"n":"其他","v":"其他"}]},{"key":"year","name":"年份","value":[{"n":"全部","v":"年份"},{"n":"2024","v":"2024"},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"10年代","v":"10年代"},{"n":"00年代","v":"00年代"},{"n":"90年代","v":"90年代"},{"n":"80年代","v":"80年代"}]},{"key":"by","name":"排序","value":[{"n":"热播榜","v":"热播榜"},{"n":"好评榜","v":"好评榜"},{"n":"新上线","v":"新上线"}]}]
		},
    });
}

async function homeVod() {
    return '{}';
}

// tid, pg, filter, extend
async function category(inReq, _outResp) {

    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    
    let tag = extend['tag']?extend['tag']:'全部';
	let year = extend['year']?extend['year']:'全部';

    // const link = url + '/list/' + tid + "?page=" + pg + '&size=24';
    const link = 'https://pan.syrme.top/v1/api/video/jojo/type/tag/year?type=' + tid + '&tag=' + tag + '&year=' + year + '&page=' + pg + '&size=24';
    const res = await request(link, null, 'post', null);
    
    // 换普通处理方法
    let  videos = [];
    for (const vod of res.data) {
        let a =  {
        vod_id: vod.ID,
        vod_name: vod.title,
        vod_pic: vod.image,
        vod_remarks: vod.score,
        }
        videos.push(a);
     }

    return JSON.stringify({
        page: pg,
        pagecount: _.ceil(res.num / 24),
        list: videos,
    });

    /*
    const $ = load(html);
    const items = $('div.content-body > a');
    let videos = _.map(items, (item) => {
        const img = $(item).find('img:first')[0].attribs['src'];
        const a = item.attribs['href'].match(/\/watch\/(.*)/)[1];
        const n = ($(item).find('p.card-title')[0]).children[0].data;
        let speed = ($(item).find('p.item-speed')[0]).children[0].data || '';
        const score = ($(item).find('p.score')[0]).children[0].data || '';
        if (speed == tid) speed = '';
        return {
            vod_id: a,
            vod_name: n,
            vod_pic: img,
            vod_remarks: speed || score || '',
        };
    });

    let total = 24;
    const pag = $('ui-pagination');
    if (pag.length > 0) {
        try {
            total = parseInt(pag[0].attribs['total']);
        } catch (error) {

        }
    }

    return JSON.stringify({
        page: pg,
        pagecount: _.ceil(total / 24),
        list: videos,
    });*/
}

function stripHtmlTag(src) {
    return src
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&.{1,5};/g, '')
        .replace(/\s{2,}/g, ' ');
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        // https://pan.syrme.top/v1/api/video/jojo/id?id=63901

        const data = (await request('https://pan.syrme.top/v1/api/video/jojo/id?id=' + id, null, 'post', null)).data;

        let vod = {
            vod_name: data.title,
            vod_pic: data.image,
            type_name: data.video_type,
            vod_year: data.year,
            vod_remarks: data.score,
            vod_content: data.content,
        };

        let playFroms = [];
        let playUrls = [];
        
        playFroms.push('JOJO线路');
        let nameUrls = [];
        for (const play of data.url_content.split('\n')) {
            nameUrls.push(play)
        }
        playUrls.push(nameUrls.join('#'));

        /*
        let nameUrls = [];
        for (const play of ) {
            nameUrls.push(play.name + '$' + play['url'][0]);
            
        }*/

        vod.vod_play_from = playFroms.join('$$$');
        vod.vod_play_url = playUrls.join('$$$');
        videos.push(vod);
    }
    
    return {
        list: videos,
    };
}

function playPid() {
    var key = Crypto.enc.Utf8.parse('VSmJTRRE'+dayjs().format('YYYYMMDD'));
    var iv = Crypto.enc.Hex.parse("00000000000000000000000000000000");
    var pid = Crypto.AES.encrypt(dayjs().format('YYYY-MM-DD HH:mm'), key, { iv: iv, padding: Crypto.pad.Pkcs7 });
    pid = pid.toString().replace(/\+/g, '-');
    return pid;
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return JSON.stringify({
        parse: 0,
        url: id, // + '?pid=' + playPid(),
        header: {
            'User-Agent': UA,
        },
    });
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;

    const link = url + '/video/search?q=' + wd + "&page=" + page + '&size=18&pid=' + playPid();
    const html = await request(link);
    const $ = load(html);
    const items = $('div.content-body > a');
    let videos = _.map(items, (item) => {
        const img = $(item).find('img:first')[0].attribs['src'];
        const a = item.attribs['href'].match(/\/watch\/(.*)/)[1];
        const n = ($(item).find('p.card-title')[0]).children[0].data;
        let speed = ($(item).find('p.item-speed')[0]).children[0].data || '';
        const score = ($(item).find('p.score')[0]).children[0].data || '';
        if (speed == '电影') speed = '';
        return {
            vod_id: a,
            vod_name: n,
            vod_pic: img,
            vod_remarks: speed || score || '',
        };
    });

    let total = 18;
    const pag = $('ui-pagination');
    if (pag.length > 0) {
        try {
            total = parseInt(pag[0].attribs['total']);
        } catch (error) {

        }
    }

    return JSON.stringify({
        page: page,
        pagecount: _.ceil(total / 18),
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
        key: 'jojo',
        name: '🟢 粥粥',
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