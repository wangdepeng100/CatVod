import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';
import axios from 'axios';

let key = '爱上你听书网';
let HOST = 'https://www.230ts.org';
let siteKey = '';
let siteType = 0;
const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 11; M2007J3SC Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045714 Mobile Safari/537.36';

/*async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': MOBILE_UA,
            'Referer': HOST
        },
    });
    return res.data;
}*/

async function requestRaw(reqUrl, headers, redirect) {
    const res = await req(reqUrl, {
 //       method: 'get',
        headers:{
            'User-Agent': MOBILE_UA,
            'Referer': HOST,
        },
        validateStatus: status => status >= 200 && status < 400,
        maxRedirects: redirect,
    });
    return res;
}

async function request(reqUrl) {
    let resRaw = await requestRaw(reqUrl);
    return resRaw.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    return {}
}

async function home(filter) {
    let classes = [{'type_id':'xuanhuan','type_name':'玄幻有声'},{'type_id':'lingyi','type_name':'灵异有声'},{'type_id':'dushi','type_name':'都市有声'},{'type_id':'junshi','type_name':'军事有声'},{'type_id':'pingshu','type_name':'长篇评书'}];
    let filterObj = {}
    return ({
        class: classes,
        filters: filterObj,
    });
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    const link = HOST + '/sort/' + tid +'/' + pg + '.html';
 //   console.log(link);
    const html = await request(link);
 //   console.log('dddd:....' + html);
    const $ = load(html);
    const items = $('ul.book-ol > li');
    console.log(items);
    let books = _.map(items, (item) => {
        const it = $(item).find('a:first')[0];
        const img = $(item).find('img:first')[0];
        const remarks = $($(item).find('div.book-meta')[0]).text().trim();
        return {
            book_id: it.attribs.href.replace(/.*?\/tingshu\/(.*)/g, '$1'),
            book_name: it.attribs.title.replace('有声小说',''),
            book_pic: HOST + img.attribs['data-original'],
            book_remarks: remarks.replace('佚名（著）','').replace('佚名（播）','').replace('未知（著）','').replace('未知（播）','') || '',
        };
    });
    const hasMore = $('div.paging > a:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 24,
        total: 24 * pgCount,
        list: books,
    });
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    console.log(ids);
    const books = [];
    for (const id of ids) {
    const html = await request(HOST + '/tingshu/' + id);
    console.log(html);
    const $ = load(html);
    const detail = $('div.book-cell:first > div');
    let book = {
        audio: 1,
        book_id: id,
        book_name: $('h1:first').text().trim().replace('有声小说',''),
        book_pic: HOST + $('div.myui-content__thumb img:first').attr('data-original'),
        book_content: $('div.ellipsis').text().trim(),
    };
    for (const info of detail) {
        const i = $(info).text().trim();
        if (i.startsWith('类型：')) {
            book.vod_type = _.map($(info).find('a'), (a) => {
                return a.children[0].data;
            }).join('/');
        } else if (i.startsWith('作者：')) {
            book.vod_director = _.map($(info).find('a'), (a) => {
                return a.children[0].data;
            }).join('/');
        } else if (i.startsWith('演播：')) {
            book.vod_actor = _.map($(info).find('a'), (a) => {
                return a.children[0].data;
            }).join('/');
        } else if (i.startsWith('连载中')) {
            book.vod_remarks = i.substring(3);
        }
    }
    const playlist = _.map($('#playlist > ul > li > a'), (it) => {
        return it.children[0].data + '$' + it.attribs.href.replace(/\/mp3\/(.*).html/g, '$1');
    });
    book.volumes = '书卷';
    book.urls = playlist.join('#');
    books.push(book);
}
    return JSON.stringify({
        list: books,
    });
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const link = HOST + '/mp3/' + id + '.html';
    const html = await request(link);
    const $ = load(html);
    const iframe = $('body iframe[src*=player]');
    console.log('cccccccc:....' + iframe);

    const iframeHtml = (
        await req(HOST + iframe[0].attribs.src, {
            headers: {
                'Referer': link,
                'User-Agent': MOBILE_UA,
            },
        })
    ).data;
    console.log('vvvvvv:....' + iframeHtml);
    const playUrl = iframeHtml.match(/mp3:'(.*?)'/)[1];
    if (playUrl.indexOf('m4a') >= 0 || playUrl.indexOf('mp3') >= 0 ) {
        return JSON.stringify({
            parse: 0,
            url: playUrl,
        });
    } else {
        try {
            const iframeHtml = (
                await req(HOST + iframe[0].attribs.src, {
                    headers: {
                        'Referer': link,
                        'User-Agent': MOBILE_UA,
                    },
                })
            ).data;
            const playUrl = playUrl + '.m4a' + iframeHtml.match(/(\?.*?)'/)[1];
            if (playUrl.indexOf('http') >= 0) {
                return JSON.stringify({
                    parse: 0,
                    url: playUrl,
                });
            } else {
                const iframeHtml = (
                    await req(HOST + iframe[0].attribs.src, {
                        headers: {
                            'Referer': link,
                            'User-Agent': MOBILE_UA,
                        },
                    })
                ).data;
                const playUrl2 = iframeHtml.match(/url[\s\S]*?(http.*?)'/)[1];
                if (playUrl2.indexOf('\?') >= 0) {
                    return JSON.stringify({
                        parse: 0,
                        url: playUrl2,
                    });
                } else {
                    const playUrl3 = playUrl2 + playUrl
                    return JSON.stringify({
                        parse: 0,
                        url: playUrl3,
                    });
                }
            }
        } catch (e) {}
        if (playUrl.indexOf('http') >= 0) {
            const playUrl = playUrl + '.m4a';
            return JSON.stringify({
                parse: 0,
                url: playUrl,
            });
        } else {
            const iframeHtml = (
                await req(HOST + iframe[0].attribs.src, {
                    headers: {
                        'Referer': link,
                        'User-Agent': MOBILE_UA,
                    },
                })
            ).data;
            const playUrl4 = iframeHtml.match(/url[\s\S]*?(http.*?)'/)[1];
            return JSON.stringify({
                parse: 0,
                url: playUrl4 + '.m4a',
            });
        }
    }
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    const link = HOST + '/search.html?searchtype=name&searchword=' + wd +'&page=1';
    const html = await request(link);
    const $ = load(html);
    const items = $('ul.book-ol > li');
    let books = _.map(items, (item) => {
        const it = $(item).find('a:first')[0];
        const img = $(item).find('img:first')[0];
        const remarks = $($(item).find('div.book-meta')[0]).text().trim();
        return {
            book_id: it.attribs.href.replace(/.*?\/tingshu\/(.*)/g, '$1'),
            book_name: it.attribs.title.replace('有声小说',''),
            book_pic: img.attribs['data-original'],
            book_remarks: remarks.replace('佚名（著）','').replace('佚名（播）','').replace('未知（著）','').replace('未知（播）','') || '',
        };
    });
    return JSON.stringify({
        list: books,
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
                    id: dataResult.category.list[0].book_id, // dataResult.category.list.map((v) => v.vod_id),
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                if (dataResult.detail.list && dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    for (const book of dataResult.detail.list) {
                        const flags = book.volumes.split('$$$');
                        const ids = book.urls.split('$$$');
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
        key: 'ts230',
        name: '🎧 爱上听书',
        type: 10,
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