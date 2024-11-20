import { Spider } from "../spider.js";
import req from '../../util/req.js';
import { MAC_UA, formatPlayUrl } from '../../util/misc.js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;
import * as HLS from 'hls-parser';
import * as Ali from '../../util/ali.js';
import { getDownload, getFilesByShareUrl, getLiveTranscoding, getShareData, initAli} from '../../util/ali.js';

import CryptoJS from 'crypto-js';
let patternAli = /(https:\/\/www\.(aliyundrive|alipan)\.com\/s\/[^"]+)/

let siteUrl = 'https://upapi.juapp9.com';

class UpyunSpider extends Spider {

    constructor() {
        super();
        this.siteUrl = 'https://upapi.juapp9.com';
    }

    getName() { return "🕸️|UP云搜(仅搜索)" }

    getAppName() { return "UP云搜(仅搜索)" }

    getJSName() { return "upyun" }

    async request(reqUrl) {
        let res = await req.get(reqUrl, {
            headers: {
                'Referer': this.siteUrl,
            },
        });
        return res.data;
    }
    
    async init(inReq, _outResp) {
        await initAli(inReq.server.db, inReq.server.config.ali);
        return {}
    }
    
    async home(inReq,_outResp){
        return {}
    }
    
    base64Decode(text) {
        return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
    }
    
    async category(inReq, _outResp) {
        return{}
    }
    
    async detail(inReq, _outResp) {
        const shareUrl = inReq.body.id;
        const videos = [];
        let vod = ({
            vod_id: shareUrl,
        });
        
        let p = await  this.panDetail(shareUrl);
        vod.vod_play_from = p.play_from;
        vod.vod_play_url = p.play_url;
        
        videos.push(vod);
        return {
            list: videos,
        };
    }
    
    isShareUrl(url){
        const regex = new RegExp('/s|^[^.]+$/g');
        return regex.test(url);
    }
    
    async parseHtmlList(pg, wd) {
        const resp = await this.request(this.siteUrl + '/search?keyword=' + encodeURIComponent(wd) + '&page=' + pg + '&s_type=2');
        const data = this.base64Decode(resp);
        const items = JSON.parse(data).result.items;
        const videos = [];
        for (const item of items) {
            const url = item.page_url;
            if (!this.isShareUrl(url)) continue;
            const title = _.isEmpty(item.content) ? item.title : item.content[0].title;
            videos.push({
                vod_id: url,
                vod_name: title.replaceAll(/<\/?[^>]+>/g, ''),
                vod_pic: 'https://inews.gtimg.com/newsapp_bt/0/13263837859/1000',
                vod_remarks: item.insert_time,
            });
        }
        const hasMore = !_.isEmpty(items);
        const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
        return {
            page: parseInt(pg),
            pagecount: pgCount,
            list: videos,
        };
    }

    async search(inReq, _outResp) {
        let pg = inReq.body.page;
        const wd = inReq.body.wd;
        if (pg <= 0) pg = 1;
        return this.parseHtmlList(pg,wd);
    }
    
    decrypt(text) {
        const data = {
            ciphertext: CryptoJS.enc.Hex.parse(text.toUpperCase()),
        };
        const key = CryptoJS.enc.Utf8.parse('qq1920520460qqzz');
        const iv = CryptoJS.enc.Utf8.parse('qq1920520460qqzz');
        const mode = CryptoJS.mode.CBC;
        const padding = CryptoJS.pad.Pkcs7;
        const decrypted = CryptoJS.AES.decrypt(data, key, {
            'iv': iv,
            'mode': mode,
            'padding': padding
        });
        const decryptedData = CryptoJS.enc.Utf8.stringify(decrypted);
        return decryptedData;
    }
}

/*
export default {
    meta: {
        key: 'upyun',
        name: '🕸️|UP云搜(仅搜索)',
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
};*/

let spider = new UpyunSpider()

async function init(inReq, _outResp) {
    return await spider.init(inReq, _outResp)
}

async function home(inReq, _outResp) {
    return await spider.home(inReq, _outResp)
}

async function category(inReq, _outResp) {
    return await spider.category(inReq, _outResp)
}

async function detail(inReq, _outResp) {
    return await spider.detail(inReq, _outResp)
}

async function play(inReq, _outResp) {
    return await spider.play(inReq, _outResp)
}

async function search(inReq, _outResp) {
    return await spider.search(inReq, _outResp)
}

async function test(inReq, _outResp) {
    return await spider.testSearch(inReq, _outResp)
}

async function proxy(inReq, _outResp) {
    return await spider.proxy(inReq, _outResp)
}

export default {
    meta: {
        key: spider.getJSName(), name: spider.getName(), type: spider.getType(),
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
    spider: {
        init: init, home: home, category: category, detail: detail, play: play, search: search, test: test, proxy: proxy
    }
}