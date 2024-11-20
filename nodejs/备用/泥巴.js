import req from '../../util/req.js';
import {MOBILE_UA} from '../../util/misc.js';
import {load} from 'cheerio';

let url = 'https://www.nivod.cc';


async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'Accept-Language': 'zh,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6',
            'User-Agent': MOBILE_UA,
        }
    });
    return resp.data;
}

async function init(inReq, _outResp) {
    return {};
}

async function home(inReq, _outResp) {
    const html = await request(url);
    const $ = load(html);
    let classes = [];
    for (const a of $('div.nav-channel a[href!="/"]')) {
        let h_id = a.attribs.href.split('=')[1];
        classes.push({
            type_id: h_id,
            type_name: a.children[0].data,
        });
    }
    return JSON.stringify({
        class: classes,
    });
}


async function category(inReq, _outResp) {
    const tid = 'tv';
    // const extend = inReq.body.filters;
    //https://www.nivod.cc/filter.html?channel=movie&region=&showtype=&year=
    const link =`${url}/class.html?channel=${tid}`;
    const html = await request(link);
    const $ = load(html);
    let videos = [];
    for (const item of $('li.qy-mod-li')) {
        const a = $(item).find('a')[0];
        const img =$(a).find('.video-item-preview-img')[0];
        const pic = img.children[0].next.attribs['data-original'];
        videos.push({
            vod_id: a.attribs.href,
            vod_name: img.children[0].next.attribs['alt'],
            vod_pic: url+pic
        });
    }
    return JSON.stringify({
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    var html = await request(`${url}${id}`);
    var $ = load(html);
    var vod = {
        vod_id: id,
        vod_name: $('div.right-title').text(),
        vod_type: $('div.right-label').text(),
        vod_content: $('#show-desc').text().trim(),
    }
    let playFroms = [];
    let playUrls = [];
    let temp = [];
    const playUrl = $('div.list-ruku a[href!="/"]').map((_,a)=>{
        return a.attribs.href;
    }).get();
    for(const url_id of playUrl){
        if(url_id.split('/')[3].startsWith('v')){
            const list_html = await request('https://www.nivod.cc/xhr_playinfo/'+url_id.split('/')[2]);
            for(const data_list of list_html['pdatas']){
                temp.push(data_list['name']+'$'+data_list['playurl']);
                playUrls.push(temp.join('#'));
                playFroms.push(data_list['from']+'由不知道倾情打造');
                vod.vod_play_from = playFroms.join('$$$');
                vod.vod_play_url = playUrls.join('$$$');
            }
        }else {
            const list_html = await request('https://www.nivod.cc/xhr_playinfo/'+url_id.split('/')[2]+'-'+url_id.split('/')[3]);
            for(const data_list of list_html['pdatas']){
                temp.push(data_list['name']+'$'+data_list['playurl']);
                playUrls.push(temp.join('#'));
                playFroms.push(data_list['from']+'由不知道倾情打造');
                vod.vod_play_from = playFroms.join('$$$');
                vod.vod_play_url = playUrls.join('$$$');
            }
        }
    }
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
            vod_pic: a.attribs['data-echo-background']
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
            wd: '爱',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return {err: err.message, tip: 'check debug console output'};
    }
}

export default {
    meta: {
        key: 'ni',
        name: '泥巴',
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
}