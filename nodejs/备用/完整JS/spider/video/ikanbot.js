// import { Crypto, load, _ } from '../../util/cat.js';
import req from '../../util/req.js';
import Crypto from 'crypto-js';

import { load } from 'cheerio';

import pkg from 'lodash';
const { _ } = pkg;

let key = 'ikanbot';
// let url = 'https://www.aikanbot.com';
let url = '';
let siteKey = '';
let siteType = 0;

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || UA,
            'referer': url
        },
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    // siteKey = cfg.skey;
    // siteType = cfg.stype;
    url = 'https://www.aikanbot.com';
    return {};
}

function getClass($) {
    const nav = $('ul.nav-pills:eq(1) > li > a');
    let tags = {
        key: 'tag',
        name: '标签',
        value: _.map(nav, (n) => {
            return { n: n.children[0].data, v: n.attribs.href };
        }),
    };
    tags['init'] = tags.value[0].v;
    const title = $('title:first').text().split('-')[0].substring(2);
    return { cls: { type_id: tags.value[0].v, type_name: title }, tags: [tags] };
}

async function home(_inReq, _outResp) {
    let classes = [];
    let filterObj = {};
    for (const cate of ['/hot/index-movie-热门.html', '/hot/index-tv-热门.html']) {
        const html = await request(url + cate);
        const $ = load(html);
        const { cls, tags } = getClass($);
        classes.push(cls);
        filterObj[cls.type_id] = tags;
    }
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function homeVod() {
    const html = await request(url);
    const $ = load(html);
    const items = $('div.v-list a.item');
    // var jsBase = await js2Proxy(true, siteType, siteKey, 'img/', {});
    let videos = _.map(items, (item) => {
        const img = $(item).find('img:first')[0];
        return {
            vod_id: item.attribs.href,
            vod_name: img.attribs.alt,
            vod_pic: '', // jsBase + base64Encode(img.attribs['data-src']),
            vod_remarks: '',
        };
    });
    return JSON.stringify({
        list: videos,
    });
}

async function category(inReq, _outResp) {
    // tid, pg, filter, extend
    // if (pg <= 0) pg = 1;
    let tid = inReq.body.id;
    let pg = inReq.body.page;
    let extend = inReq.body.filters;

	if(pg <= 0) pg = 1;

    const link = url + (extend.tag || tid).replace('.html', pg > 1 ? `-p-${pg}.html` : '.html');
    const html = await request(link);
    const $ = load(html);
    const items = $('div.v-list a.item');
    // var jsBase = await js2Proxy(true, siteType, siteKey, 'img/', {});

    const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/picurl';
    let videos = _.map(items, (item) => {
        const img = $(item).find('img:first')[0];
        return {
            vod_id: item.attribs.href,
            vod_name: img.attribs.alt,
            vod_pic: proxyUrl + '/' + base64Encode(img.attribs['data-src']),
            vod_remarks: '',
        };
    });
    const hasMore = $('div.page-more > a:contains(下一页)').length > 0;
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
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];

    for (const id of ids) {
        const html = await request(url + id);
        const $ = load(html);
        // var jsBase = await js2Proxy(true, siteType, siteKey, 'img/', {});
        const detail = $('div.detail');
        const remarks = $('span#line-tips').text();
        let vod = {
            vod_id: id,
            vod_pic: '', // jsBase + base64Encode($('div.item-root > img')[0].attribs['data-src']),
            vod_remarks: '',
            vod_content: remarks || '',
            vod_name: $(detail).find('h2').text().trim(),
            vod_year: $(detail).find('h3:nth-child(3)').text(),
            vod_area: $(detail).find('h3:nth-child(4)').text(),
            vod_actor: $(detail).find('h3:nth-child(5)').text(),
        };
        const token = getToken($);
        const res = await req(url + '/api/getResN?videoId=' + id.substring(id.lastIndexOf('/') + 1) + '&mtype=2&token=' + token, {
            headers: {
                Referer: 'play',
                'User-Agent': UA,
            },
        });
        const list = res.data.data.list;
        let playlist = {};
        let arr = []
        for (const l of list) {
            const flagData = JSON.parse(l.resData);
            for (const f of flagData) {
                const from = f.flag;
                const urls = f.url;
                if (!from || !urls) continue;
                if (playlist[from]) continue;
                playlist[from] = urls;
            }
        }
        for (var key in playlist) {
            if ('kuaikan' == key) {
                arr.push({
                    flag: '快看',
                    url: playlist[key],
                    sort: 1
                })
            } else if ('bfzym3u8' == key) {
                arr.push({
                    flag: '暴风',
                    url: playlist[key],
                    sort: 2
                })
            } else if ('ffm3u8' == key) {
                arr.push({
                    flag: '非凡',
                    url: playlist[key],
                    sort: 3
                })
            } else if ('lzm3u8' == key) {
                arr.push({
                    flag: '量子',
                    url: playlist[key],
                    sort: 4
                })
            		 } else if ('1080zyk' == key) {
                arr.push({
                    flag: '优质',
                    url: playlist[key],
                    sort: 5
                })
		 } else if ('jsm3u8' == key) {
                arr.push({
                    flag: '极速',
                    url: playlist[key],
                    sort: 6
                })
		 } else if ('qhm3u8' == key) {
                arr.push({
                    flag: '奇虎',
                    url: playlist[key],
                    sort: 7
                })
		 } else if ('zuidam3u8' == key) {
                arr.push({
                    flag: '最大',
                    url: playlist[key],
                    sort: 8
                })
		 } else if ('tkm3u8' == key) {
                arr.push({
                    flag: '天空',
                    url: playlist[key],
                    sort: 9
                })
		 } else if ('wjm3u8' == key) {
                arr.push({
                    flag: '无尽',
                    url: playlist[key],
                    sort: 10
                })
		 } else if ('kcm3u8' == key) {
                arr.push({
                    flag: '快车',
                    url: playlist[key],
                    sort: 11
                })
		 } else if ('sdm3u8' == key) {
                arr.push({
                    flag: '闪电',
                    url: playlist[key],
                    sort: 12
                })
		 } else if ('wolong' == key) {
                arr.push({
                    flag: '卧龙',
                    url: playlist[key],
                    sort: 13
                })
		 } else if ('ikm3u8' == key) {
                arr.push({
                    flag: '爱坤',
                    url: playlist[key],
                    sort: 14
                })
		 } else if ('gsm3u8' == key) {
                arr.push({
                    flag: '光速',
                    url: playlist[key],
                    sort: 15
                })
		 } else if ('snm3u8' == key) {
                arr.push({
                    flag: '索尼',
                    url: playlist[key],
                    sort: 16
                })
		 } else if ('jinyingm3u8' == key) {
                arr.push({
                    flag: '金鹰',
                    url: playlist[key],
                    sort: 17
                })
		 } else if ('xlm3u8' == key) {
                arr.push({
                    flag: '新浪',
                    url: playlist[key],
                    sort: 18
                })
		 } else if ('fsm3u8' == key) {
                arr.push({
                    flag: '飞速',
                    url: playlist[key],
                    sort: 19
                })
		 } else if ('ukm3u8' == key) {
                arr.push({
                    flag: 'U酷',
                    url: playlist[key],
                    sort: 20
                })
		 } else if ('yhm3u8' == key) {
                arr.push({
                    flag: '樱花',
                    url: playlist[key],
                    sort: 21
                })
		 } else if ('lem3u8' == key) {
                arr.push({
                    flag: '鱼乐',
                    url: playlist[key],
                    sort: 22
                })
		 } else if ('dbm3u8' == key) {
                arr.push({
                    flag: '百度',
                    url: playlist[key],
                    sort: 23
                })
		 } else if ('tpm3u8' == key) {
                arr.push({
                    flag: '淘片',
                    url: playlist[key],
                    sort: 24
                })
		 } else if ('68zy_m3u8' == key) {
                arr.push({
                    flag: '六八',
                    url: playlist[key],
                    sort: 25
                })	
		 } else if ('bjm3u8' == key) {
                arr.push({
                    flag: '八戒',
                    url: playlist[key],
                    sort: 26
                })
		 } else if ('tomm3u8' == key) {
                arr.push({
                    flag: '番茄',
                    url: playlist[key],
                    sort: 27
                })			
        } else if ('hhm3u8' == key) {
                arr.push({
                    flag: '豪华',
                    url: playlist[key],
                    sort: 28
                })  
        } else if ('hym3u8' == key) {
                arr.push({
                    flag: '虎牙',
                    url: playlist[key],
                    sort: 29
                })  
        } else if ('49zyw' == key) {
                arr.push({
                    flag: '四九',
                    url: playlist[key],
                    sort: 30
                })          
            } else {
                arr.push({
                    flag: key,
                    url: playlist[key],
                    sort: 31
                })
            }
        }
        arr.sort((a, b) => a.sort - b.sort);
        let playFrom = [];
        let playList = [];
        arr.map(val => {
            playFrom.push(val.flag);
            playList.push(val.url);
        })
        vod.vod_play_from = playFrom.join("$$$");
        vod.vod_play_url = playList.join("$$$");
        videos.push(vod);
    }
    return JSON.stringify({
        list: videos,
    });
}

function getToken($) {
    const currentId = $('#current_id').val();
    let eToken = $('#e_token').val();
    if (!currentId || !eToken) return '';
    const idLength = currentId.length;
    const subId = currentId.substring(idLength - 4, idLength);
    let keys = [];
    for (let i = 0; i < subId.length; i++) {
        const curInt = parseInt(subId[i]);
        const splitPos = curInt % 3 + 1;
        keys[i] = eToken.substring(splitPos, splitPos + 8);
        eToken = eToken.substring(splitPos + 8, eToken.length);
    }
    return keys.join('');
}

function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text));
}

function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text));
}

async function proxy(inReq, outResp) {
    const site = inReq.params.site;
    const what = inReq.params.what;
    if (site == 'picurl') {
        const t = base64Decode(what)
        var resp = await req(t, {
            // buffer: 2,
            headers: {
                Referer: url,
                'User-Agent': UA,
            },
            responseType: 'arraybuffer',
            
        });
        // outResp.code(200).content = resp.data;
        outResp.code(200).headers('Content-Type', resp.headers['Content-Type']).send(resp.data);
    }
}

async function play(inReq, _outResp) {
    const tid = inReq.body.id;
    return JSON.stringify({
        parse: 0,
        url: tid,
    });
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;

    // search?q=爱
    // if (pg <= 0 || typeof(pg) == 'undefined') pg = 1;
    var req = '';
    if (pg === 1) {
        req = url + '/search?q=' + wd;
    } else {
        req = url + '/search?q=' + wd + '&p=' + pg;
    }

    const html = await request(req); // + pg
    const $ = load(html);
    const items = $('div.media');
    // var jsBase = await js2Proxy(true, siteType, siteKey, 'img/', {});
    let videos = _.map(items, (item) => {
        const a = $(item).find('a:first')[0];
        const img = $(item).find('img:first')[0];
        const remarks = $($(item).find('span.label')[0]).text().trim();
        return {
            vod_id: a.attribs.href,
            vod_name: img.attribs.alt,
            vod_pic: '', // jsBase + base64Encode(img.attribs['data-src']),
            vod_remarks: remarks || '',
        };
    });
    const hasMore = $('div.page-more > a:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
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
        key: 'ikanbot',
        name: '🟢 爱看',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what', proxy);
        fastify.get('/test', test);
    },
};