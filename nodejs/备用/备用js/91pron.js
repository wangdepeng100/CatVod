import req from '../../util/req.js';
import { MOBILE_UA, PC_UA } from '../../util/misc.js';
import { load } from 'cheerio';
import { decode } from 'urlencode';

let url = 'https://91porn.com';

async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'Accept-Language': 'zh,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
            'User-Agent': MOBILE_UA,
        },
    });
    return resp.data;
}

async function init(inReq, _outResp) {
    return {};
}

async function home(inReq, _outResp) {
    var html = await request(url + '/v.php?category=rf&amp;viewtype=basic&amp;page=1');
    const $ = load(html);
    let classes = [];
    for (const a of $('ul.nav a[href!="/"]')) {
        if (a.attribs.href.match(/.*?category.*/)) {
            classes.push({
                type_id: a.attribs.href,
                type_name: a.children[0].data == undefined ? '动漫' : a.children[0].data.trim(),
            });
        }
    }
    return {
        class: classes,
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    let page = pg || 1;
    if (page == 0) page = 1;
    const html = await request(tid + '&page=' + pg);
    const $ = load(html);
    let videos = [];
    for (const item of $('div.col-xs-12')) {
        const a = $(item).find('a')[0];
        const name = $($(item).find('span.video-title')[0]).text().trim();
        const img = $($(item).find('img')[0]).attr('src');
        const remarks = $($(item).find('span.info')[0]).text().trim();
        videos.push({
            vod_id: a.attribs.href,
            vod_name: name,
            vod_pic: img,
            vod_remarks: remarks || '',
        });
    }
    const hasMore = $('div.paging > a:contains(»)').length > 0;
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
    var html = await request(`${id}`);
    var $ = load(html);
    var vod = {
        vod_id: id,
        vod_name: $('h4.login_register_header').text().trim(),
    };
    let playFroms = [];
    let playUrls = [];
    const temp = [];
    playFroms.push('不知道倾情打造');
    const urls = html.match(/document\.write\(strencode2\("(.*?)"\)\)/)[1];
    const playUrl = decode(urls).match(/src='(.*?)'/)[1];
    temp.push(vod.vod_name + '$' + playUrl);
    playUrls.push(temp.join('#'));
    vod.vod_play_from = playFroms.join('$$$');
    vod.vod_play_url = playUrls.join('$$$');
    return JSON.stringify({
        list: [vod],
    });
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return JSON.stringify({
        parse: 0,
        url: id,
    });
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let html = await request(`${url}/dm/search/q-${wd}`);
    const $ = load(html);
    let videos = [];
    for (const item of $('.stui-vodlist__box')) {
        const a = $(item).find('a')[0];
        videos.push({
            vod_id: a.attribs.href,
            vod_name: a.attribs.title,
            vod_pic: a.attribs['data-echo-background'],
        });
    }
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
            if (dataResult.category.list && dataResult.category.list.length > 0) {
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
        // resp = await inReq.server.inject().post(`${prefix}/search`).payload({
        //   wd: '爱',
        //   page: 1,
        // });
        // dataResult.search = resp.json();
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
        key: 'pron',
        name: '91pron',
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
