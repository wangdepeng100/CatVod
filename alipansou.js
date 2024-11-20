
/*
import {_, load} from "../lib/cat.js";
import {Spider} from "./spider.js";
import {detailContent, initAli, playContent} from "../lib/ali.js";
import {VodDetail, VodShort} from "../lib/vod.js";
import * as Utils from "../lib/utils.js";*/

import * as Ali from '../../util/ali.js';
import * as Quark from '../../util/quark.js';

import { Spider } from "../spider.js";
import req from '../../util/req.js';
import { load } from 'cheerio';

import pkg from 'lodash';
const { _ } = pkg;

import * as Utils from '../../util/utils.js';

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36";

let siteHtml = '';

class AlipansouSpider extends Spider {
    constructor() {
        super();
        this.siteUrl = "https://www.alipansou.com"
    }

    async request(reqUrl, data) {
        const res = await req(reqUrl, {
            method: 'get',
            headers: this.getHeader(),
            data: data,
            /*
            headers: {
                'User-Agent': MAC_UA,
                'Referer': this.siteUrl,
                'Accept-Encoding': 'gzip',
            },*/
        });
        return res.data;
    }

    getSearchHeader(id) {
        let headers = this.getHeader()
        headers["Referer"] = id
        headers["Postman-Token"] = "5f1bb291-ce30-44c7-8885-6db1f3a50785"
        headers["Host"] = "www.alipansou.com"
        return headers
    }

    getName() { return "😸‍|猫狸盘搜" }

    getAppName() { return "阿里猫狸" }

    getJSName() { return "alipansou" }

    getHeader() {
        return {
            "User-Agent": CHROME,
            "Connection": "keep-alive",
            "Cookie": "_ga=GA1.1.1506025676.1708225506;FCNEC=%5B%5B%22AKsRol9sCpH4JteOAAMprJLQxCHddrtkOFinxqt1cs8x3fKzbBZ5Ll76VvjATz1Ejf6NoayGSONFl2gfn6PbVAG97MlHjhp6cY5NFLQtLIUy0TuzI1_ThHnANe8fW03fHdU2-cx5yM3MftaHt4awEGBWhgtE9H_P5w%3D%3D%22%5D%5D;_cc_id=cc82bd83ea8936df45fe63c887a6f221;mysession=MTcwOTYyMjMxMHxEdi1CQkFFQ180SUFBUkFCRUFBQU1fLUNBQUVHYzNSeWFXNW5EQXdBQ25ObFlYSmphRjlyWlhrR2MzUnlhVzVuREJFQUQtV1JxT1draE9tWnBPUzRpZVd1c3c9PXyjHmLCdFvUlsW_gilBojjCq1ak-ffOud6aZKm3kxzJ4w==;Hm_lvt_02f69e0ba673e328ef49b5fb98dd4601=1708225506,1709622301,1710414091;_bid=28d3966abb8cf873ea912b715552f587;cf_clearance=6LuYs83fWIZlcwwzZkgRyYyFrP6Hndxe_CgByMe.pMs-1710414092-1.0.1.1-V44M.u7MNIozBytYixxp4Qe1OVr.CBH78.IEK2QJTWGQ7.HQBR0DoUgiSfpa23U.nxtOfhkrASpqogvz53knnw;cto_bundle=-WbYyl9VWGZjQkhzZ0gyQjE4VXNlcTJnYTNaV3dMaTdVV0xST3p5RkVnUTNxVWpxYVElMkZtNnVsaWtQSzdQU3JJY0slMkYxc3R5SXdyQlRzbkp1clVNZk84OElTR2MlMkJPeGx0bGtsUHk2VzhGdk1yYyUyRnB5eUNNblhKbWpzcjY1SVI1ODlWRGZXemgzUU51bGF5UWxFNVljcUZpd252bnVZZ1R1d0VXRmJ3S1FXQ1RCMXhVNCUzRA;Hm_lpvt_02f69e0ba673e328ef49b5fb98dd4601=1710416656;_ga_NYNC791BP2=GS1.1.1710414091.2.1.1710416656.0.0.0;_ga_0B2NFC7Z09=GS1.1.1710414091.2.1.1710416656.60.0.0;_egg=16a87a4666714be885e814217b225d50e"}
    }

    /*
    async init(cfg) {
        await this.spiderInit()
        await super.init(cfg);
        await initAli(this.cfgObj["token"]);
    }*/

    async init(inReq, _outResp) {
        await Ali.initAli(inReq.server.db, inReq.server.config.ali);
        await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
        return {}
    }

    async home(inReq, _outResp) {

        let classes = [];
        let filterObj = {};

        this.siteHtml = await this.request(this.siteUrl);
        
        let $ = load(this.siteHtml)
        let tap_elemets = $($("[id=\"app\"]")[0]).find("van-tab")
        let index = 0
        for (const tap_element of tap_elemets) {
            let type_name = tap_element.attribs["title"]
            if (type_name.indexOf("热搜") === -1 && type_name !== "游戏" && type_name !== "小说") {
                classes.push({"type_name": type_name, "type_id": index})
            }
            index = index + 1
        }

        /*
        if (!_.isEmpty(html)) {
            return load(html)
        }*/

        // this.content_html = await this.getContentHtml()

        // await this.parseClassFromDoc(this.content_html)
        return JSON.stringify({
            class: classes,
            filters: filterObj,
        });
    }

    async category(inReq, _outResp) {
        const tid = inReq.body.id;
        let pg =inReq.body.page;
        const extend = inReq.body.filters;
        if (pg <= 0) pg = 1;

        let videos = [];

        // let tap_elemets = this.content_html(this.content_html("[id=\"app\"]")[0]).find("van-tab")
        let $ = load(this.siteHtml)
        let tap_elemets = $($("[id=\"app\"]")[0]).find("van-tab")
        
        // this.vodList = await this.parseVodShortListFromDoc(tap_elemets[parseInt(tid)])

        let vod_list = []
        // let elements = tap_elemets[parseInt(tid)].find("a")
        let elements = $(tap_elemets[parseInt(tid)]).find("a");
        for (const element of elements) {

            videos.push({
                vod_id: element.attribs["href"],
                vod_name: $(element).text().split(".").slice(-1)[0],
                // vod_pic: pic,
                // vod_remarks: $(item).find('.module-item-text').first().text(),
                vod_pic: "https://inews.gtimg.com/newsapp_bt/0/13263837859/1000",
                vod_remarks: $(element).text().split(".").slice(-1)[0],
            });
        }

        const hasMore = $('ul.hl-page-wrap > li > a > span.hl-hidden-xs:contains(下一页)').length > 0;
            const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
            return JSON.stringify({
                page: parseInt(pg),
                pagecount: pgCount,
                limit: 72,
                total: this.count,
                list: videos,
            });
        
/*

        let html = await this.request('https://aiyingshis.com/vodshow/id/' + tid + '.html')
        if (!_.isEmpty(html)) {
            let $ = load(html)
            let items = $('.module-item');
            
            for (const item of items) {
                let oneA = $(item).find('.module-item-cover .module-item-pic a').first();
                let pic = $(item).find('.module-item-cover .module-item-pic img').first().attr('data-src')
                if (pic.indexOf("img.php?url=") > 0) {
                    pic = pic.split("img.php?url=")[1]
                }else if (pic.indexOf("https:") === -1 && pic.indexOf("http:") === -1){
                    pic = "https:" + pic
                }
                videos.push({
                    vod_id: oneA.attr('href'),
                    vod_name: oneA.attr('title'),
                    vod_pic: pic,
                    vod_remarks: $(item).find('.module-item-text').first().text(),
                });
            }
            
            let total = this.getStrByRegex(/\$\("\.mac_total"\)\.text\('(\d+)'\)/, html)
            this.limit = 72;
            if (total.length > 0) {
                this.total = parseInt(total)
            }
            if (this.total <= this.limit) {
                this.count = 1
            } else {
                this.count = Math.ceil(this.total / this.limit)
            }

            
        }*/
    }

    async getAliUrl(id) {
        let url = this.siteUrl + id.replace("/s/", "/cv/")
        let headers = this.getSearchHeader(url)
        let content = await req(url,{postType:"get",headers:headers,redirect:2})
        // await this.jadeLog.debug(`回复内容为:${JSON.stringify(content)}`)
        // let url = await this.fetch(this.siteUrl + id.replace("/s/", "/cv/"), null, headers, true)
        // return content.headers.location
        return content.request._redirectable._currentUrl;
    }


    async detail(inReq, _outResp) {
        
        const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
        const videos = [];
    
        for (let id of ids) {
            if (id.indexOf("search") > -1) {
                let url = this.siteUrl + "/search"
                let params = {"k":decodeURIComponent(id.split("search?k=").slice(-1)[0]) }

                let data = Utils.objectToStr(params)
                if (!_.isEmpty(data)) {
                    url = url + "?" + data
                }

                let html = await this.request(url)
                if (!_.isEmpty(html)) {
                    let $ = load(html)
                    let vod_list = await this.parseVodShortListFromDocBySearch($)
                    if (vod_list.length > 0) {
                        id = vod_list[0]["vod_id"]
                    } else {
                        id = ""
                    }
                }
            }
            if (!_.isEmpty(id)) {
                let obj = JSON.parse(id)
                // this.vodDetail = await this.parseVodDetailfromJson(json_content)
                let vodDetail = {};
                vodDetail.vod_name = obj["name"]
                vodDetail.vod_remarks = obj["remarks"]
                let ali_url = await this.getAliUrl(obj["id"])
                // await this.jadeLog.debug(`阿里分享链接为:${ali_url}`)
                if (!_.isEmpty(ali_url)) {


                    let p = await  this.panDetail(ali_url);
                    vodDetail.vod_play_from = p.play_from;
                    vodDetail.vod_play_url = p.play_url;


                    // let aliVodDetail = await detailContent([ali_url])
                    // vodDetail.vod_play_url = aliVodDetail.vod_play_url
                    // vodDetail.vod_play_from = aliVodDetail.vod_play_from
                }
                videos.push(vodDetail);
            }
        }
        
        return {
            list: videos,
        };
    }

    async parseVodShortListFromDocBySearch($) {
        let elements = $($($("[id=\"app\"]")[0]).find("van-row")).find("a")
        let vod_list = []
        for (const element of elements) {
            let id = element.attribs["href"]
            let matches = id.match(/(\/s\/[^"])/);
            if (!_.isEmpty(matches) && id.indexOf("https") === -1) {
                let text = $(element).text().replaceAll("\n", "").replaceAll(" ", "")
                if (text.indexOf("时间") > -1 && text.indexOf("文件夹") > -1) {
                    let textList = text.split("时间")
                    let vodShort = {};
                    vodShort.vod_name = textList[0]
                    vodShort.vod_remarks = textList[1].split("格式")[0].replaceAll(":", "").replaceAll(" ", "").replaceAll("﻿", "").replaceAll(" ", "")
                    vodShort.vod_id = JSON.stringify({
                        "name": vodShort.vod_name, "remarks": vodShort.vod_remarks, "id": id
                    })
                    vod_list.push(vodShort)
                }
            }
        }
        return vod_list
    }

    async play8888(inReq, _outResp) {
        const id = inReq.body.id;
        let link = this.siteUrl + id;
        let html = await this.request(link)
        if (!_.isEmpty(html)){
            let player_str = this.getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/,html)
            let play_dic = JSON.parse(player_str)
            let playUrl = play_dic["url"]

            let noAdurl = await super.stringify({
                request: inReq,
                parse: 0,
                site: link,
                url: playUrl,
            });
    
            return {
                parse: 0,
                url: noAdurl,
            };
        }
    }

    async search(wd, quick) {
        return {}
    }

    async setSearch(wd, quick) {
        let url = this.siteUrl + "/search"
        let params = {"k": wd}
        let html = await this.fetch(url, params, this.getHeader())
        if (!_.isEmpty(html)) {
            let $ = load(html)
            this.vodList = await this.parseVodShortListFromDocBySearch($)
        }
    }

    async setPlay(flag, id, flags) {
        let playObjStr = await playContent(flag, id, flags);
        this.playUrl = JSON.parse(playObjStr)["url"]
    }
}

let spider = new AlipansouSpider()

const routeHandlers = ['init', 'home', 'category', 'detail', 'play', 'search', 'test'];

const routes = {
    meta: {
        key: spider.getJSName(), name: spider.getName(), type: spider.getType(),
    }, 
    api: async (fastify) => {
        for (const handler of routeHandlers) {
            fastify.post(`/${handler}`, async (inReq, _outResp) => {
                return await spider[handler](inReq, _outResp);
            });
        }
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', async (inReq, _outResp) => {
            return await spider.panProxy(inReq, _outResp);
        });
        fastify.get('/test', async (inReq, _outResp) => {
            return await spider.test(inReq, _outResp);
        });
    },
};

export default routes;