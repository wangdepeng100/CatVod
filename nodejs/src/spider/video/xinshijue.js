import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';
import CryptoJS from 'crypto-js';
import dayjs from 'dayjs';

let HOST = 'https://www.hdmyy.com';

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl, timeout = 20000, extHeader) {
    let headers = {
        'User-Agent': UA,
        'Referer': HOST
    }
    if (extHeader) {
        headers = _.merge(headers, extHeader);
    }
    let res = await req(reqUrl, {
        method: 'get',
        headers: headers,
        timeout: timeout,
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, outResp) {
    await initParseMap();
    return {}
}

let parseMap = {};

async function initParseMap() {
    const t = dayjs(new Date()).format('YYYYMMDD');
    const js = await request(HOST + '/static/js/playerconfig.js?t=' + t);
    try {
        const jsEval = js + '\nMacPlayerConfig';
        const playerList = eval(jsEval).player_list;
        const players = _.values(playerList);
        _.each(players, (item) => {
            if (_.isEmpty(item.parse)) return;
            if (item.show.includes('超清') || item.show.includes('高清')) return;
            parseMap[item.show] = item.parse;
        });
    } catch(e) {
    }
}

async function home(filter) {
    let classes = [{'type_id':1,'type_name':'电影'},{'type_id':2,'type_name':'电视剧'},{'type_id':3,'type_name':'综艺'},{'type_id':4,'type_name':'动漫'},{'type_id':59,'type_name':'短剧'},{'type_id':63,'type_name':'纪录片'}];
   

    return ({
        class: classes,
      
    });
}


async function category(inReq, outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    let page = '';
    if (pg > 1) {
        page = pg;
    }
    const link = HOST + '/vodshow/' + tid + '-' + (extend.area || '') + '-' + (extend.by || '') + '-' + (extend.class || '') + '-' + (extend.lang || '') + '-' + (extend.letter || '') + '---' + page + '---' + (extend.year || '') + '.html';
    const html = await request(link);
    const $ = load(html);
    const items = $('.module-list .module-item');
    const videos = _.map(items, (item) => {
        const $item = $(item);
        const link = $item.find('.module-item-content a:first').attr('href');
        const title = $item.find('.video-name').text().trim();
        const img = $item.find('.module-item-pic img:first').attr('data-src');
        const remarks = $item.find('.module-item-text').text().trim();
        return {
            vod_id: link.replace(/.*?\/video\/(.*).html/g, '$1'),
            vod_name: title,
            vod_pic: img,
            vod_remarks: remarks || '',
        };
    });
    const hasMore = $('#page a.page-next:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    const limit = 40;
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    });
}

async function detail(inReq, outResp) {
    const id = inReq.body.id;
    const html = await request(HOST + '/video/' + id + '.html');
    const $ = load(html);
    const vod = {
        vod_id: id,
        vod_name: $('h1.page-title').text().trim(),
        vod_type: $('.video-info-aux a.tag-link:first').text().trim(),
        vod_area: $('.video-info-aux a.tag-link:eq(2)').text().trim(),
        vod_year: $('.video-info-aux a.tag-link:eq(1)').text().trim(),
        vod_director: $('.video-info-main .video-info-items:contains(导演：)').text().substring(3).trim().replace(/(^\/|\/$)/g, '').trim(),
        vod_actor: $('.video-info-main .video-info-items:contains(主演：)').text().substring(3).trim().replace(/(^\/|\/$)/g, '').trim(),
        vod_pic: $('.video-cover img:first').attr('data-src'),
        vod_remarks : $('.video-info-main .video-info-items:contains(备注：)').text().substring(3) || '',
        vod_content: $('.video-info-main .video-info-items:contains(剧情：)').text().substring(3).trim().replace(/收起$/g, ''),
    };
    const playMap = {};
    const tabs = $('.module-player-tab .module-tab-item');
    const playlists = $('.module-player-list > .module-blocklist');
    _.each(tabs, (tab, i) => {
        const $tab = $(tab);
        const from = $tab.find('span:first').text().trim();
        if (from.includes('夸克')) return;
        let list = playlists[i];
        list = $(list).find('a');
        _.each(list, (it) => {
            const $it = $(it);
            const title = $it.find('span:first').text().trim();
            const playUrl = $it.attr('href');
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
    return ({
        list: [vod],
    });
}

async function play(inReq, outResp) {
    const id = inReq.body.id;
    const flag = inReq.body.flag;
    const link = HOST + id;
    const html = await request(link);
    let $ = load(html);
    let json = $('script:contains(player_aaaa)').text().replace('var player_aaaa=','');
    let js = JSON.parse(json);
    let playUrl = js.url;
    if (js.encrypt == 1) {
        playUrl = unescape(playUrl);
    } else if (js.encrypt == 2) {
        playUrl = unescape(base64Decode(playUrl));
    }
    let parseUrl = parseMap[flag];
    if (parseUrl) {
        const extHeader = {
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Dest': 'iframe',
        };
        let playHtml = await request(parseUrl + playUrl, 10000, extHeader);
        json = playHtml.match(/let ConFig = {([\w\W]*)},box/)[1];
        const jsConfig = JSON.parse('{' + json.trim() + '}');
        playUrl = decryptUrl(jsConfig);
    }
    return {
        parse: 0,
        url: playUrl,
        header: {
            'User-Agent': UA,
        }
    };
}

function decryptUrl(jsConfig) {
    const key = CryptoJS.enc.Utf8.parse('2890' + jsConfig.config.uid + 'tB959C');
    const iv = CryptoJS.enc.Utf8.parse('2F131BE91247866E');
    const mode = CryptoJS.mode.CBC;
    const padding = CryptoJS.pad.Pkcs7;
    const decrypted = CryptoJS.AES.decrypt(jsConfig.url, key, {
        'iv': iv,
        'mode': mode,
        'padding': padding
    });
    const decryptedUrl = CryptoJS.enc.Utf8.stringify(decrypted);
    return decryptedUrl;
}

function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    let data = await request(HOST + '/index.php/ajax/suggest?mid=1&limit=50&wd=' + wd).list;
    console.log(data);
    let videos = [];
    for (const vod of data) {
        videos.push({
            vod_id: vod.id,
            vod_name: vod.name,
            vod_pic: vod.pic,
            vod_remarks: '',
        });
    }
    return ({
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
                    // id: dataResult.category.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),
                    id: 156812,
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
        key: 'xinshijue',
        name: '🟢 视觉',
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