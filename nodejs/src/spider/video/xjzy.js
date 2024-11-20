import req from '../../util/req.js';
import { PC_UA } from '../../util/misc.js';
import { load } from 'cheerio';
import pkg from 'lodash';
import CryptoJS from 'crypto-js';

const { _ } = pkg;

let HOST = 'https://avss.vip/';

async function request(reqUrl) {
    let resp = await req.get(reqUrl, {
        headers: {
            'User-Agent': PC_UA,
        },
    });
    return resp.data;
}

async function init(_inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    let classes = [
        { type_id: 'xjzy', type_name: '中午字幕' },
        { type_id: 'cq', type_name: '超清资源' },
        { type_id: 'gccm', type_name: '国产传媒' },
        { type_id: '99re', type_name: '久久综合' },
        { type_id: 'fcw', type_name: '废柴资源' },
        { type_id: 'av-guochanzipai1', type_name: '国产自拍1区' },
        { type_id: 'av-guochanzipai2', type_name: '国产自拍2区' },
        { type_id: 'av-guochanzipai3', type_name: '国产自拍3区' },
        { type_id: 'av-sanjizonghe', type_name: '三级综合' },
        { type_id: 'av-hanguozonghe1', type_name: '韩国综合1区' },
        { type_id: 'av-hanguozonghe2', type_name: '韩国综合2区' },
        { type_id: 'av-oumei2', type_name: '欧美2区' },
        { type_id: 'av-oumei3', type_name: '欧美3区' },
        { type_id: 'av-91zhipianchang', type_name: '91制片厂' },
        { type_id: 'av-zhibolubo', type_name: '直播录播' },
    ];
    let filterObj = {
        "xjzy": [
            {
                key: 'class',
                name: '中文',
                init: 'xjzy/cn-zhongwenwuma',
                value: [
                    { n: '无码', v: 'xjzy/cn-zhongwenwuma' },
                    { n: '综合', v: 'xjzy/cn-zhongwenzonghe' },
                    { n: '近亲', v: 'xjzy/cn-zhongwenjingqing' },
                    { n: '护士', v: 'xjzy/cn-zhongwenjingqing' },
                    { n: '师生', v: 'xjzy/cn-zhongwenshisheng' },
                    { n: '强奸', v: 'xjzy/cn-zhongwenqiangjian' },
                    { n: '国产自拍', v: 'xjzy/cn-guochanzipai' },
                    { n: '明星淫梦', v: 'xjzy/cn-mingxingyinmeng' },
                    { n: '三级伦理', v: 'xjzy/cn-sanjizonghe' },
                    { n: '3D同人', v: 'xjzy/cn-3Dtongren' },
                    { n: '原片解说', v: 'xjzy/cn-jieshuoyuanpian' },
                ],
            },
        ],
        "cq": [
            {
                key: 'class',
                name: '超清',
                init: 'cq/2k-yazhou',
                value: [
                    { n: '亚洲ＡＶ', v: 'cq/2k-yazhou' },
                    { n: '自拍偷拍', v: 'cq/2k-zipaitoupai' },
                    { n: '超清传媒', v: 'cq/2k-chaoqingchuanmei' },
                    { n: '欧美ＡＶ', v: 'cq/2k-oumei' },
                    { n: '乱伦人妻', v: 'cq/2k-luanlunrenqi' },
                    { n: '丝袜制服', v: 'cq/2k-siwazhifu' },
                    { n: '直播录播', v: 'cq/2k-zhibolubo' },
                    { n: 'SM另类', v: 'cq/2k-SMlinglei' },
                    { n: '超清三级', v: 'cq/2k-chaoqingsanji' },
                    { n: '3D动漫', v: 'cq/2k-3Ddongman' },
                ],
            },
        ],
        "gccm": [
            {
                key: 'class',
                name: '国产传媒',
                init: 'gccm/91-madouyuanchuang',
                value: [
                    { n: '综合传媒', v: 'gccm/91-madouyuanchuang' },
                    { n: '91制片厂', v: 'gccm/91-91zhipianchang' },
                    { n: '杏吧原创', v: 'gccm/91-xingbayuanchuang' },
                    { n: '糖心VLGO', v: 'gccm/91-tangxinVlgo' },
                    { n: '天美传媒', v: 'gccm/91-tianmeichuanmei' },
                    { n: '蜜桃传媒', v: 'gccm/91-mitaochuanmei' },
                    { n: '星空传媒', v: 'gccm/91-xingkongchuanmei' },
                    { n: '精东影业', v: 'gccm/91-jingdongyingye' },
                    { n: '兔子先生', v: 'gccm/91-tuzixiansheng' },
                    { n: '大象传媒', v: 'gccm/91-daxiangchuanmei' },
                ],
            },
        ],
        "99re": [
            {
                key: 'class',
                name: '九九资源',
                init: '99re/kdw-guochanzipai',
                value: [
                    { n: '国产自拍', v: '99re/kdw-guochanzipai' },
                    { n: '中文字幕', v: '99re/kdw-zhongwenzimu' },
                    { n: '欧美', v: '99re/kdw-oumei' },
                    { n: '日本有码', v: '99re/kdw-ribenyouma' },
                    { n: '日本无码', v: '99re/kdw-ribenwuma' },
                    { n: '加勒比', v: '99re/kdw-jialebi' },
                    { n: '一本道', v: '99re/kdw-yibendao' },
                    { n: '东京热', v: '99re/kdw-dongjingre' },
                    { n: '高清', v: '99re/kdw-gaoqing' },
                    { n: '潮吹', v: '99re/kdw-chaochui' },
                    { n: '会员认证作品', v: '99re/kdw-jiujiurehuiyuanrenzhengzuopin' },
                    { n: '制服丝袜', v: '99re/kdw-zhifusiwa' },
                    { n: '口爆颜射', v: '99re/kdw-koubaoyanshe' },
                    { n: '肛交', v: '99re/kdw-gangjiao' },
                    { n: '小格式综合', v: 'xjzy/cn-3Dtongren' },
                    { n: '女主播系列', v: '99re/kdw-hanguonvzhuboxilie' },
                    { n: '成人动漫', v: '99re/kdw-chengrendongman' },
                    { n: 'sm性虐', v: '99re/kdw-SMxingnue' },
                    { n: '韩国综合', v: '99re/kdw-hanguozonghe' },
                    { n: '李宗瑞全集', v: '99re/kdw-lizongruiquanji' },
                ],
            },
        ],
        "fcw": [
            {
                key: 'class',
                name: '废柴资源',
                init: 'fcw/ff-VIPzhuanqu',
                value: [
                    { n: 'VIP专区', v: 'fcw/ff-VIPzhuanqu' },
                    { n: '偷拍系列', v: 'fcw/ff-toupaixilie' },
                    { n: '国产自拍', v: 'fcw/ff-guochanzipai' },
                    { n: '日本有码', v: 'fcw/ff-ribenyouma' },
                    { n: '日本无码', v: 'fcw/ff-ribenwuma' },
                    { n: '成人动漫', v: 'fcw/ff-chengrendongman' },
                    { n: '韩国综合', v: 'fcw/ff-hanguozonghe' },
                    { n: 'VR专区', v: 'fcw/ff-VRzhuanqu' },
                    { n: '欧美', v: 'fcw/ff-oumei' },
                ],
            },
        ],
    };
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function homeVod() {
    let videos = await getVideos(HOST);
    return JSON.stringify({
        list: videos,
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    const html = await request(`${HOST}${(extend['class'] || tid)}-${pg}.html`);
    // const html =await request(HOST+'/avplay-chaoqingziyuanpiaoliangluolimeimeisangemeimeizidongangeshangweiwutaoqichengwumaofenxuexiaojiaoruzhegemenzhenxingfubiyecaodeshutan-1-1.html');
    const $ = load(html);
    const items = $('div.item');
    let videos = _.map(items, (item) => {
        const it = $(item).find('a:first')[0];
        const k = $(item).find('img:first')[0];
        const remarks = $($(item).find('div.duration')[0]).text().trim();
        return {
            vod_id: it.attribs.href,
            vod_name: it.attribs.title,
            vod_pic: k.attribs['data-original'],
            vod_remarks: remarks || '',
        };
    });
    const hasMore = $('ul>  li.page-item > a.page-link:contains(下一页)').length > 0;
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
    const vod = {
        vod_id: id,
        vod_remarks: '',
    };
    const playlist = ['点击播放' + '$' + id];
    vod.vod_play_from = '香蕉资源';
    vod.vod_play_url = playlist.join('#');
    return JSON.stringify({
        list: [vod],
    });
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const link = HOST + id;
    const html = await request(link);
    const $ = load(html);
    let js = JSON.parse($('script:contains(player_)').html().replace('var player_aaaa=', ''));
    if(js.url.toString().indexOf("m3u8")>0){
        const playUrl = js.url.replace(/\\/g, '');
        return JSON.stringify({
            parse: 0,
            url: playUrl,
        });
    }else {
        if(js.from.toString().indexOf("_")>0){
            const html = await request(`https://ppyy00.vip/${js.from.replace("_",'')}/?url=`+js.url);
            const $ = load(html);
            const relurl=$('script:contains(player)').html().match(/{.*?}/)[0].split('"')[7].toString();
            return JSON.stringify({
                parse: 0,
                url: relurl,
            });
        }else {
            const html =await request(`https://ppyy00.vip/${js.from}/?url=`+js.url)
            const $ = load(html);
            const relurl=$('script:contains(player)').html().match(/{.*?}/)[0].split('"')[7].toString();
            return JSON.stringify({
                parse: 0,
                url: relurl,
            });
        }
    }

}

async function search(inReq, _outResp) {
    let pg = inReq.body.page;
    const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    let data = await request(HOST + '/sos' + wd + '/page/' + pg + '.html'); //https://avss.vip/xjzy/vod/search/page/{catePg}/wd/{wd}.html
    const $ = load(data);
    const items = $('div.item');
    let videos = _.map(items, (item) => {
        const it = $(item).find('a:first')[0];
        const k = $(item).find('img:first')[0];
        const remarks = $($(item).find('div.duration')[0]).text().trim();
        return {
            vod_id: it.attribs.href,
            vod_name: it.attribs.title,
            vod_pic: k.attribs['data-original'],
            vod_remarks: remarks || '',
        };
    });
    const hasMore = $('ul>  li.page-item > a.page-link:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
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
        key: 'xjzy',
        name: '🟡 香蕉',
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
