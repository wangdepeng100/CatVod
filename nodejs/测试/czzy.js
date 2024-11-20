// 自动从 地址发布页 获取&跳转url地址
// import { Crypto, load, _ } from '../../util/cat.js';
import req from '../../util/req.js';

import CryptoJS from 'crypto-js';
import { load } from 'cheerio';

import pkg from 'lodash';
const { _ } = pkg;

let key = 'czzy';
let url = '';
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
    };
    if (referer) headers.referer = encodeURIComponent(referer);
    let res = await req(reqUrl, {
        method: mth || 'get',
        headers: headers,
        data: data,
        postType: mth === 'post' ? 'form' : '',
    });
    if (res.headers['set-cookie']) {
        const set_cookie = _.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'].join(';') : res.headers['set-cookie'];
        const cks = set_cookie.split(';');
        for (const c of cks) {
            const tmp = c.trim();
            if (tmp.startsWith('result=')) {
                cookie.result = tmp.substring(7);
                return await request(reqUrl, reqUrl, 'post', {
                    result: cookie.result,
                });
            } else if (tmp.startsWith('esc_search_captcha=1')) {
                cookie.esc_search_captcha = 1;
                delete cookie.result;
                return await request(reqUrl);
            }
        }
        // console.log(res.headers['set-cookie']);
    }
    // return res.content;
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, outResp) {
    // siteKey = cfg.skey;
    // siteType = cfg.stype;
    // url = await checkValidUrl(null);
    // let validUrl = ext;

    let html = await request(inReq.server.config.czzy.url);
    let matches = html.matchAll(/推荐访问<a href="(.*)"/g);
    for (let match of matches) {
        try {
            let rcmdUrl = match[1];
            let res = await req(rcmdUrl, {
                method: 'get',
                headers: {
                    'User-Agent': UA,
                },
                redirect: 0,
            });
            let location = res.headers['location'];
            if (!_.isEmpty(location)) {
                url = location;
            } else {
                url = rcmdUrl;
                break;
            }
        } catch(e) {
        }
    }

    console.debug('厂长跳转地址 =====>' + url); // js_debug.log
    return {};
}

async function home(inReq, outResp) {
    let filterObj = {};
    const html = await request(url + '/movie_bt');
    const $ = load(html);
    const tags = $('div#beautiful-taxonomy-filters-tax-movie_bt_tags > a');
    let tag = {
        key: 'tag',
        name: '类型',
        value: _.map(tags, (n) => {
            let v = n.attribs['cat-url'] || '';
            v = v.substring(v.lastIndexOf('/') + 1);
            return { n: n.children[0].data, v: v };
        }),
    };
    tag['init'] = tag.value[0].v;
    const series = $('div#beautiful-taxonomy-filters-tax-movie_bt_series > a[cat-url*=movie_bt_series]');
    let classes = _.map(series, (s) => {
        let typeId = s.attribs['cat-url'];
        typeId = typeId.substring(typeId.lastIndexOf('/') + 1);
        filterObj[typeId] = [tag];
        return {
            type_id: typeId,
            type_name: s.children[0].data,
        };
    });
    const sortName = ['电影', '电视剧', '国产剧', '美剧', '韩剧', '日剧', '海外剧（其他）', '华语电影', '印度电影', '日本电影', '欧美电影', '韩国电影', '动画', '俄罗斯电影', '加拿大电影'];
    classes = _.sortBy(classes, (c) => {
        const index = sortName.indexOf(c.type_name);
        return index === -1 ? sortName.length : index;
    });
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function category(inReq, _outResp) {
    // tid, pg, filter, extend
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;

	if(pg <= 0) pg = 1;

    const tag = extend.tag || '';
    const link = url + '/movie_bt' + (tag.length > 0 ? `/movie_bt_tags/${tag}` : '') + '/movie_bt_series/' + tid + (pg > 1 ? `/page/${pg}` : '');
    // const link = url + "/" + tid + (extend.area || "") + (extend.year || "") + (extend.class || "") + (extend.catedd || "") + "/page/" + pg;
    const html = await request(link);
    const $ = load(html);
    const items = $('div.mrb > ul > li');
    let videos = _.map(items, (item) => {
        const img = $(item).find('img:first')[0];
        const a = $(item).find('a:first')[0];
        const hdinfo = $($(item).find('div.hdinfo')[0]).text().trim();
        const jidi = $($(item).find('div.jidi')[0]).text().trim();
        return {
            vod_id: a.attribs.href.replace(/.*?\/movie\/(.*).html/g, '$1'),
            vod_name: img.attribs.alt,
            vod_pic: img.attribs['data-original'],
            vod_remarks: jidi || hdinfo || '',
        };
    });

    const hasMore = $('div.mrb > div.pagenavi_txt > a:contains(>)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 20,
        total: 20 * pgCount,
        list: videos,
    });
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

        const html = await request(url + '/movie/' + id + '.html');
        const $ = load(html);
        const detail = $('ul.moviedteail_list > li');
        let vod = {
            vod_id: id,
            vod_pic: $('div.dyimg img:first').attr('src'),
            vod_remarks: '',
            vod_content: stripHtmlTag($('div.yp_context').html()).trim(),
        };
        for (const info of detail) {
            const i = $(info).text().trim();
            if (i.startsWith('地区：')) {
                vod.vod_area = i.substring(3);
            } else if (i.startsWith('年份：')) {
                vod.vod_year = i.substring(3);
            } else if (i.startsWith('导演：')) {
                vod.vod_director = _.map($(info).find('a'), (a) => {
                    return a.children[0].data;
                }).join('/');
            } else if (i.startsWith('主演：')) {
                vod.vod_actor = _.map($(info).find('a'), (a) => {
                    return a.children[0].data;
                }).join('/');
            } else if (i.startsWith('语言：')) {
                vod.vod_lang = i.substring(3);
            }
        }
        const playlist = _.map($('div.paly_list_btn > a'), (a) => {
            return a.children[0].data + '$' + a.attribs.href.replace(/.*?\/v_play\/(.*).html/g, '$1');
        });
        vod.vod_play_from = key;
        vod.vod_play_url = playlist.join('#');
        videos.push(vod);
    }
    
    return {
        list: videos,
    };
}

// var parse = [];
async function play(inReq, _outResp) {
    const id = inReq.body.id;

    const link = url + '/v_play/' + id + '.html';
    const html = await request(link);
    const $ = load(html);
    
    // const iframe = $('body iframe[src*=Cloud]');
    const iframe = $('.videoplay iframe');
    if (iframe.length > 0) {
        const rUrl = iframe[0].attribs.src;

        // 请求
        const iframeHtml = (
            await req(rUrl, {
                headers: {
                    Referer: link,
                    'User-Agent': UA,
                },
            })
        ).data;

        const rand = iframeHtml.match(/var rand = "(.*?)"/); // .split('').reverse().join('');
        const encrypted = iframeHtml.match(/var player = "(.*?)"/); // .split('').reverse().join('');
        if (!_.isEmpty(rand) && !_.isEmpty(encrypted)){
            const key = CryptoJS.enc.Utf8.parse('VFBTzdujpR9FWBhe');
            const iv = CryptoJS.enc.Utf8.parse(rand);

            const decrypted = decryptPlayer(encrypted[1], 'VFBTzdujpR9FWBhe', rand[1]);

            const list = JSON.parse(decrypted);
            return JSON.stringify({
                parse: 0,
                url: list.url,
            });
        } else {
            const resultv2Match = iframeHtml.match(/var result_v2 = {(.*?)};/);
            if (!_.isEmpty(resultv2Match)) {
                const resultv2 = JSON.parse('{' + resultv2Match[1] + '}');
                const playUrl = decryptResultV2(resultv2.data);
                return ({
                    parse: 0,
                    url: playUrl,
                });
            } else {
                return ({
                    parse: 0,
                    url: rUrl,
                });
            }
        }
    } else {
        const js = $('script:contains(window.wp_nonce)').html();
        const group = js.match(/(var.*)eval\((\w*\(\w*\))\)/);
        const md5 = CryptoJS;
        const result = eval(group[1] + group[2]);
        const playUrl = result.match(/url:.*?['"](.*?)['"]/)[1];
        return JSON.stringify({
            parse: 0,
            url: playUrl,
        });
    }
}

function decryptPlayer(text, key, iv) {
    const keyData = CryptoJS.enc.Utf8.parse(key || 'PBfAUnTdMjNDe6pL');
    const ivData = CryptoJS.enc.Utf8.parse(iv || 'sENS6bVbwSfvnXrj');
    const content = CryptoJS.AES.decrypt(text, keyData, {
        iv: ivData,
        padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);
    return content;

    /* 原来的解密
    var decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    
    // 转换为 utf8 字符串
    decrypted = CryptoJS.enc.Utf8.stringify(decrypted);*/
}

function decryptResultV2(text) {
    const data = text.split('').reverse().join('');
    const hexData = CryptoJS.enc.Hex.parse(data);
    const decoded = hexData.toString(CryptoJS.enc.Utf8);
    const pos = (decoded.length - 7) / 2;
    const firstPart = decoded.substring(0, pos);
    const secondPart = decoded.substring(pos + 7);
    return firstPart + secondPart;
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;

    // 原open.js搜索也是失效,提示: You are unable to access
    // const html = await request(url + '/xsseanmch/?q=' + wd);
    const html = await request(url + '/?s=' + wd);
    const $ = load(html);
    const items = $('div.search_list > ul > li');
    let videos = _.map(items, (item) => {
        const img = $(item).find('img:first')[0];
        const a = $(item).find('a:first')[0];
        const hdinfo = $($(item).find('div.hdinfo')[0]).text().trim();
        const jidi = $($(item).find('div.jidi')[0]).text().trim();
        return {
            vod_id: a.attribs.href.replace(/.*?\/movie\/(.*).html/g, '$1'),
            vod_name: img.attribs.alt,
            vod_pic: img.attribs['data-original'],
            vod_remarks: jidi || hdinfo || '',
        };
    });
    return JSON.stringify({
        list: videos,
    });
}

async function test2(inReq, outResp) {
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
                    id: dataResult.category.list[2].vod_id, // dataResult.category.list.map((v) => v.vod_id),
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
                            console.log(urls);
                            for (let i = 0; i < urls.length && i < 2; i++) {
                                resp = await inReq.server.inject().post(`${prefix}/play`).payload({
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
        /*
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '暴走',
            page: 1,
        });
        dataResult.search = resp.json();*/
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

async function test(inReq, outResp) {
    try {
        // const id = inReq.body.id;
        const printErr = function (json) {
            if (json.statusCode && json.statusCode == 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        
        let resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
            // id: dataResult.category.list[2].vod_id, // dataResult.category.list.map((v) => v.vod_id),
            id : 733
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
                    console.log(urls);
                    for (let i = 0; i < urls.length && i < 2; i++) {
                        resp = await inReq.server.inject().post(`${prefix}/play`).payload({
                            flag: flag,
                            id: urls[i].split('$')[1],
                        });
                        dataResult.play.push(resp.json());
                    }
                }
            }
        }

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
        key: 'czzy',
        name: '厂长资源',
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