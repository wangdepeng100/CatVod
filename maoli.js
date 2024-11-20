import req from '../../util/req.js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;
import { init ,detail0 ,proxy ,play ,test } from '../../util/pan.js';
import dayjs from 'dayjs';
import CryptoJS from 'crypto-js';

let siteUrl = 'https://www.alipansou.com';
let patternAli = /(https:\/\/www\.(aliyundrive|alipan)\.com\/s\/[^"]+)/

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function requestRaw(reqUrl, headers, redirect) {
        const res = await req(reqUrl, {
            method: 'get',
            headers: headers || {
                'User-Agent': UA,
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

async function home(inReq,_outResp){
return {};
}

async function category(inReq,_outResp) {
    return{}
}

async function detail(inReq, _outResp) {
        const id = inReq.body.id;
        const url = siteUrl + id.replace('/s/', '/cv/');
        const data = await requestRaw(url, getHeaders(id), 0);
        const headers = data.headers;
        const resp = data.data;
        let shareUrl;
        if (headers.hasOwnProperty('location')) {
            shareUrl = headers['location'].replace('/redirect?visit=', 'https://www.aliyundrive.com/s/');
        } else if (!_.isEmpty(resp)) {
            const $ = load(resp);
            shareUrl = $('a:first').attr('href').replace('/redirect?visit=', 'https://www.aliyundrive.com/s/');
        } else {
            return {};
        }
        return await detailContent(id,shareUrl);
}

async function detailContent(id ,url){
    console.log(url)
    let shareUrls = !Array.isArray(url) ? [url] : url;  
    const videos = [];
    let vod = ({
            vod_id: siteUrl + id,
        });
        videos.push(await detail0(shareUrls ,vod));
    return {
        list: videos,
    };
}

function getHeaders(id) {
    return {
        "User-Agent": UA,
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
    const videos = _.map(items, (item) => {
        let title = $(item).find('template:first').text().trim();
        return {
            vod_id: item.attribs.href,
            vod_name: title,
            vod_pic: 'https://inews.gtimg.com/newsapp_bt/0/13263837859/1000',
        };
    });
    const pageCount = $('van-pagination').attr('page-count') || pg;
    const pgCount = parseInt(pageCount);
    return JSON.stringify({
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
        name: '猫狸盘搜',
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