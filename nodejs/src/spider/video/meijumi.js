import req from '../../util/req.js';
import { load } from 'cheerio';
import _ from 'lodash';
import dayjs from 'dayjs';
import { ua, init ,detail as _detail ,proxy ,play  } from '../../util/pan.js';

let url = 'https://www.meijumi.xyz';

async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': ua,
            'Referer': url,
        },
    });
    let content = res.data;
 //    console.log(content);
    return content;
}

async function home(_inReq, _outResp) {
    const classes = [{'type_id':'usa','type_name':'美剧'},{'type_id':'usa/xuanyi','type_name':'灵异/惊悚'},{'type_id':'usa/mohuan','type_name':'魔幻/科幻'},{'type_id':'usa/zuian','type_name':'罪案/动作谍战'},{'type_id':'usa/qinggan','type_name':'剧情/历史'},{'type_id':'usa/xiju','type_name':'喜剧'},{'type_id':'usa/yiwu','type_name':'律政/医务'},{'type_id':'usa/katong','type_name':'动漫/动画'},{'type_id':'usa/jilu','type_name':'纪录片'},{'type_id':'usa/zongyi','type_name':'综艺/真人秀'},{'type_id':'en','type_name':'英剧'},{'type_id':'news','type_name':'最近更新'}];
    const filterObj = {};

    return {
        class: classes,
        filters: filterObj,
    };
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    // console.log(tid);
    let pg = inReq.body.page;
    if (pg <= 0 || tid == 'news') pg = 1;
    let page = '';
    if (pg > 1) {
        page = '/page/' + pg;
    }
  //  const html = await request(url + '/category/' + (extend || tid) + page + '/' );
 //   const html =await request(url + "/" + tid  + page + '/');
    const html = await request(`${url}/${tid}${page}/`);
   // console.log(pg);
    return parseHtmlList1(html, pg, tid);
}

function parseHtmlList1(html, pg, tid) {
    const $ = load(html);
    if (tid == 'news') {
        const list = $('div.xuhao ol li');
            // console.log(list);
        let videos = [];
        for(var item of list) {
            const $item = $(item);
            // console.log($item);
            const title = $item.find('.zuo a');
            // console.log(title);
            const remarks = $item.find('.zhong').text();
             videos.push({
                vod_id: title.attr('href'),
                vod_name:  title.text().replace(/《|》/g,'').trim(),
                // vod_name: '西瓜',
                vod_pic: '',
                vod_remarks: remarks,
            });
        }
        return {
            list: videos,
        };
    } else {
        const list = $('div#post_list_box article');
        let videos = [];
        for(var item of list) {
        const $item = $(item);
        const title = $item.find('a');
       // console.log(title);
        const img = $item.find('img');
        const remarks = $item.find('.gxts').text();
        videos.push({
            vod_id: title.attr('href'),
            vod_name: title.attr('title').match(/《(.*?)》/)[0].replace(/《|》/g,'').trim(),
            vod_pic: img.attr('src'),
            vod_remarks: remarks,
        });
    }
//    const pgCount = _.isEmpty(videos) ? pg : pg + 1;
    const pgCount = $('.page-numbers').length > 0 ? pg + 1 : pg;
    const limit = 30;
    return {
        page: pg,
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    };
}


function parseHtmlList(html, pg) {
    const $ = load(html);
    const list = $('main article figure');
    // console.log(list);
    let videos = [];
    for(var item of list) {
        const $item = $(item);
        const title = $item.find('a');
    //    console.log(title);
        const img = $item.find('img');
        const remarks = $item.find('.gxts').text();
        videos.push({
            vod_id: title.attr('href'),
            vod_name: title.attr('title').match(/《(.*?)》/)[0].replace(/《|》/g,'').trim(),
            vod_pic: img.attr('src'),
            vod_remarks: remarks,
        });
    }
    
    const pgCount = $('.page-numbers').length > 0 ? pg + 1 : pg;
    const limit = 30;
    return {
        page: pg,
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    };
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (const id of ids) {
 //       const html = await request( url + '/' + id);
        const html = await request(`${url}/${id}`);
        const $ = load(html);
        let vod = {
            vod_id: id,
            vod_name: $('.entry-title').toString().match(/《(.*?)》/)[0].replace(/《|》/g,'').trim(),
            vod_pic: $('div.single-content img').attr('src'),
            vod_remarks: $('h2 span').text(),
            vod_content: $("blockquote p").text().trim(),
        };
        const shareUrls = $('.single-content p a[href*=/s/]')
        .map((_, a) =>$(a).attr('href'))
        .get();
        const vodFromUrl = await _detail(shareUrls);
        if (vodFromUrl){
            vod.vod_play_from = vodFromUrl.froms;
            vod.vod_play_url = vodFromUrl.urls;
        }
        videos.push(vod);
    }
    return {
        list: videos,
    };
}


async function search(inReq, _outResp) {
    let pg = inReq.body.page;
    const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    let page = '';
    if (pg > 1) {
        page = '/page/' + pg;
    }
  //  const html = await request(url + page + "/?s=" + encodeURIComponent(wd));
    const html = await request(`${url}/${page}/?s=${wd}`);
    return parseHtmlList(html, pg);
}


export default {
    meta: {
        key: 'meijumi',
        name: '🟢 美剧',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};