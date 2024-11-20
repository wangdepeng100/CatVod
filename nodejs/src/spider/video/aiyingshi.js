//import { Spider } from "../spider.js";
import req from '../../util/req.js';
import { load } from 'cheerio';
import { MAC_UA } from '../../util/misc.js';
import pkg from 'lodash';
const { _ } = pkg;
import axios from 'axios';

let siteUrl ='https://aiyingshis.com';
let cookie = '';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': UA,
        },
    });
    return res.data;
}


async function init(inReq, _outResp) {
    return{}
}

    async function home(inReq, _outResp) {
        let classes = [{"type_id":37,"type_name":"蓝光片库"},{"type_id":1,"type_name":"电影片库"},{"type_id":2,"type_name":"连续剧片库"},{"type_id":3,"type_name":"综艺片库"},{"type_id":4,"type_name":"动漫片库"}];
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

        // let reqUrl = await this.getCateUrl(tid,pg,extend)
        let html = await request('https://aiyingshis.com/vodshow/id/' + tid + '.html')
        if (!_.isEmpty(html)) {
            let $ = load(html)
            let items = $('.module-item');
            let videos = [];
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
            
            let total = videos.length;
            let limit = 72;
            let count = '';
            if (total.length > 0) {
                total = parseInt(total)
            }
            if (total <= limit) {
                 count = 1
            } else {
                 count = Math.ceil(total / limit)
            }

            const hasMore = $('ul.hl-page-wrap > li > a > span.hl-hidden-xs:contains(下一页)').length > 0;
            const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
            return JSON.stringify({
                page: parseInt(pg),
                pagecount: pgCount,
                limit: 72,
                total: count,
                list: videos,
            });
        }
    }

    async function detail(inReq, _outResp) {
        
        const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
        const videos = [];  
        for (const id of ids) {       
            let html = await request(siteUrl + id);
            // if (!_.isEmpty(html)) {
            let $ = load(html)

            /*
            let vod = {
                vod_name: data.title,
                vod_pic: data.image,
                type_name: data.video_type,
                vod_year: data.year,
                vod_remarks: data.score,
                vod_content: data.content,
            };*/

            let vodDetail = {};
            vodDetail.vod_name = $('.page-title')[0].children[0].data
            vodDetail.vod_pic =  $($("[class=\"video-cover\"]")).find(".lazyload")[0].attribs["data-src"]
            let video_info_list = $($(".video-info-aux")).text().replaceAll("\t","").split("\n")
            let type_list = []
            for (const video_info of video_info_list){
                if (!_.isEmpty(video_info.replaceAll(" ","").replaceAll("/",""))){
                    type_list.push(video_info.replaceAll(" ","").replaceAll("/",""))
                }
            }
            vodDetail.type_name = type_list.slice(0,2).join("*")
            let video_items = $("[class=\"video-info-items\"]")
            vodDetail.vod_director = $(video_items[0]).find("a")[0].children[0].data
            let vidoe_info_actor_list = $(video_items[1]).find("a")
            let actor_list = []
            for (const vidoe_info_actor of vidoe_info_actor_list) {
                actor_list.push(vidoe_info_actor.children[0].data)
            }
            vodDetail.vod_actor = actor_list.join(" * ")
            vodDetail.vod_year = type_list[2]
            vodDetail.vod_remarks = $($(video_items[3]).find(".video-info-item")).text()
            vodDetail.vod_content = $($(video_items[5]).find(".video-info-item")).text()
            vodDetail.vod_area = type_list[3]
            vodDetail.vod_content = vodDetail.vod_content.replace("[收起部分]", "").replace("[展开全部]", "").replaceAll("\t","").replaceAll("\n","")
    
            let playElements = $($("[class=\"module-tab-content\"]")[0]).find("span")
            let urlElements = $("[class=\"module-list module-player-list tab-list sort-list \"]")
            let form_list = []
            for (const playerElement of playElements){
                form_list.push($(playerElement).text())
            }
            let play_url_list = []
            for (const urlElement of urlElements){
                let playUrlElements = $($(urlElement).find("[class=\"sort-item\"]")).find("a")
                let vodItems = []
                for (const playUrlElement of playUrlElements){
                    let name = $(playUrlElement).text()
                    let url = playUrlElement.attribs["href"]
                    let play_url = name + "$" + url
                    vodItems.push(play_url)
                }
                play_url_list.push(vodItems.join("#"))
            }
            vodDetail.vod_play_from = form_list.join('$$$');
            vodDetail.vod_play_url = _.values(play_url_list).join('$$$');

            videos.push(vodDetail);
        }
        
        return {
            list: videos,
        };
    }

    function parseVodShortListFromDocBySearch(html) {
        const $ = load(html);
        let items = $('.module-search-item');
        let vod_list = [];
        items.each(function() {
            let vodShort = {};
            vodShort.vod_id = $(this).find(".video-serial").attr('href');
            vodShort.vod_name = $(this).find(".video-serial").attr('title');
            vodShort.vod_pic = $(this).find(".module-item-pic > img").data('src');
            vodShort.vod_remarks = '';
            vod_list.push(vodShort);
        });
        return vod_list;
    }


    async function play(inReq, _outResp) {
        const id = inReq.body.id;
        console.log('dddd:...' + id);
        let html = await request(siteUrl + id)
        let $ = load(html);
        let json = $('script:contains(player_aaaa)').text().replace('var player_aaaa=','');
        let js = JSON.parse(json);      
        let playUrl = js["url"]
            return {
                parse: 0,
                url: playUrl,
            };
        }
    

    async function search(inReq, _outResp) {
        const wd = inReq.body.wd;
        let pg = inReq.body.page;
        if (pg <= 0) pg = 1;
        let searchUrl = siteUrl + `/vodsearch/wd/${wd}.html`
        let html = await request(searchUrl, null)
        if (!_.isEmpty(html)) {
            let $ = load(html)
            let items = $('.module-search-item');
            let vod_list = [];
            items.each(function() {
                let vodShort = {};
                vodShort.vod_id = $(this).find(".video-serial").attr('href');
                vodShort.vod_name = $(this).find(".video-serial").attr('title');
                vodShort.vod_pic = $(this).find(".module-item-pic > img").data('src');
                vodShort.vod_remarks = '';
                vod_list.push(vodShort);
            });
            return {
                list:vod_list
            };
        }
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
        printErr("" + resp.json());
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list && dataResult.category.list.length > 0) {
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
            wd: '与凤行',
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
        key: 'aiyingshi',
        name: '🟢 爱影',
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