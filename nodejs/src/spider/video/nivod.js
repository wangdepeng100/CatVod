import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';
import { load } from 'cheerio';
import axios from 'axios';

let key = 'nivod';
let HOST = 'https://lkvod.us/';
let parseMap = {};
let siteKey = '';
let siteType = 0;

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': UA,
            'Referer': HOST
        },
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    // siteKey = cfg.skey;
    // siteType = cfg.stype;
    await initParseMap();
    return {}
}

async function initParseMap() {
    const date = new Date();
    const t = '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate();
    const js = await request(HOST + '/static/js/playerconfig.js?t=' + t);
    try {
        const jsEval = js + '\nMacPlayerConfig';
        const playerList = eval(jsEval).player_list;
        const players = _.values(playerList);
        _.each(players, (item) => {
            if (!item.ps || item.ps == '0') return;
            if (_.isEmpty(item.parse)) return;
            parseMap[item.show] = item.parse;
        });
    } catch(e) {
    }
}

async function home(inReq, _outResp) {
    const classes = [{'type_id':'1','type_name':'电影'},{'type_id':'2','type_name':'电视剧'},{'type_id':'3','type_name':'综艺'},{'type_id':'4','type_name':'动漫'}];
    const filterObj = {
        '1':[{'key':'cateId','name':'类型','init':'1','value':[{'n':'全部','v':'1'},{'n':'动作片','v':'6'},{'n':'喜剧片','v':'7'},{'n':'爱情片','v':'8'},{'n':'科幻片','v':'9'},{'n':'恐怖片','v':'10'},{'n':'剧情片','v':'11'},{'n':'战争片','v':'12'}]},{'key':'year','name':'年代','init':'','value':[{'n':'全部','v':''},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},{'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '2':[{'key':'cateId','name':'类型','init':'2','value':[{'n':'全部','v':'2'},{'n':'国产剧','v':'13'},{'n':'港台剧','v':'14'},{'n':'日韩剧','v':'15'},{'n':'欧美剧','v':'16'},{'n':'其他剧','v':'20'}]},{'key':'year','name':'年代','init':'','value':[{'n':'全部','v':''},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},{'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '3':[{'key':'year','name':'年代','init':'','value':[{'n':'全部','v':''},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},{'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '4':[{'key':'year','name':'年代','init':'','value':[{'n':'全部','v':''},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},{'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}]
    };
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function homeVod() {}

// tid, pg, filter, extend
async function category(inReq, _outResp) {

    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    
    const link = HOST + '/show/' + (extend.cateId || tid) + '--' + (extend.by || '') + '-' + (extend.class || '') + '--' + (extend.letter || '') + '---' + pg + '---' + (extend.year || '') + '.html';
    const html = await request(link);
    const $ = load(html);
    const items = $('a.module-item');
    const videos = _.map(items, (item) => {
        const $item = $(item);
        const a = $item;
        const img = $item.find('img:first');
        const remarks = $item.find('div.module-item-note').text().trim();
        return {
            vod_id: a.attr('href').replace(/.*?\/detail\/(.*).html/g, '$1'),
            vod_name: a.attr('title'),
            vod_pic: img.attr('data-original'),
            vod_remarks: remarks,
        };
    });
    const limit = 72;
    const hasMore = $('div#page > a:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const html = await request(HOST + '/detail/' + id + '.html');
        const $ = load(html);
        const vod = {
            vod_id: id,
            vod_name: $('h1:first').text().trim(),
            vod_type: $('.module-info-tag a:eq(2)').text().trim(),
            vod_year: $('.module-info-tag a:eq(0)').text().trim(),
            vod_area: $('.module-info-tag a:eq(1)').text().trim(),
            vod_actor: $('.module-info-item:contains(主演：)').text().trim().substring(3).replace(/\/$/, ''),
            vod_director: $('.module-info-item:contains(导演：)').text().trim().substring(3).replace(/\/$/, ''),
            vod_pic: $('.module-info-poster img:first').attr('data-original'),
            vod_remarks : $('.module-info-item:contains(备注：)').text(),
            vod_content: $('.module-info-introduction-content').text().trim(),
        };
        const playMap = {};
        const tabs = $('div.module-tab-item.tab-item > span');
        const playlists = $('.module-play-list');
        _.each(tabs, (tab, i) => {
            const $tab = $(tab);
            const from = $tab.text().trim();
            let list = playlists[i];
            list = $(list).find('a');
            _.each(list, (it) => {
                const $it = $(it);
                let title = $it.find('span').text();
                const playUrl = $it.attr('href');
                if (_.isEmpty(title)) title = $it.text();
                if (!playMap.hasOwnProperty(from)) {
                    playMap[from] = [];
                }
                playMap[from].push(title + '$' + playUrl);
            });
        });
        vod.vod_play_from = _.keys(playMap).join('$$$');
        const urls = _.values(playMap);
        const vod_play_url = _.map(urls, (urlist) => {
            return urlist.join('#');
        });
        vod.vod_play_url = vod_play_url.join('$$$');
        videos.push(vod);
    }
    
    return JSON.stringify({
        list: videos,
    });
}

// flag, id, flags
async function play(inReq, _outResp) {
    const id = inReq.body.id;

    const link = HOST + id;
    const html = await request(link);
    const $ = load(html);
    const js = JSON.parse($('script:contains(player_)').html().replace('var player_aaaa=',''));
    let playUrl = js.url;
    if (js.encrypt == 1) {
        playUrl = unescape(playUrl);
    } else if (js.encrypt == 2) {
        playUrl = unescape(base64Decode(playUrl));
    }
    /* 暂时注释掉这部份
    const parseUrl = parseMap[flag];
    if (parseUrl) {
        const reqUrl = parseUrl + playUrl;
        const parseHtml = await request(reqUrl);
        const matches = parseHtml.match(/let ConFig = {([\w\W]*)},box/);
        if (!_.isEmpty(matches)) {
            const configJson = '{' + matches[1].trim() + '}';
            const config = JSON.parse(configJson);
            playUrl = decryptUrl(config);
        }
    }*/
    return JSON.stringify({
        parse: 0,
        url: playUrl,
        header: {
            'User-Agent': UA,
        }
    });
}

function decryptUrl(jsConfig) {
    const key = Crypto.enc.Utf8.parse('2890' + jsConfig.config.uid + 'tB959C');
    const iv = Crypto.enc.Utf8.parse('GZ4JgN2BdSqVWJ1z');
    const mode = Crypto.mode.CBC;
    const padding = Crypto.pad.Pkcs7;
    const decrypted = Crypto.AES.decrypt(jsConfig.url, key, {
        iv: iv,
        mode: mode,
        padding: padding
    });
    const decryptedUrl = Crypto.enc.Utf8.stringify(decrypted);
    return decryptedUrl;
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;

    const data = (await request(HOST + '/index.php/ajax/suggest?mid=1&limit=50&wd=' + wd)).list;
    const videos = _.map(data, (vod) => {
        return {
            vod_id: vod.id,
            vod_name: vod.name,
            vod_pic: vod.pic,
            vod_remarks: '',
        };
    });
    return JSON.stringify({
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
        key: 'nivod',
        name: '泥视频',
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