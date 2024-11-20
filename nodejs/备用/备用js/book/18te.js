import req from '../../util/req.js';
import { MOBILE_UA } from '../../util/misc.js';
import { load } from 'cheerio';

let url = 'https://m.po18te.com';

async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8',
            'User-Agent': MOBILE_UA,
        },
    });
    return resp.data;
}

async function init(_inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    var html = await request(url+'/class/');
    const $ = load(html);
    let classes = [];
    for (const a of $('li.left_li > a[href!="/"]')) {
        classes.push({
            type_id: a.attribs.href,
            type_name: a.children[0].data.trim()
        });
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
    var html = await request(url+'/'+tid.split('/')[3]+'/'+tid.split('/')[4].replace(/\d/igs,`${pg}`));
    const $ = load(html);
    let books = [];
    for (const item of $('div.pictext')) {
        const a = $(item).find('a:first')[0];
        const img = $(a).find('img:first')[0];
        const p = $(item).find('p:first')[0];
        const name = $(item).find('p.info_title:first')[0];
        books.push({
            book_id: a.attribs.href,
            book_name: name.children[0].data.trim(),
            book_pic: img.attribs.src,
            book_remarks: p.children[0].data.trim(),
        });
    }
    return {
        page: pg,
        pagecount: $('a:contains(下一页)').length > 0 ? pg + 1 : pg,
        list: books,
    };
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    let pg = 1;
    const books = [];
    var urls = [];
    for (const id of ids) {
        var html = await request(id);
        var $ = load(html);
        let book = {
            book_name: $('[property$=book_name]')[0].attribs.content,
            book_year: $('[property$=update_time]')[0].attribs.content,
            book_director: $('[property$=author]')[0].attribs.content,
            book_content: $('[property$=description]')[0].attribs.content,
        };
        while (pg!=0){
            html = await request(  id.split('.html')[0]+'/'+`page_${pg}.html`);
            $ = load(html);
            pg = $('a:contains(下一页)').length > 0 ? pg + 1 : pg=0

            const links = $('ul.list > li.cur > a[href!="/"]');
            for (const l of links) {
                var name = $(l).text().trim();
                var link = l.attribs.href;
                urls.push(name + '$' + link);
            }
        }
        book.volumes = '默认';
        book.urls = urls.join('#');
        books.push(book);
    }
    return {
        list: books,
    };
}

async function play(inReq, _outResp) {
    let id = inReq.body.id;
    var content = '';
    while (true) {
        var html = await request(id);
        var $ = load(html);
        content += $('.content')
            .html()
            .replace(/&nbsp;/igs, '')
            .trim();
        id = $('a.next_chapter')[0].attribs.href;
        if (id.indexOf('_') < 0) break;
    }
    return {
        content: content + '\n\n',
    };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    const html = await req.get(`${url}/search.php?searchkey=${encodeURIComponent(wd)}`);
    const $ = load(html);
    let books = [];
    for (const item of $('div.partlist-info')) {
        const a = $(item).find('a:first')[0];
        const img = $(a).find('img:first')[0];
        const p = $(item).find('p:first')[0];
        books.push({
            book_id: a.attribs.href,
            book_name: img.attribs.alt,
            book_pic: img.attribs.src,
            book_remarks: p.children[0].data.trim(),
        });
    }
    return {
        list: books,
    };
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
            wd: '科技',
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
        key: 'te',
        name: '📓 拾扒文学',
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
