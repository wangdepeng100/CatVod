import req from '../../util/req.js';
import { load } from 'cheerio';
import { ua, init ,detail0 ,proxy ,play ,test ,isEmpty } from '../../util/pan.js';

let siteUrl = 'https://gitcafe.net/tool/alipaper/';
let aliUrl = "https://www.aliyundrive.com/s/";
let token = '';
let date = new Date();

async function request(reqUrl, data) {
    let res = await req(reqUrl, {
        method: 'post',
        headers: {
            'User-Agent': ua,
        },
        data: data,
        postType: 'form',
    });
    return res.data;
}

async function home(filter) {
    const classes = [{'type_id':'1','type_name':'电视'},{'type_id':'2','type_name':'电影'},{'type_id':'3','type_name':'动漫'},{'type_id':'4','type_name':'视频'},{'type_id':'5','type_name':'音乐'}];
    const filterObj = {
        '1':[{'key':'class','name':'类型','init':'hyds','value':[{'n':'华语','v':'hyds'},{'n':'日韩','v':'rhds'},{'n':'欧美','v':'omds'},{'n':'其他','v':'qtds'}]}],
        '2':[{'key':'class','name':'类型','init':'hydy','value':[{'n':'华语','v':'hydy'},{'n':'日韩','v':'rhdy'},{'n':'欧美','v':'omdy'},{'n':'其他','v':'qtdy'}]}],
        '3':[{'key':'class','name':'类型','init':'hydm','value':[{'n':'国漫','v':'hydm'},{'n':'日本','v':'rhdm'},{'n':'欧美','v':'omdm'}]}],
        '4':[{'key':'class','name':'类型','init':'jlp','value':[{'n':'纪录','v':'jlp'},{'n':'综艺','v':'zyp'},{'n':'教育','v':'jypx'},{'n':'其他','v':'qtsp'}]}],
        '5':[{'key':'class','name':'类型','init':'hyyy','value':[{'n':'华语','v':'hyyy'},{'n':'日韩','v':'rhyy'},{'n':'欧美','v':'omyy'},{'n':'其他','v':'qtyy'}]}],
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
    const params = `action=viewcat&cat=${extend.class}&num=${pg}&token=${await getToken()}`;
    const resp = await request(siteUrl, params);
    const json = resp.data;
    const videos = json.map((item) => {
        return {
            vod_id: aliUrl + item.alikey,
            vod_name: item.alititle,
            vod_pic: "https://img.omii.top/i/2024/03/17/vqn6em.webp",
            vod_remarks: item.creatime
        };
    });
    const pgCount = isEmpty(videos) ? pg : pg + 1;
    const limit = 50;
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
    let shareUrls = ids;
    const videos = [];
    for (const id of ids) {
    let vod = ({
            vod_id: id,
        });
        videos.push(await detail0(shareUrls ,vod));
    }
    return {
        list: videos,
    };
}

async function search(inReq, _outResp) {
    let pg = inReq.body.page;
    const wd = inReq.body.wd;
    if (pg <= 0) pg = 1;
    const params = `action=search&from=web&keyword=${wd}&token=${await getToken()}`;
    const resp = await request(siteUrl, params);
    const json = resp.data;
    const videos = json.map((item) => {
        return {
            vod_id: aliUrl + item.alikey,
            vod_name: item.alititle,
            vod_pic: "https://img.omii.top/i/2024/03/17/vqn6em.webp",
            vod_remarks: item.creatime
        };
    });
    return {
        list: videos,
        tline: 4
    };
}

async function getToken() {
    const newDate = new Date();
    if (isEmpty(token) || newDate > date) {
        const params = 'action=get_token';
        const resp = await request(siteUrl, params);
        const token = resp.data;
        return token;
    }
}

export default {
    meta: {
        key: 'xzt',
        name: '🔍 纸条',
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
