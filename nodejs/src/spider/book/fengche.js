import req from '../../util/req.js';
import { load } from 'cheerio';
import iconv from 'iconv-lite';
import { PC_UA } from '../../util/misc.js';
import CryptoJS from 'crypto-js';

let Host = 'https://www.qyy158.com';
async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        responseType: 'arraybuffer',
    });
    return iconv.decode(resp.data, 'gb2312');
}

function base64Encode(text) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}

function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
}

async function init(inReq, _outResp) {
    return {};
}

async function home(inReq, _outResp) {
    const classes = [{ type_id: 'all', type_name: 'all' }];
    const filterObj = {
        all: [
            {
                key: 'area',
                name: '地域',
                init: '',
                value: [
                    { n: '全部', v: '' },
                    { n: '大陆', v: '1' },
                    { n: '日本', v: '2' },
                    { n: '韩国', v: '3' },
                    { n: '欧美', v: '4' },
                ],
            },
            {
                key: 'class',
                name: '类别',
                init: '',
                wrap: 1,
                value: [
                    { n: '全部', v: '' },
                    { n: '霸总', v: 'bazong' },
                    { n: '修真', v: 'xiuzhen' },
                    { n: '恋爱', v: 'lianai' },
                    { n: '校园', v: 'xiaoyuan' },
                    { n: '冒险', v: 'maoxian' },
                    { n: '搞笑', v: 'gaoxiao' },
                    { n: '生活', v: 'shenghuo' },
                    { n: '热血', v: 'rexue' },
                    { n: '架空', v: 'jiakong' },
                    { n: '后宫', v: 'hougong' },
                    { n: '玄幻', v: 'xuanhuan' },
                    { n: '悬疑', v: 'xuanyi' },
                    { n: '恐怖', v: 'kongbu' },
                    { n: '灵异', v: 'lingyi' },
                    { n: '动作', v: 'dongzuo' },
                    { n: '科幻', v: 'kehuan' },
                    { n: '战争', v: 'zhanzheng' },
                    { n: '古风', v: 'gufeng' },
                    { n: '穿越', v: 'chuanyue' },
                    { n: '竞技', v: 'jingji' },
                    { n: '励志', v: 'lizhi' },
                    { n: '同人', v: 'tongren' },
                    { n: '真人', v: 'zhenren' },
                    { n: '其他', v: 'qita' },
                    { n: '总裁', v: 'zongcai' },
                    { n: '异能', v: 'yineng' },
                    { n: '韩漫', v: 'hanman' },
                    { n: '剧情', v: 'juqing' },
                    { n: '大女主', v: 'danvzhu' },
                    { n: '都市', v: 'dushi' },
                    { n: '格斗', v: 'gedou' },
                    { n: '武侠', v: 'wuxia' },
                    { n: '日常', v: 'richang' },
                    { n: '纯爱', v: 'chunai' },
                    { n: '国漫', v: 'guoman' },
                    { n: '推理', v: 'tuili' },
                    { n: '少年', v: 'shaonain' },
                    { n: '奇幻', v: 'qihuan' },
                    { n: '短篇', v: 'duanpian' },
                    { n: 'ABO', v: 'abo' },
                    { n: '运动', v: 'yundong' },
                    { n: '萌系', v: 'mengxi' },
                    { n: '爆笑', v: 'baoxiao' },
                    { n: '蔷薇', v: 'qiangwei' },
                    { n: '百合', v: 'baihe' },
                    { n: 'BG', v: 'bg' },
                ],
            },
            {
                key: 'status',
                name: '状态',
                init: '',
                value: [
                    { n: '全部', v: '' },
                    { n: '连载中', v: '1' },
                    { n: '已完结', v: '2' },
                ],
            },
        ],
    };
    return {
        class: classes,
        filters: filterObj,
    };
}

async function category(inReq, _outResp) {
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    const html = await request(`${Host}/sort/?class=${extend.class || ''}&area=${extend.area | ''}&status=${extend.status | ''}page=${pg}`);
    const $ = load(html);

    const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy';
    const books = [];
    for (const list of $('.cartoon-block-box .cart-item')) {
        const cover = $(list).find('.cart-cover');
        const img = $(cover).find('img:first');
        const p = $(list).find('.cart-info p:first');
        const remark = $(list).find('.new-chapter');
        books.push({
            book_id: cover.attr('href').replace(/.*\/info\/(.*)\//, '$1'),
            book_name: p.text(),
            book_pic: proxyUrl + '/img/' + base64Encode(img.attr('src')),
            book_remarks: remark.text(),
        });
    }
    const hasMore = $('.pagelink a.next').length > 0;
    return {
        page: pg,
        pagecount: hasMore ? pg + 1 : pg,
        list: books,
    };
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const html = await request(`${Host}/info/${id}/`);
    const $ = load(html);
    const book = {
        book_name: $('h1.title').text().trim(),
        book_director: $('.mt10:contains(作者)').text().substring(3).trim(),
        book_content: $('.line-clamp-4:contains(简介)').text().substring(3).trim(),
    };
    let urls = [];
    for (const item of $('.chapter-list li')) {
        const a = $(item).find('a');
        let title = $(a).text();
        const href = `/info/${id}/${$(a).attr('href')}`;
        if (title === null) {
            title = '观看';
        }
        urls.push(title + '$' + href);
    }
    book.volumes = '默认';
    book.urls = urls.join('#');
    return {
        list: [book],
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const html = await request(`${Host}${id}`);
    const $ = load(html);

    const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy';
    var content = [];
    for (const images of $('.chapter-content img')) {
        const src = $(images).attr('data-original');
        content.push(proxyUrl + '/img/' + base64Encode(src));
    }
    return {
        content: content,
    };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg == 0) pg = 1;

    const link = `${Host}/search/${encodeURIComponent(wd)}/`;
    const html = await request(link);
    const $ = load(html);

    const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy';
    var books = [];
    for (const list of $('.cartoon-block-box .cart-item')) {
        const cover = $(list).find('.cart-cover');
        const img = $(cover).find('img:first');
        const p = $(list).find('.cart-info p:first');
        const remark = $(list).find('.new-chapter');
        books.push({
            book_id: cover.attr('href').replace(/.*\/info\/(.*)\//, '$1'),
            book_name: p.text(),
            book_pic: proxyUrl + '/img/' + base64Encode(img.attr('src')),
            book_remarks: remark.text(),
        });
    }
    return {
        page: pg,
        pagecount: pg,
        list: books,
    };
}

async function proxy(request, reply) {
    const what = request.params.what;
    const url = base64Decode(request.params.url);
    if (what === 'img') {
        const resp = await req(url, {
            headers: {
                'User-Agent': PC_UA,
                Referer: Host,
            },
            responseType: 'arraybuffer',
        });
        reply.code(resp.status).header('Content-Type', resp.headers['content-Type']).send(resp.data);
        return;
    }
    reply.code(500).data('');
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
            resp = await inReq.server
                .inject()
                .post(`${prefix}/category`)
                .payload({
                    id: dataResult.home.class[0].type_id,
                    page: 1,
                    filter: true,
                    filters: { class: 'xiuzhen', area: '1', status: '1' },
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
        key: 'fengche',
        name: '📓 风车漫画',
        type: 20,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:what/:url', proxy);
        fastify.get('/test', test);
    },
};
