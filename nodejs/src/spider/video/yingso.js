import req from '../../util/req.js';
import { load } from 'cheerio';
import { ua, init ,detail as _detail ,proxy ,play ,test ,isEmpty } from '../../util/pan.js';
import CryptoJS from 'crypto-js';
import dayjs from 'dayjs';

let aliUrl = 'https://www.aliyundrive.com/s/';
let quarkUrl = 'https://pan.quark.cn/s/';
let host = 'https://ys.api.yingso.fun';
let url = host + '/v3';

async function request(reqUrl, data) {
    const res = await req(reqUrl, {
        method: 'post',
        headers: {
            'User-Agent': ua,
            'Referer': host,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(data),
        postType: '',
    });
    return res.data;
}


async function home(filter) {
    const classes = [{'type_id':'1','type_name':'阿里云盘'},{'type_id':'2','type_name':'夸克云盘'}];
    const filterObj = {};
    return {
        class: classes,
        filters: filterObj,
    };
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    const limit = 30;
    const params = {
        pageSize: limit,
        pageNum: pg,
        root: tid,
        cat: 'all',
    };
    const resp = await request(url + '/ali/all', params);
    return parseVodList(resp, pg, limit);
}

function parseVodList(resp, pg, limit) {
    const jsons = resp;
    const videos = [];
    for(const item of jsons.data){
    let vod = [];
    if(item.root ==1)
    vod ={
            vod_id: aliUrl + item.key,
            vod_name: item.title,
            vod_pic: 'https://img.omii.top/i/2024/03/17/vqn6em.webp',
            vod_remarks: dayjs(item.time).format('YY/MM/DD hh:mm'),
      };
    else if(item.root == 2)
    vod ={
            vod_id: quarkUrl + item.key,
            vod_name: item.title,
            vod_pic: 'https://img.omii.top/i/2024/03/17/vqmr8m.webp',
            vod_remarks: dayjs(item.time).format('YY/MM/DD hh:mm'),
        };
    else continue;
    videos.push(vod);
    }
    const pgCount = isEmpty(videos) ? pg : pg + 1;
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
    const id = inReq.body.id;
    if (pg <= 0) pg = 1;
    const limit = 30;
    const params = {
        pageSize: limit,
        pageNum: pg,
        title: wd,
        root: id,
        cat: 'all'
    };
    const resp = await request(url + '/ali/search', params);
    // console.log(resp);
    return parseVodList(resp, pg, limit);
}

export default {
    meta: {
        key: 'yingso',
        name: '🔍 影搜',
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
