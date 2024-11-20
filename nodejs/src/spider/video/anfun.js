import req from '../../util/req.js';
import {MOBILE_UA, PC_UA} from '../../util/misc.js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;
import CryptoJS from 'crypto-js';

let url = 'https://www.anfuns.cc';


async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'Accept-Language': 'zh-CN,zh;q=0.8',
            'User-Agent': MOBILE_UA,
        },
    });
    return resp.data;
}


// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {
    return {};
}

async function home(inReq, _outResp) {
    let classes = [{"type_id":1,"type_name":"新旧番剧"},{"type_id":2,"type_name":"蓝光无修"},{"type_id":3,"type_name":"动漫剧场"},{"type_id":4,"type_name":"欧美动漫"}];
    let filterObj = {
		 "1":[{"key":"year","name":"年份","value":[{"n":"全部","v":""},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"},{"n":"2009","v":"2009"},{"n":"2008","v":"2008"},{"n":"2007","v":"2007"},{"n":"2006","v":"2006"},{"n":"2005","v":"2005"},{"n":"2004","v":"2004"},{"n":"2003","v":"2003"},{"n":"2002","v":"2002"},{"n":"2001","v":"2001"},{"n":"2000","v":"2000"}]},{"key":"by","name":"排序","value":[{"n":"最新","v":"/by/time"},{"n":"最热","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}],
        "2":[{"key":"year","name":"年份","value":[{"n":"全部","v":""},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"},{"n":"2009","v":"2009"},{"n":"2008","v":"2008"},{"n":"2007","v":"2007"},{"n":"2006","v":"2006"},{"n":"2005","v":"2005"},{"n":"2004","v":"2004"},{"n":"2003","v":"2003"},{"n":"2002","v":"2002"},{"n":"2001","v":"2001"},{"n":"2000","v":"2000"}]},{"key":"by","name":"排序","value":[{"n":"最新","v":"/by/time"},{"n":"最热","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}],
        "3":[{"key":"year","name":"年份","value":[{"n":"全部","v":""},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"},{"n":"2009","v":"2009"},{"n":"2008","v":"2008"},{"n":"2007","v":"2007"},{"n":"2006","v":"2006"},{"n":"2005","v":"2005"},{"n":"2004","v":"2004"},{"n":"2003","v":"2003"},{"n":"2002","v":"2002"},{"n":"2001","v":"2001"},{"n":"2000","v":"2000"}]},{"key":"by","name":"排序","value":[{"n":"最新","v":"/by/time"},{"n":"最热","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}],
        "4":[{"key":"year","name":"年份","value":[{"n":"全部","v":""},{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2013","v":"2013"},{"n":"2012","v":"2012"},{"n":"2011","v":"2011"},{"n":"2010","v":"2010"},{"n":"2009","v":"2009"},{"n":"2008","v":"2008"},{"n":"2007","v":"2007"},{"n":"2006","v":"2006"},{"n":"2005","v":"2005"},{"n":"2004","v":"2004"},{"n":"2003","v":"2003"},{"n":"2002","v":"2002"},{"n":"2001","v":"2001"},{"n":"2000","v":"2000"}]},{"key":"by","name":"排序","value":[{"n":"最新","v":"/by/time"},{"n":"最热","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}]
	};

    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg =inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    //https://www.anfuns.cc/show/1---2023/by/hits/page/2.html
    const html = await request(`${url}/show/ ${tid}-${(extend.class || '')}--${(extend.year || '')}/${(extend.by || '/by/time')}/page/${pg}.html`);
    const $ = load(html);
    // const items = $('ul.hl-vod-list > li');
    // let videos = _.map(items, (item) => {
    //     const it = $(item).find('a:first')[0];
    //     const remarks = $($(item).find('span.hl-lc-1')[0]).text().trim();
    //     return {
    //         vod_id: it.attribs.href.replace(/.*?\/anime\/(.*).html/g, '$1'),
    //         vod_name: it.attribs.title,
    //         vod_pic: it.attribs['data-original'],
    //         vod_remarks: remarks || '',
    //     };
    // });
    let videos=[];
    for(const item of $('ul.hl-vod-list > li')){
        const it = $(item).find('a')[0];
        const remarks = $($(item).find('span.hl-lc-1')[0]).text().trim();
        videos.push({
            vod_id: it.attribs.href.replace(/.*?\/anime\/(.*).html/igs, '$1'),
            vod_name: it.attribs.title,
            vod_pic: it.attribs['data-original'],
            vod_remarks: remarks || '',
        });
    }
    const hasMore = $('ul.hl-page-wrap > li > a > span.hl-hidden-xs:contains(下一页)').length > 0;
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
    var html = await request( `${url}/anime/${id}.html`);
    var $ = load(html);
    var vod = {
        vod_id: id,
        vod_name: $('h2:first').text().trim(),
        vod_type: $('.stui-content__detail p:first a').text(),
        vod_actor: $('.stui-content__detail p:nth-child(3)').text().replace('主演：',''),
        vod_pic: $('.stui-content__thumb img:first').attr('data-original'),
        vod_remarks : $('.stui-content__detail p:nth-child(5)').text() || '',
        vod_content: $('span.detail-content').text().trim(),
    };
    var playMap = {};
    var playlists = $('ul.hl-plays-list');
    const tabs = $('ul.hl-from-list > li > span')
    var playlists = $('ul.hl-plays-list');
    _.each(tabs, (tab, i) => {
        var from = tab.children[0].data;
        var list = playlists[i];
        list = $(list).find('a');
        _.each(list, (it) => {
            var title = it.children[0].data;
            var playUrl = it.attribs.href.replace(/\/play\/(.*).html/g, '$1');

            if (!playMap.hasOwnProperty(from)) {
                playMap[from] = [];
            }
            playMap[from].push( title + '$' + playUrl);
        });
    });
    vod.vod_play_from = _.keys(playMap).join('$$$');
    var urls = _.values(playMap);
    var vod_play_url = _.map(urls, (urlist) => {
        return urlist.join('#');
    });
    vod.vod_play_url = vod_play_url.join('$$$');
    return JSON.stringify({
        list: [vod],
    });
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const html = await request(`${url}/play/${id}.html`);
    const $ = load(html);
    const js = JSON.parse($('script:contains(player_)').html().replace('var player_aaaa=',''));
    const playurl = js.url;
    const playUrl = unescape(base64Decode(playurl));
    return JSON.stringify({
        parse: 0,
        url: playUrl,
    });
}

function base64Encode(text) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}

function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    //https://www.anfuns.cc/search.html?wd=%E5%9B%9E%E5%A4%8D&submit=
    let html = await request( `${url}/search.html?wd=${wd}&submit=`);
    const $ = load(html);
    let videos=[];
    for(const item of $('ul.hl-one-list > li')){
        const it = $(item).find('a')[0];
        const remarks = $($(item).find('span.hl-lc-1')[0]).text().trim();
        videos.push({
            vod_id: it.attribs.href.replace(/.*?\/anime\/(.*).html/igs, '$1'),
            vod_name: it.attribs.title,
            vod_pic: it.attribs['data-original'],
            vod_remarks: remarks || '',
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
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'af',
        name: '🟢 爱番',
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