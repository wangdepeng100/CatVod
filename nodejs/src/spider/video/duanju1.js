import req from '../../util/req.js';
import { load } from 'cheerio';
import { _ } from "../../util/cat.js"
let url = 'https://www.duanju001.com';
let categories = [];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            "User-Agent": UA, "Referer": url + "/"
        },
    });
    return res.data;
}

async function init(inReq, _outResp) {
    return {};
}


async function home(_inReq, _outResp) {
    const data = await request(url);
    let classes = [];
    let filterObj = {};
    let type_dic = {"type_id": "duanju", "type_name": "短剧"}
    classes.push(type_dic)

    for (const type_dic of classes) {
        let type_id = type_dic["type_id"]
        let homeUrl = url + `/show/${type_id}-----------.html`
        let html = await request(homeUrl);
        if (html != null) {
            let $ = load(html)
            filterObj[type_id] = await getFilter($)
        }
    }
    return {
        class: classes,
        filters: filterObj,
    };
}

async function getFilter($) {
    let elements = $("[class=\"filter\"]").slice(1)
    let extend_list = []
    for (let i = 0; i < elements.length; i++) {
        let extend_dic = {"key": (i + 1).toString(), "name": "", "value": []}
        if (i < elements.length - 1) {
            extend_dic["name"] = $($(elements[i]).find("span")[0]).text().replaceAll(":", "")
            // extend_dic["value"].push({"n": "全部", "v": ""})
            for (const ele of $(elements[i]).find("li").slice(1)) {
                if ( $(ele).text() === "全部"){
                    extend_dic["value"].push({"n": $(ele).text(), "v":""})
                }else{
                    extend_dic["value"].push({"n": $(ele).text(), "v":$(ele).text()})
                }
            }
            extend_list.push(extend_dic)
        } else {
            extend_dic["name"] = $($(elements[i]).find("span")[0]).text().replaceAll(":", "")
            extend_dic["value"] = [
                {"n": $($(elements[i]).find("a")[0]).text(), "v": "time"},
                {"n": $($(elements[i]).find("a")[1]).text(), "v": "hits"},
                {"n": $($(elements[i]).find("a")[2]).text(), "v": "score"}
            ]
            extend_list.push(extend_dic)
        }

    }
    return extend_list
}

async function getCateUrl(tid,pg,extend){
    let time = getExtend(extend["1"],"","")
    let order = getExtend(extend['2'],"","")
    return url + `/show/${tid}--${order}---------${time}.html`
}

function getExtend(value,defaultvalue,key = ""){
    if (value !== undefined && value !== "0"){
        return key + value
    }else{
        return defaultvalue
    }
}

async function parseVodShortListFromDoc($) {
    let items = $('.row').children();
    let vod_list = [];
    for (const item of items) {
        let vodShort = {};
        let oneA = $(item).find('.entry-media a').first();
        vodShort.vod_id = oneA.attr('href');
        vodShort.vod_name = oneA.attr('title');
        let pic = $(item).find('.entry-media a img').first().attr('data-src')
        vodShort.vod_pic = pic
        vodShort.vod_remarks = $(item).find('.meta-views').first().text();
        if (vodShort.vod_name !== undefined){
            vod_list.push(vodShort)
        }
    }
    return vod_list
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    const extend = inReq.body.filters || {};
    let reqUrl = await getCateUrl(tid,pg,extend)
    let html = await request(reqUrl)
    let $ = load(html)
    let vodList = await parseVodShortListFromDoc($)
    return {
        page: pg,
        list: vodList,
    };
}


async function parseVodDetailFromDoc($) {
    let vodDetail = {};
    vodDetail.vod_name = $($('.entry-title')[0]).text();
    vodDetail.vod_pic =  $($("[class=\"row\"]")).find(".lazyload")[0].attribs["data-src"]
    let video_info_list = $(".pricing-options li");

    vodDetail.type_name = $(video_info_list[0]).find("b").text()
    vodDetail.vod_director =$(video_info_list[1]).find("b").text()
    vodDetail.vod_actor = $(video_info_list[2]).find("b").text()
    vodDetail.vod_area = $(video_info_list[3]).find("b").text()
    vodDetail.vod_year = $(video_info_list[4]).find("b").text()
    vodDetail.vod_remarks = $(video_info_list[5]).find("b").text()
    vodDetail.vod_content = $(".data-label").text();

    let playElements = $("#pills-tab .nav-item").slice(1);
    let form_list = []
    for (const playerElement of playElements){
        form_list.push($(playerElement).text().replaceAll("\n", ""))
    }

    let urlElements = $("#pills-tabContent").children()
    let play_url_list = []
    for (const urlElement of urlElements){
        let playUrlElements = $($(urlElement).find(".accordion")).find("a")
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
    return vodDetail
}


async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    let videos = [];
    for (const id of ids) {
        let detailUrl = url + id;
        let html = await request(detailUrl);
        let $ = load(html)
        videos.push(await parseVodDetailFromDoc($));
    }
    return {
        list: videos,
    };
}

function getStrByRegex(pattern, str) {
    let matcher = pattern.exec(str);
    if (matcher !== null) {
        if (matcher.length >= 1) {
            if (matcher.length >= 1) return matcher[1]
        }
    }
    return "";
}
async function play(inReq, _outResp) {
    const id = inReq.body.id;
    let html = await request(url + id)
    let player_str = getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/,html)
    let play_dic = JSON.parse(player_str)
    let playUrl = play_dic["url"]
    return JSON.stringify({
        parse: 0,
        url: decodeURIComponent(playUrl),
        header: {
            'User-Agent': UA,
        },
    });
}


async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let searchUrl = url + `/search/-------------.html?wd=${wd}`
    let html = await request(searchUrl)
    let $ = load(html)
    let vodList = await parseVodShortListFromDocBySearch($)
    return {
        list: vodList,
    };
}


async function parseVodShortListFromDocBySearch($) {
    let items = $('.row');
    let vod_list = [];
    for (const item of items) {
        let vodShort = {}
        vodShort.vod_id = $(item).find(".entry-media a")[0].attribs.href;
        vodShort.vod_name = $(item).find(".entry-media a")[0].attribs.title;
        vodShort.vod_pic = $(item).find(".entry-media a img")[0].attribs['data-src']
        vodShort.vod_remarks = '';
        vod_list.push(vodShort);
    }
    return vod_list
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
        // dataResult.init = resp.json();
        // printErr(resp.json());
        resp = await inReq.server.inject().post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr(resp.json());
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {"1": "2023"},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject().post(`${prefix}/detail`).payload({
                    id: dataResult.category.list[0].vod_id, // dataResult.category.list.map((v) => v.vod_id),
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                if (dataResult.detail.list) {
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
        key: 'duanju1',
        name: '短剧001',
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
