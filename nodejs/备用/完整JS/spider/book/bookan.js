import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;

let url = 'https://api.bookan.com.cn';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    return {}
}

async function home(filter) {
    return ({
        class: [
            { type_id: '1305', type_name: '少年读物' },
            { type_id: '1304', type_name: '儿童文学' },
            { type_id: '1320', type_name: '国学经典' },
            { type_id: '1306', type_name: '文艺少年' },
            { type_id: '1309', type_name: '育儿心经' },
            { type_id: '1310', type_name: '心理哲学' },
            { type_id: '1307', type_name: '青春励志' },
            { type_id: '1312', type_name: '历史小说' },
            { type_id: '1303', type_name: '故事会' },
            { type_id: '1317', type_name: '音乐戏剧' },
            { type_id: '1319', type_name: '相声评书' },
        ],
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    pg = pg || 1;
    if (pg == 0) pg = 1;
    let content = await request(`${url}/voice/book/list?instance_id=25304&page=${pg}&category_id=${tid}&num=24`);
    let data = content.data;
    let books = [];
    for (const book of data.list) {
        books.push({
            book_id: book.id,
            book_name: book.name,
            book_pic: book.cover,
            book_remarks: book.extra.author,
        });
    }
    return ({
        page: data.current_page,
        pagecount: data.last_page,
        limit: 24,
        total: data.total,
        list: books,
    });
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    let content = await request(`${url}/voice/album/units?album_id=${id}&page=1&num=200&order=1`);
    let data = content.data;

    let book = {
        audio: 1,
        book_id: id,
        type_name: '',
        book_year: '',
        book_area: '',
        book_remarks: '',
        book_actor: '',
        book_director: '',
        book_content: '',
    };
    let us = _.map(data.list, function (b) {
        return formatPlayUrl(b.title) + '$' + b.file;
    }).join('#');
    book.volumes = '书卷';
    book.urls = us;

    return ({
        list: [book],
    });
}

function formatPlayUrl(name) {
    return name
        .trim()
        .replace(/<|>|《|》/g, '')
        .replace(/\$|#/g, ' ')
        .trim();
}

async function proxy(segments, headers) {}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return ({
        parse: 0,
        url: id,
    });
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    pg = pg || 1;
    if (pg == 0) pg = 1;
    let content = await request(`https://es.bookan.com.cn/api/v3/voice/book?instanceId=25304&keyword=${wd}&pageNum=${pg}&limitNum=20`);
    let data = content.data;
    let books = [];
    for (const book of data.list) {
        books.push({
            book_id: book.id,
            book_name: book.name,
            book_pic: book.cover,
            book_remarks: book.extra.author,
        });
    }
    return ({
        page: data.current_page,
        pagecount: data.last_page,
        limit: 20,
        total: data.total,
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
        key: 'bookan',
        name: '🎧 博看听书',
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