import * as HLS from 'hls-parser';
import req from '../../util/req.js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;

let url = 'https://www.duanjuxia.cn/index.php/vod/';


async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
    });
    return res.data;
}


async function init(inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    const html = await request(url + "show/id/20.html");
    const $ = load(html);
    const lxlist = $("body > div > div.main > div > div > div.module-main.module-class > div:nth-child(1) > div > div.module-item-box")
    let classes = [];
    lxlist.find('a').each((i, elem) => {
        const title = $(elem).attr('title');
        const href = $(elem).attr('href').split('/').at(-1);
        classes.push({ type_name:title, type_id:href });
      });
    return {
        class: classes,
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id.split('.')[0];
    const pg = inReq.body.page;
    let page = pg || 1;
    if (page == 0) page = 1;
    const html = await request(url + 'show/id/' + tid + "/page/" + pg + ".html");
    const $ = load(html);
    const videosRaw = $("body > div > div.main > div > div > div.module-main.module-page > div.module-items.module-poster-items-base")
    const pagecount = $('#page a.page-link.page-next[title="尾页"]').attr('href').split('/').at(-1).split('.')[0];
    let videos = [];
    videosRaw.find('a').each((i, elem) => {
        const vod_name = $(elem).attr('title');
        const vod_id = $(elem).attr('href').split('/').at(-1);
        const vod_pic = $(elem).find('.module-item-pic img').attr('data-original') || $(elem).find('.module-item-pic img').attr('src')
        const vod_remarks = $(elem).find('.module-item-note').text();
        videos.push({
            vod_id: vod_id.toString(),
            vod_name: vod_name.toString(),
            vod_pic: vod_pic,
            vod_remarks: vod_remarks,
        });
    })
    return {
        page: parseInt(page),
        pagecount: pagecount,
        total: 40 * parseInt(pagecount),
        list: videos,
    };
}
async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const vod = {
        vod_id: id,
        vod_remarks: '',
    };
    const html = await request(url + 'detail/id/' + id)
    const $ = load(html)
    vod.vod_name = $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-main > div.module-info-heading > h1').text()
    vod.vod_year = $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-main > div.module-info-heading > div.module-info-tag > div:nth-child(1) > a').attr('title')
    vod.vod_area = $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-main > div.module-info-heading > div.module-info-tag > div:nth-child(2) > a').attr('title')
    const vod_type_raw = $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-main > div.module-info-heading > div.module-info-tag > div:nth-child(3)')
    const vod_type_list = []
    vod_type_raw.find('a').each((i ,elem) => {
        vod_type_list.push($(elem).text())
    })
    vod.vod_type = vod_type_list.join('/')
    vod.vod_director = $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-main > div.module-info-content > div.module-info-items > div:nth-child(2) > div > a').text()
    vod.vod_actor = $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-main > div.module-info-content > div.module-info-items > div:nth-child(3) > div > a').text()
    vod.vod_pic = $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-poster > div > div > img').attr('data-original') || $('body > div > div.main > div > div.module.module-info > div.module-main > div.module-info-poster > div > div > img').attr('src') 
    vod.vod_play_from = '线路1'
    const video_url_raw = $('#panel1 > div > div')
    const vod_play_url_list = []
    video_url_raw.find('a').each((i, elem) =>{
        vod_play_url_list.push($(elem).find('span').text() + '$https://www.duanjuxia.cn' + $(elem).attr('href'))
    })
    vod.vod_play_url = vod_play_url_list.join('#')
    return {
        list: [vod],
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const html = await request(id);
    const $ = load(html);
    const playerData = $('script:contains("var player_aaaa")').html().replace('var player_aaaa=', '');
    const purl = JSON.parse(playerData);
    return {
        parse: 0,
        url: purl.url,
    };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    const pg = inReq.body.pg;
    const html = await request(url + `search.html?wd=${wd}`);
    const $ = load(html)
    const videos_raw = $('body > div.page.list > div.main > div > div > div.module-main.module-page > div.module-items.module-card-items')
    const total = $('body > div.page.list > div.main > div > div > div.module-heading.module-heading-search > div > strong.mac_total').text()
    const pagecount = $('#page a.page-link.page-next[title="尾页"]').attr('href').split('page/')[1].split('/')[0]
    let videos = [];
    videos_raw.find('.module-card-item.module-item').each((i, elem)=>{
        const vod_id =  $(elem).find('a').attr('href').split('/').at(-1)
        const vod_pic = $(elem).find('.module-item-pic').find('img').attr('data-original') || $(elem).find('.module-item-pic').find('img').attr('src')
        const vod_name = $(elem).find('.module-item-pic').find('img').attr('alt')
        const vod_remarks = $(elem).find('.module-item-note').text()
        videos.push({
            vod_id: vod_id.toString(),
            vod_name: vod_name.toString(),
            vod_pic: vod_pic,
            vod_remarks: vod_remarks,
        });
    })
    return {
        page: parseInt(pg),
        pagecount: parseInt(pagecount),
        total: parseInt(total),
        list: videos,
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
            wd: '闪婚',
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
        key: 'djx',
        name: '🟢 短剧',
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
