import req from '../../util/req.js';
import { load } from 'cheerio';
import { ua, init ,detail0 ,proxy ,play ,test ,isEmpty } from '../../util/pan.js';
import dayjs from 'dayjs';
import CryptoJS from 'crypto-js';

let siteUrl = 'https://www.alipansou.com';

async function requestRaw(reqUrl, headers, redirect) {
        const res = await req(reqUrl, {
            method: 'get',
            headers: headers || {
                'User-Agent': ua,
                'Referer': siteUrl,
            },
            validateStatus: status => status >= 200 && status < 400,
            maxRedirects: redirect,
        });
        return res;
    }
  
async function request(reqUrl) {
        let resRaw = await requestRaw(reqUrl);
        return resRaw.data;
    }

async function detail(inReq, _outResp) {
        const id = inReq.body.id;
        const videos = [];
        const url = siteUrl + id.replace('/s/', '/cv/');
        const data = await requestRaw(url, getHeaders(id), 0);
        const headers = data.headers;
        const resp = data.data;
        let shareUrl;
        if (headers.hasOwnProperty('location')) {
            shareUrl = headers['location'].replace('/redirect?visit=', 'https://www.aliyundrive.com/s/');
        } else if (!isEmpty(resp)) {
            const $ = load(resp);
            shareUrl = $('a:first').attr('href').replace('/redirect?visit=', 'https://www.aliyundrive.com/s/');
        }
        let shareUrls = !Array.isArray(shareUrl) ? [shareUrl] : shareUrl;  
        let vod = ({
            vod_id: id,
        });
        videos.push(await detail0(shareUrls ,vod));
        return {
            list: videos,
        };
}

function getHeaders(id) {
    return {
        "User-Agent": ua,
        "Referer": id,
        "_bid": "6d14a5dd6c07980d9dc089a693805ad8",
    };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    const limit = 10;
    const html = await request(siteUrl + "/search?k=" + encodeURIComponent(wd) + "&page=" + pg + "&s=0&t=-1");
    const $ = load(html);
    const items = $('van-row > a');
    const videos = items.map((_,item) => {
        let title = $(item).find('template:first').text().trim();
        return {
            vod_id: item.attribs.href,
            vod_name: title,
            vod_pic: 'https://img.omii.top/i/2024/03/17/vrgul5.webp',
        };
    }).get();
    const pageCount = $('van-pagination').attr('page-count') || pg;
    const pgCount = parseInt(pageCount);
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    });
}

export default {
    meta: {
        key: 'maoli',
        name: '🔍 猫狸',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};