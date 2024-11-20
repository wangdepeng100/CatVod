import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';
import CryptoJS from 'crypto-js';
import dayjs from 'dayjs';
import Crypto from 'crypto-js';

let HOST = 'https://www.rttks.com';

const UA = 'Mozilla/5.0 (Linux; Android 10; HLK-AL00 Build/HONORHLK-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/88.0.4324.93 Mobile Safari/537.36';

async function request(reqUrl, agentSp) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': agentSp || UA,
            'Referer': HOST
        },
    });
    return res.data;
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outResp) {return {}}

async function home(filter) {
    let classes = [{"type_id":"dianying","type_name":"电影"},{"type_id":"dianshiju","type_name":"追剧"},{"type_id":"zongyi","type_name":"综艺"},{"type_id":"dongman","type_name":"动漫"},{"type_id":"jilupian","type_name":"纪录片"}];
    let filterObj = {
        "dianying":[{"key":"cateId","name":"类型",'init':'',"value":[{"n":"全部","v":""},{"n":"剧情","v":"jqp"},{"n":"喜剧","v":"xjp"},{"n":"动作","v":"dzp"},{"n":"爱情","v":"aqp"},{"n":"科幻","v":"khp"},{"n":"恐怖","v":"kbp"},{"n":"战争","v":"zzp"}]},{"key":"area","name":"地区",'init':'',"value":[{"n":"全部","v":""},{"n":"中国大陆","v":"/area/大陆"},{"n":"中国香港","v":"/area/香港"},{"n":"中国台湾","v":"/area/台湾"},{"n":"美国","v":"/area/美国"},{"n":"韩国","v":"/area/韩国"},{"n":"日本","v":"/area/日本"},{"n":"泰国","v":"/area/泰国"},{"n":"新加坡","v":"/area/新加坡"},{"n":"马来西亚","v":"/area/马来西亚"},{"n":"印度","v":"/area/印度"},{"n":"英国","v":"/area/英国"},{"n":"法国","v":"/area/法国"},{"n":"加拿大","v":"/area/加拿大"},{"n":"西班牙","v":"/area/西班牙"},{"n":"俄罗斯","v":"/area/俄罗斯"},{"n":"澳大利亚","v":"/area/澳大利亚"}]},{"key":"year","name":"时间",'init':'',"value":[{"n":"全部","v":""},{"n":"2024","v":"/year/2024"},{"n":"2023","v":"/year/2023"},{"n":"2022","v":"/year/2022"},{"n":"2021","v":"/year/2021"},{"n":"2020","v":"/year/2020"},{"n":"2019","v":"/year/2019"},{"n":"2018","v":"/year/2018"},{"n":"2017","v":"/year/2017"},{"n":"2016","v":"/year/2016"},{"n":"2015","v":"/year/2015"},{"n":"2014","v":"/year/2014"},{"n":"2013","v":"/year/2013"},{"n":"2012","v":"/year/2012"},{"n":"2011","v":"/year/2011"},{"n":"2010","v":"/year/2010"},{"n":"2009","v":"/year/2009"},{"n":"2008","v":"/year/2008"},{"n":"2007","v":"/year/2007"},{"n":"2006","v":"/year/2006"},{"n":"2005","v":"/year/2005"}]},{"key":"by","name":"排序",'init':'',"value":[{"n":"全部","v":""},{"n":"时间","v":"/by/time"},{"n":"人气","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}],
        "dianshiju":[{"key":"cateId","name":"类型",'init':'',"value":[{"n":"全部","v":""},{"n":"国产剧","v":"gcj"},{"n":"港台剧","v":"gtj"},{"n":"日韩剧","v":"rhj"},{"n":"海外剧","v":"hwj"}]},{"key":"area","name":"地区",'init':'',"value":[{"n":"全部","v":""},{"n":"中国大陆","v":"/area/大陆"},{"n":"中国香港","v":"/area/香港"},{"n":"中国台湾","v":"/area/台湾"},{"n":"美国","v":"/area/美国"},{"n":"韩国","v":"/area/韩国"},{"n":"日本","v":"/area/日本"},{"n":"泰国","v":"/area/泰国"},{"n":"新加坡","v":"/area/新加坡"},{"n":"马来西亚","v":"/area/马来西亚"},{"n":"印度","v":"/area/印度"},{"n":"英国","v":"/area/英国"},{"n":"法国","v":"/area/法国"},{"n":"加拿大","v":"/area/加拿大"},{"n":"西班牙","v":"/area/西班牙"},{"n":"俄罗斯","v":"/area/俄罗斯"},{"n":"澳大利亚","v":"/area/澳大利亚"}]},{"key":"year","name":"时间",'init':'',"value":[{"n":"全部","v":""},{"n":"2024","v":"/year/2024"},{"n":"2023","v":"/year/2023"},{"n":"2022","v":"/year/2022"},{"n":"2021","v":"/year/2021"},{"n":"2020","v":"/year/2020"},{"n":"2019","v":"/year/2019"},{"n":"2018","v":"/year/2018"},{"n":"2017","v":"/year/2017"},{"n":"2016","v":"/year/2016"},{"n":"2015","v":"/year/2015"},{"n":"2014","v":"/year/2014"},{"n":"2013","v":"/year/2013"},{"n":"2012","v":"/year/2012"},{"n":"2011","v":"/year/2011"},{"n":"2010","v":"/year/2010"},{"n":"2009","v":"/year/2009"},{"n":"2008","v":"/year/2008"},{"n":"2007","v":"/year/2007"},{"n":"2006","v":"/year/2006"},{"n":"2005","v":"/year/2005"}]},{"key":"by","name":"排序",'init':'',"value":[{"n":"全部","v":""},{"n":"时间","v":"/by/time"},{"n":"人气","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}],
        "dongman":[{"key":"area","name":"地区",'init':'',"value":[{"n":"全部","v":""},{"n":"中国大陆","v":"/area/大陆"},{"n":"中国香港","v":"/area/香港"},{"n":"中国台湾","v":"/area/台湾"},{"n":"美国","v":"/area/美国"},{"n":"韩国","v":"/area/韩国"},{"n":"日本","v":"/area/日本"},{"n":"泰国","v":"/area/泰国"},{"n":"新加坡","v":"/area/新加坡"},{"n":"马来西亚","v":"/area/马来西亚"},{"n":"印度","v":"/area/印度"},{"n":"英国","v":"/area/英国"},{"n":"法国","v":"/area/法国"},{"n":"加拿大","v":"/area/加拿大"},{"n":"西班牙","v":"/area/西班牙"},{"n":"俄罗斯","v":"/area/俄罗斯"},{"n":"澳大利亚","v":"/area/澳大利亚"}]},{"key":"year","name":"时间",'init':'',"value":[{"n":"全部","v":""},{"n":"2024","v":"/year/2024"},{"n":"2023","v":"/year/2023"},{"n":"2022","v":"/year/2022"},{"n":"2021","v":"/year/2021"},{"n":"2020","v":"/year/2020"},{"n":"2019","v":"/year/2019"},{"n":"2018","v":"/year/2018"},{"n":"2017","v":"/year/2017"},{"n":"2016","v":"/year/2016"},{"n":"2015","v":"/year/2015"},{"n":"2014","v":"/year/2014"},{"n":"2013","v":"/year/2013"},{"n":"2012","v":"/year/2012"},{"n":"2011","v":"/year/2011"},{"n":"2010","v":"/year/2010"},{"n":"2009","v":"/year/2009"},{"n":"2008","v":"/year/2008"},{"n":"2007","v":"/year/2007"},{"n":"2006","v":"/year/2006"},{"n":"2005","v":"/year/2005"}]},{"key":"by","name":"排序",'init':'',"value":[{"n":"全部","v":""},{"n":"时间","v":"/by/time"},{"n":"人气","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}],
        "zongyi":[{"key":"area","name":"地区",'init':'',"value":[{"n":"全部","v":""},{"n":"中国大陆","v":"/area/大陆"},{"n":"中国香港","v":"/area/香港"},{"n":"中国台湾","v":"/area/台湾"},{"n":"美国","v":"/area/美国"},{"n":"韩国","v":"/area/韩国"},{"n":"日本","v":"/area/日本"},{"n":"泰国","v":"/area/泰国"},{"n":"新加坡","v":"/area/新加坡"},{"n":"马来西亚","v":"/area/马来西亚"},{"n":"印度","v":"/area/印度"},{"n":"英国","v":"/area/英国"},{"n":"法国","v":"/area/法国"},{"n":"加拿大","v":"/area/加拿大"},{"n":"西班牙","v":"/area/西班牙"},{"n":"俄罗斯","v":"/area/俄罗斯"},{"n":"澳大利亚","v":"/area/澳大利亚"}]},{"key":"year","name":"时间",'init':'',"value":[{"n":"全部","v":""},{"n":"2024","v":"/year/2024"},{"n":"2023","v":"/year/2023"},{"n":"2022","v":"/year/2022"},{"n":"2021","v":"/year/2021"},{"n":"2020","v":"/year/2020"},{"n":"2019","v":"/year/2019"},{"n":"2018","v":"/year/2018"},{"n":"2017","v":"/year/2017"},{"n":"2016","v":"/year/2016"},{"n":"2015","v":"/year/2015"},{"n":"2014","v":"/year/2014"},{"n":"2013","v":"/year/2013"},{"n":"2012","v":"/year/2012"},{"n":"2011","v":"/year/2011"},{"n":"2010","v":"/year/2010"},{"n":"2009","v":"/year/2009"},{"n":"2008","v":"/year/2008"},{"n":"2007","v":"/year/2007"},{"n":"2006","v":"/year/2006"},{"n":"2005","v":"/year/2005"}]},{"key":"by","name":"排序",'init':'',"value":[{"n":"全部","v":""},{"n":"时间","v":"/by/time"},{"n":"人气","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}],
         "jilupian":[{"key":"area","name":"地区",'init':'',"value":[{"n":"全部","v":""},{"n":"中国大陆","v":"/area/大陆"},{"n":"中国香港","v":"/area/香港"},{"n":"中国台湾","v":"/area/台湾"},{"n":"美国","v":"/area/美国"},{"n":"韩国","v":"/area/韩国"},{"n":"日本","v":"/area/日本"},{"n":"泰国","v":"/area/泰国"},{"n":"新加坡","v":"/area/新加坡"},{"n":"马来西亚","v":"/area/马来西亚"},{"n":"印度","v":"/area/印度"},{"n":"英国","v":"/area/英国"},{"n":"法国","v":"/area/法国"},{"n":"加拿大","v":"/area/加拿大"},{"n":"西班牙","v":"/area/西班牙"},{"n":"俄罗斯","v":"/area/俄罗斯"},{"n":"澳大利亚","v":"/area/澳大利亚"}]},{"key":"year","name":"时间",'init':'',"value":[{"n":"全部","v":""},{"n":"2024","v":"/year/2024"},{"n":"2023","v":"/year/2023"},{"n":"2022","v":"/year/2022"},{"n":"2021","v":"/year/2021"},{"n":"2020","v":"/year/2020"},{"n":"2019","v":"/year/2019"},{"n":"2018","v":"/year/2018"},{"n":"2017","v":"/year/2017"},{"n":"2016","v":"/year/2016"},{"n":"2015","v":"/year/2015"},{"n":"2014","v":"/year/2014"},{"n":"2013","v":"/year/2013"},{"n":"2012","v":"/year/2012"},{"n":"2011","v":"/year/2011"},{"n":"2010","v":"/year/2010"},{"n":"2009","v":"/year/2009"},{"n":"2008","v":"/year/2008"},{"n":"2007","v":"/year/2007"},{"n":"2006","v":"/year/2006"},{"n":"2005","v":"/year/2005"}]},{"key":"by","name":"排序",'init':'',"value":[{"n":"全部","v":""},{"n":"时间","v":"/by/time"},{"n":"人气","v":"/by/hits"},{"n":"评分","v":"/by/score"}]}]
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
    const link = HOST + '/rrtop/' + (extend.cateId || tid) + (extend.area || '') + (extend.by || '/by/time') + '/page/' + pg + (extend.year || '') + '.html';//https://www.rttks.com/rrtop/dzp/area/%E7%BE%8E%E5%9B%BD/class//page/2/year/2022.html
    const html = await request(link);
    const $ = load(html);
    const items = $('ul.stui-vodlist li');
    let videos = _.map(items, (item) => {
        const it = $(item).find('a:first')[0];
        const remarks = $($(item).find('span.pic-text text-right')[0]).text().trim();
        return {
            vod_id: it.attribs.href.replace(/.*?\/rrtv\/(.*).html/g, '$1'),
            vod_name: it.attribs.title,
            vod_pic: it.attribs['data-original'],
            vod_remarks: remarks || '',
        };
    });
    const hasMore = $('ul.stui-page > li > a:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 24,
        total: 24 * pgCount,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const html = await request( HOST + '/rrtv/' + id + '.html');
    const $ = load(html);
    const vod = {
        vod_id: id,
        vod_name: $('.col-md-wide-75 h2').text().trim(),
        vod_type: $('.stui-content__detail p:nth-child(4)').text(),
        vod_actor: $('.stui-content__detail p:nth-child(2)').text().replace('上映：剧情：', ''),
        vod_pic: $('.module-item-pic img:first').attr('data-src'),
        vod_remarks : $('.stui-content__detail p:nth-child(5)').text() || '',
        vod_content: $('.detail-content').text().trim(),
    };
    let playMap = {};
    const tabs = $('body div.bottom-line h3.title');
    const playlists = $('ul.stui-content__playlist');
    _.each(tabs, (tab, i) => {
        const from = tab.children[0].data;
        let list = playlists[i];
        list = $(list).find('a');
        _.each(list, (it) => {
            let title = it.children[0].data;
            const playUrl = it.attribs.href.replace(/.*?\/rrplay\/(.*).html/g, '$1');
            if (title.length == 0) title = it.children[0].data.trim();
            if (!playMap.hasOwnProperty(from)) {
                playMap[from] = [];
            }
            playMap[from].push( title + '$' + playUrl);
        });
    });
    vod.vod_play_from = _.keys(playMap).join('$$$');
    const urls = _.values(playMap);
    let vod_play_url = _.map(urls, (urlist) => {
        return urlist.join('#');
    });
    vod.vod_play_url = vod_play_url.join('$$$');
    return ({
        list: [vod],
    });
}
async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const link = HOST + '/rrplay/' + id + '.html';
    const html = await request(link);
    const $ = load(html);
    const js = JSON.parse($('script:contains(player_)').html().replace('var player_aaaa=',''));
    const playUrl = decodeURIComponent(base64Decode(js.url));
    return ({
        parse: 0,
        url: playUrl,
    });
}

function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text));
}

function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text));
}
async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    let data = await request(HOST + '/rrcz' + wd + '/page/' + pg + '.html');//https://www.rttks.com/rrcz%E6%88%91/page/2.html
    const $ = load(data);
   const items = $('ul.stui-vodlist__media li');
   let videos = _.map(items, (item) => {
        const it = $(item).find('a:first')[0];
        const remarks = $($(item).find('span.pic-text text-right')[0]).text().trim();
        return {
            vod_id: it.attribs.href.replace(/.*?\/rrtv\/(.*).html/g, '$1'),
            vod_name: it.attribs.title,
            vod_pic: it.attribs['data-original'],
            vod_remarks: remarks || '',
        };
    });
    const hasMore = $('ul.stui-page > li > a:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 24,
        total: 24 * pgCount,
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
        key: 'rrys',
        name: '🟢 人人',
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
