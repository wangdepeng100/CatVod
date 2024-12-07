import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { ua, init ,detail as _detail ,proxy ,play  } from '../../util/pan.js';
import { load } from 'cheerio';
import dayjs from 'dayjs';


let url = 'https://res.yunpan.win';

async function request(reqUrl, method, data, redirect) {
    const res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': ua,
            'Referer': url,
        },
    });
    return res.data;
}


async function home(inReq,_outResp){
    const classes = [{'type_id':'all','type_name':'首页'}];
    const filterObj = {
        'all':[{'key':'class','name':'分类','init':'','value':[{'n':'全部','v':''},{'n':'电影','v':'电影'},{'n':'电视剧','v':'电视剧'},{'n':'动画','v':'动画'},{'n':'纪录片','v':'纪录片'},{'n':'综艺','v':'综艺'}]},{'key':'class','name':'','init':'','wrap':1,'value':[{'n':'剧情','v':'剧情'},{'n':'动作','v':'动作'},{'n':'冒险','v':'冒险'},{'n':'奇幻','v':'奇幻'},{'n':'科幻','v':'科幻'},{'n':'喜剧','v':'喜剧'},{'n':'爱情','v':'爱情'},{'n':'悬疑','v':'悬疑'},{'n':'历史','v':'历史'},{'n':'战争','v':'战争'},{'n':'恐怖','v':'恐怖'},{'n':'惊悚','v':'惊悚'},{'n':'家庭','v':'家庭'},{'n':'搞笑','v':'搞笑'},{'n':'歌舞','v':'歌舞'},{'n':'音乐','v':'音乐'},{'n':'歌曲','v':'歌曲'},{'n':'真人秀','v':'真人秀'}]},{'key':'tag','name':'标签','init':'','value':[{'n':'全部','v':''},{'n':'1080p','v':'1080p'},{'n':'4k','v':'4k'},{'n':'高码率','v':'高码率'},{'n':'杜比视界','v':'杜比视界'},{'n':'画质控','v':'画质控'}]}],
   };
    return ({
        class: classes,
        filters: filterObj,
    });
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    const limit = 12;
    const html = await request(url + '/?PageIndex=' + pg + '&PageSize=' + limit + '&Keyword=&Type=' + (extend.class || '') + '&Tag=' + (extend.tag || ''));
    return parseHtmlList(html, pg, limit);
}


async function detail(inReq, _outResp) {
    const shareUrl = inReq.body.id;
    const videos = [];
        let vod = ({
            vod_id: shareUrl,
        });
        const vodFromUrl = await _detail(shareUrl);
        if (vodFromUrl){
            vod.vod_play_from = vodFromUrl.froms;
            vod.vod_play_url = vodFromUrl.urls;
        }
        videos.push(vod);
    return {
        list: videos,
    };
}



function parseHtmlList(html, pg, limit) {
    const $ = load(html);
    const elements = $('.card');
    const videos = _.map(elements, (item) => {
        const $item = $(item);
        const matches = $item.find('.card-footer').html().match(/open\(\'(.*)\'\)/);
        const urls = matches[1];
        const $img = $item.find('img:first');
        const $title = $item.find('.card-title');
        const $size = $item.find('.card-text:contains(大小)');
        return {
            vod_id: urls,
            vod_name: $title.text().trim(),
            vod_pic: url + $img.attr('src'),
            vod_remarks: $size.text().trim(),
        };
    });
    const pageArea = $('.pagination');
    const hasMore = !_.isEmpty(pageArea) && pageArea.find('li.active').text() != pageArea.find('li:last').text();
    const page = parseInt(pg);
    const pgCount = hasMore ? page + 1 : page;
    return ({
        page: page,
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    });
}


async function search(inReq, _outResp) {
   let pg = inReq.body.page;
   const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    const limit = 12;
    const html = await request(url + '/?PageIndex=' + pg + '&PageSize=' + limit + '&Keyword=' + encodeURIComponent(wd) + '&Type=&Tag=');
    return parseHtmlList(html, pg, limit);
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
        key: 'yunpanres',
        name: '🟢 云盘',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};
