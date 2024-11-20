import req from '../../util/req.js';
import { MOBILE_UA } from '../../util/misc.js';
import { load } from 'cheerio';

let url = 'https://www.bilinovel.com';

async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
            'Sec-Ch-Ua-Platform': 'Android',
            'Sec-Ch-Ua-Mobile' : '?1',
            'Cookie':'night=0; _ga=GA1.1.1633540174.1709871312; Hm_lvt_6f9595b2c4b57f95a93aa5f575a77fb0=1709871312; jieqiVisitId=article_articleviews%3D3933%7C3080; jieqiVisitTime=jieqiArticlesearchTime%3D1709876079; __gads=ID=275264653a7b192a:T=1709871325:RT=1709877175:S=ALNI_MYcHM9-4TsJcqPkdCEMstmVkBQsOA; __eoi=ID=e46915642745ad0d:T=1709871325:RT=1709877175:S=AA-AfjZEDZQ7hfoYppn0lnQREQNc; jieqiRecentRead=3933.216408.0.1.1709874575.0-3080.153181.0.1.1709877412.0; Hm_lpvt_6f9595b2c4b57f95a93aa5f575a77fb0=1709877412; _ga_NG72YQN6TX=GS1.1.1709871312.1.1.1709877412.0.0.0; cf_clearance=Y2uE9tAK_ZdbvmmxId5316cTF7FUDLIttqSQ.kdfSZI-1709877415-1.0.1.1-cB_.ua4g02F3OACARKanrRLpVnIUEXDMtSCT_IjlNZIJ8mJj7Kp5U4NZDDZ_ftlON6n74nALu58FD6P4T.3zvg',
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
        },
    });
    return resp.data;
}

async function init(_inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    var html = await request(url+"/wenku/");
    const $ = load(html);
    let classes = [];
    for (const a of $('div.sort-li-detail:first > a[href*="/wenku/"]')) {
        classes.push({
            type_id: a.attribs.href,
            type_name: a.children[0].data.trim()
        });
    }
    console.log(classes)
    return {
        class: classes,
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    let page = pg || 1;
    if (page == 0) page = 1;
    var html = await request(url+tid.replace(`${tid.split('_')[8]}`,`${pg}`));

    const $ = load(html);
    let books = [];
    for (const li of $('li.book-li')) {
        const a = $(li).find('a:first')[0];
        const img = $(a).find('img:first')[0];
        const span = $(li).find('span.tag-small-group:first')[0];
        books.push({
            book_id: a.attribs.href,
            book_name: img.attribs.alt,
            book_pic: $(img).attr('data-src'),
            book_remarks: span.children[0].data
        });
    }
    return {
        page: pg,
        pagecount: $('#pagelink > a').length > 0 ? pg + 1 : pg,
        list: books,
    };
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const books = [];
    for (const id of ids) {
        var html = await request(url+id);
        var $ = load(html);
        let book = {
            book_name: $('[property$=book_name]')[0].attribs.content,
            book_year: $('[property$=update_time]')[0].attribs.content,
            book_director: $('[property$=author]')[0].attribs.content,
            book_content: $('[property$=description]')[0].attribs.content,
        };
        var catalog = (url+id).toString().replace('.html','')
        html = await request(catalog + `/catalog`);
        $ = load(html);
        let urls = [];
        const links = $('li.chapter-li > a[href*="/novel/"]');
        for (const l of links) {
            var name = $(l).text().trim();
            var link = l.attribs.href;

            urls.push(name + '$' + link);
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
        var html = await request(url + id);
        var $ = load(html);
        content += $('#apage')
            .html()
            .replace(/.*<\/script>/igs, '\n').replace(/<\/div>/igs,'\n').replace(/<\/p>/igs,'\n').replace(/<p>/igs,'\n').replace(/<img.*?>/igs,'\n')
            .trim();
        if (!$('a:contains(下一页)').length>0) break;
    }
    return {
        content: content + '\n\n',
    };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    const resp = await req.get(url+`/search.html?searchkey=${encodeURIComponent(wd)}`, {
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
            'Sec-Ch-Ua-Platform': 'Android',
            'Sec-Ch-Ua-Mobile' : '?1',
            'Cookie':'night=0; _ga=GA1.1.1633540174.1709871312; Hm_lvt_6f9595b2c4b57f95a93aa5f575a77fb0=1709871312; jieqiVisitId=article_articleviews%3D3933%7C3080; jieqiVisitTime=jieqiArticlesearchTime%3D1709876079; __gads=ID=275264653a7b192a:T=1709871325:RT=1709877175:S=ALNI_MYcHM9-4TsJcqPkdCEMstmVkBQsOA; __eoi=ID=e46915642745ad0d:T=1709871325:RT=1709877175:S=AA-AfjZEDZQ7hfoYppn0lnQREQNc; jieqiRecentRead=3933.216408.0.1.1709874575.0-3080.153181.0.1.1709877412.0; Hm_lpvt_6f9595b2c4b57f95a93aa5f575a77fb0=1709877412; _ga_NG72YQN6TX=GS1.1.1709871312.1.1.1709877412.0.0.0; cf_clearance=Y2uE9tAK_ZdbvmmxId5316cTF7FUDLIttqSQ.kdfSZI-1709877415-1.0.1.1-cB_.ua4g02F3OACARKanrRLpVnIUEXDMtSCT_IjlNZIJ8mJj7Kp5U4NZDDZ_ftlON6n74nALu58FD6P4T.3zvg',
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
        },
    });
    let books = [];
    for (const book of resp.data) {
        books.push({
            book_id: book.url_list,
            book_name: book.articlename,
            book_pic: book.url_img,
            book_remarks: book.author,
        });
    }
    return {
        tline: 2,
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
            wd: '我当',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;dataResult
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'wenku',
        name: '📓 轻小说',
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
