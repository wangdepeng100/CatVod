import req from '../../util/req.js';
import CryptoJS from 'crypto-js';
import Crypto from 'crypto-js';
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;

let siteKey = "",
    siteType = 0,
    cookie = "",
    login = "",
    vip = !1,
    extendObj = {},
    bili_jct = "",
    vod_audio_id = {
        30280: 192e3,
        30232: 132e3,
        30216: 64e3
    },
    vod_codec = {
        12: "HEVC",
        7: "AVC"
    };
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36";
async function request(reqUrl, ua, buffer) {
    return (await req(reqUrl, {
        method: "get",
        headers: ua || {
            "User-Agent": UA
        },
        timeout: 6e4,
        buffer: buffer ? 1 : 0
    })).data
}
async function post(reqUrl, postData, ua, posttype) {
    return (await req(reqUrl, {
        method: "post",
        headers: ua || {
            "User-Agent": UA
        },
        data: postData,
        timeout: 6e4,
        postType: posttype
    })).data
}

function getHeaders() {
    var headers = {
        "User-Agent": UA
    };
    return _.isEmpty(cookie) || (headers.cookie = cookie), headers
}
async function getCookie() {
    var setCookieHeaders = (await req("https://www.bilibili.com", {
        method: "get",
        headers: {
            "User-Agent": UA
        },
        timeout: 6e4
    })).headers["set-cookie"];
    cookie = setCookieHeaders.map(kk => kk.split(";")[0] + ";").join("")
}
async function init(inReq, _outResp) {
    // siteKey = cfg.skey, siteType = cfg.stype;
    // let extend = cfg.ext;

    let extend = [];
    try {
        cookie = inReq.server.config.bili.cookie;
        extend = inReq.server.config.bili.categories;
    } catch (error) {
        
    }

    // cfg.ext.hasOwnProperty("categories") && (extend = cfg.ext.categories)
    /* 用简单逻辑实现
    (cookie = (cookie = cfg.ext.hasOwnProperty("cookie") ? cfg.ext.cookie : cookie).startsWith("http") ? await request(cookie) : cookie).split(";").forEach(cookie => {
        cookie.includes("bili_jct") && (bili_jct = cookie.split("=")[1])
    });*/

    if (!cookie) {

        // 如果cookie是http开头
        cookie = await request(cookie);
    }

    cookie.split(";").forEach(cookie => {
        cookie.includes("bili_jct") && (bili_jct = cookie.split("=")[1])
    });
    
    _.isEmpty(cookie) && await getCookie();

    var cfg = await request("https://api.bilibili.com/x/web-interface/nav", getHeaders()),
        cfg = (login = cfg.data.isLogin, vip = cfg.data.vipStatus, extend.split("#")),
        jsonData = [{
            key: "order",
            name: "排序",
            value: [{
                n: "综合排序",
                v: "0"
            }, {
                n: "最多点击",
                v: "click"
            }, {
                n: "最新发布",
                v: "pubdate"
            }, {
                n: "最多弹幕",
                v: "dm"
            }, {
                n: "最多收藏",
                v: "stow"
            }]
        }, {
            key: "duration",
            name: "时长",
            value: [{
                n: "全部时长",
                v: "0"
            }, {
                n: "60分钟以上",
                v: "4"
            }, {
                n: "30~60分钟",
                v: "3"
            }, {
                n: "10~30分钟",
                v: "2"
            }, {
                n: "10分钟以下",
                v: "1"
            }]
        }],
        newarr = [],
        d = {};
    newarr.push({
        type_name: "首页",
        type_id: "首页",
        land: 1,
        ratio: 1.33
    });
    for (const kk of cfg) {
        var c = {
            type_name: kk,
            type_id: kk,
            land: 1,
            ratio: 1.33
        };
        newarr.push(c), d[kk] = jsonData
    }
    _.isEmpty(bili_jct) || newarr.push({
        type_name: "历史记录",
        type_id: "历史记录",
        land: 1,
        ratio: 1.33
    }), extendObj = {
        classes: newarr,
        filter: d
    }

    return {}
}

function home(inReq, _outResp) {
    /*
    try {
        var jSONObject = {
            class: extendObj.classes
        };
        return filter && (jSONObject.filters = extendObj.filter), JSON.stringify(jSONObject)
    } catch (e) {
        return ""
    }*/
    return {
        class: extendObj.classes,
        filters: extendObj.filter,
    };
}

async function homeVod() {
    try {
        var list = [],
            response = await request("https://api.bilibili.com/x/web-interface/index/top/rcmd?ps=14&fresh_idx=1&fresh_idx_1h=1", getHeaders());
        for (const item of JSON.parse(response).data.item) {
            var vod = {};
            let imageUrl = item.pic;
            imageUrl.startsWith("//") && (imageUrl = "https:" + imageUrl);
            var cd = getFullTime(item.duration);
            vod.vod_id = item.bvid, vod.vod_name = removeTags(item.title), vod.vod_pic = imageUrl, vod.vod_remarks = cd, vod.style = {
                type: "rect",
                ratio: 1.33
            }, list.push(vod)
        }
        var result = {
            list: list
        };
        return JSON.stringify(result)
    } catch (e) {}
}

async function category(inReq, _outResp) {
    // tid, page, filter, ext
    // if (page < 1) page = 1;
    let tid = inReq.body.id;
    let page = inReq.body.page;
    let ext = inReq.body.filters;

	if(page <= 0) page = 1;

    // page < 1 && (page = 1);
    try {
        0 < Object.keys(ext).length && ext.hasOwnProperty("tid") && 0 < ext.tid.length && (tid = ext.tid);
        let url = "";
        if (url = "https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=" + encodeURIComponent(tid), 0 < Object.keys(ext).length)
            for (const k in ext) "tid" != k && (url += `&${encodeURIComponent(k)}=` + encodeURIComponent(ext[k]));
        url += "&page=" + encodeURIComponent(page), "首页" == tid ? url = "https://api.bilibili.com/x/web-interface/index/top/rcmd?ps=14&fresh_idx=" + page + "&fresh_idx_1h=" + page : "历史记录" == tid && (url = "https://api.bilibili.com/x/v2/history?pn=" + page);
        var data = await request(url, getHeaders());
        let items = data.data.result; //data.data; //data.result;
        
        "首页" == tid ? items = data.data.item : "历史记录" == tid && (items = data.data);

        var videos = [];
        for (const item of items) {
            var video = {};
            let pic = item.pic;
            pic.startsWith("//") && (pic = "https:" + pic);
            var cd = getFullTime(item.duration);
            video.vod_remarks = cd, video.vod_id = item.bvid, video.vod_name = removeTags(item.title), video.vod_pic = pic, video.style = {
                type: "rect",
                ratio: 1.33
            }, videos.push(video)
        }
        var result = {
            page: page,
            pagecount: data.numPages ?? page + 1,
            limit: videos.length,
            total: videos.length * (page + 1),
            list: videos
        };
        return JSON.stringify(result)
    } catch (e) {
        console.log(e);
    }
    return null
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (const id of ids) {
        try {
            var bvid = id,
                detailUrl = "https://api.bilibili.com/x/web-interface/view?bvid=" + bvid;
                const v = await request(detailUrl, getHeaders());
                const detailData = v.data;
                const cd = (_.isEmpty(bili_jct) || await post("https://api.bilibili.com/x/v2/history/report", {
                    aid: detailData.aid,
                    cid: detailData.cid,
                    csrf: bili_jct
                }, getHeaders(), "form"), getFullTime(detailData.duration)),
                aid = detailData.aid,
                video = {
                    vod_id: bvid,
                    vod_name: detailData.title,
                    vod_pic: detailData.pic,
                    type_name: detailData.tname,
                    vod_year: "",
                    vod_area: "",
                    vod_remarks: cd,
                    vod_actor: "",
                    vod_director: "",
                    vod_content: detailData.desc
                },
                playurldata = "https://api.bilibili.com/x/player/playurl?avid=" + aid + "&cid=" + detailData.cid + "&qn=127&fnval=4048&fourk=1";

                const t = await request(playurldata, getHeaders());
                const playurldatalist = t.data,
                accept_quality = playurldatalist.accept_quality,
                accept_description = playurldatalist.accept_description,
                qualitylist = [],
                descriptionList = [];
            for (let i = 0; i < accept_quality.length; i++) {
                if (!vip)
                    if (login) {
                        if (80 < accept_quality[i]) continue
                    } else if (32 < accept_quality[i]) continue;
                descriptionList.push(base64Encode(accept_description[i])), qualitylist.push(accept_quality[i])
            }
            var treeMap = {},
                jSONArray = detailData.pages;
            let playList = [];
            for (let j = 0; j < jSONArray.length; j++) {
                var cid = jSONArray[j].cid,
                    playUrl = j + "$" + aid + "+" + cid + "+" + qualitylist.join(":") + "+" + descriptionList.join(":");
                playList.push(playUrl)
            }
            treeMap.dash = playList.join("#"), treeMap.mp4 = playList.join("#");
            var relatedUrl = "https://api.bilibili.com/x/web-interface/archive/related?bvid=" + bvid;
            const o = await request(relatedUrl, getHeaders());
            const relatedData = o.data;
            playList = [];
            for (let j = 0; j < relatedData.length; j++) {
                const jSONObject6 = relatedData[j],
                    cid = jSONObject6.cid;
                const playUrl = jSONObject6.title + "$" + jSONObject6.aid + "+" + cid + "+" + qualitylist.join(":") + "+" + descriptionList.join(":");
                playList.push(playUrl)
            }
            treeMap["相关"] = playList.join("#"), video.vod_play_from = Object.keys(treeMap).join("$$$"), video.vod_play_url = Object.values(treeMap).join("$$$");
            
            videos.push(video);
            /*
            var result = {
                list: [video]
            };
            return JSON.stringify(result)*/
        } catch (e) {
            console.log(e)
        }
    }
    
    return {
        list: videos,
    };
}
async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const flag = inReq.body.flag;
    try {
        var playHeaders = {
                Referer: "https://www.bilibili.com",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
            },
            ids = id.split("+"),
            aid = ids[0],
            cid = ids[1],
            qualityIds = ids[2].split(":"),
            qualityName = ids[3].split(":");
        if ("dash" == flag || "相关" == flag) {
            /*
            var js2Base = await js2Proxy(!0, siteType, siteKey, "dash/", {}),
                urls = [];
            for (let i = 0; i < qualityIds.length; i++) urls.push(base64Decode(qualityName[i]), js2Base + base64Encode(aid + "+" + cid + "+" + qualityIds[i]));
            return JSON.stringify({
                parse: 0,
                url: urls,
                header: playHeaders
            })*/
        }
        if ("mp4" == flag) {
            let urls = [];
            for (let i = 0; i < qualityIds.length; i++) {
                var durl, url = `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${qualityIds[i]}&fourk=1`;
                const data = await request(url, getHeaders());
                data.data.quality == qualityIds[i] && (durl = data.data.durl[0].url, urls.push(base64Decode(qualityName[i]), durl))
            }
            return JSON.stringify({
                parse: 0,
                url: urls,
                header: playHeaders
            })
        } {
            let urls = [],
                audios = [];
            for (let i = 0; i < qualityIds.length; i++) {
                const url = `https://api.bilibili.com/x/player/playurl?avid=${aid}&cid=${cid}&qn=${qualityIds[i]}&fnval=4048&fourk=1`;
                let resp = await request(url, getHeaders());
                var dash = resp.data.dash,
                    video = dash.video,
                    audio = dash.audio;
                for (let j = 0; j < video.length; j++) {
                    var dashjson = video[j];
                    if (dashjson.id == qualityIds[i])
                        for (const key in vod_codec) dashjson.codecid == key && urls.push(base64Decode(qualityName[i]) + " " + vod_codec[key], dashjson.baseUrl)
                }
                if (0 == audios.length) {
                    for (let j = 0; j < audio.length; j++) {
                        const dashjson = audio[j];
                        for (const key in vod_audio_id) dashjson.id == key && audios.push({
                            title: _.floor(parseInt(vod_audio_id[key]) / 1024) + "Kbps",
                            bit: vod_audio_id[key],
                            url: dashjson.baseUrl
                        })
                    }
                    audios = _.sortBy(audios, "bit")
                }
            }
            return ({
                parse: 0,
                url: urls,
                extra: {
                    audio: audios
                },
                header: playHeaders
            })
        }
    } catch (e) {
        console.log(e);
    }
    return null
}

// key, quick, pg
async function search(inReq, _outResp) {
    const key = inReq.body.wd;
    let pg = inReq.body.page;
    // const extend = inReq.body.filters;

    let page = pg || 1;
    0 == page && (page = 1);
    try {
        var ext = {
                duration: "0"
            };

            const prefix = inReq.server.prefix;
            let resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: key,
                page: page,
                filter: true,
                filters: ext,
            });

            // var resp = JSON.parse(await category(key, page, !0, ext));

            let v = JSON.parse(resp.body);
            const catVideos = v.list;
            const pageCount = v.pagecount;

            // catVideos = resp.list;
            // pageCount = resp.pagecount;
            const videos = [];
        for (let i = 0; i < catVideos.length; ++i) {
            videos.push(catVideos[i]);
        } 
        var result = {
            page: page,
            pagecount: pageCount,
            land: 1,
            ratio: 1.33,
            list: videos
        };
        return result;
    } catch (e) {
        console.log(e);
    }
    return null
}

async function proxy(segments, headers) {
    var what = segments[0],
        segments = base64Decode(segments[1]);
    if ("dash" != what) return JSON.stringify({
        code: 500,
        content: ""
    }); {
        var what = segments.split("+"),
            segments = what[0],
            cid = what[1],
            str5 = what[2];
        let videoList = "",
            audioList = "";
        var what = JSON.parse(await request(`https://api.bilibili.com/x/player/playurl?avid=${segments}&cid=${cid}&qn=${str5}&fnval=4048&fourk=1`, getHeaders())),
            segments = what.data.dash,
            video = segments.video,
            audio = segments.audio;
        for (let i = 0; i < video.length; i++) {
            var dashjson = video[i];
            dashjson.id == str5 && (videoList += getDashMedia(dashjson))
        }
        for (let i = 0; i < audio.length; i++) {
            var ajson = audio[i];
            for (const key in vod_audio_id) ajson.id == key && (audioList += getDashMedia(ajson))
        }
        cid = getDash(what, videoList, audioList);
        return JSON.stringify({
            code: 200,
            content: cid,
            headers: {
                "Content-Type": "application/dash+xml"
            }
        })
    }
}

function getDashMedia(dash) {
    try {
        let qnid = dash.id;
        var audioSamplingRate, codecid = dash.codecid,
            media_codecs = dash.codecs,
            media_bandwidth = dash.bandwidth,
            media_startWithSAP = dash.startWithSap,
            media_mimeType = dash.mimeType,
            media_BaseURL = dash.baseUrl.replace(/&/g, "&amp;"),
            media_SegmentBase_indexRange = dash.SegmentBase.indexRange,
            media_SegmentBase_Initialization = dash.SegmentBase.Initialization,
            mediaType = media_mimeType.split("/")[0];
        let media_type_params = "";
        if ("video" == mediaType) {
            var media_frameRate = dash.frameRate,
                media_sar = dash.sar,
                media_width = dash.width,
                media_height = dash.height;
            media_type_params = `height='${media_height}' width='${media_width}' frameRate='${media_frameRate}' sar='${media_sar}'`
        } else if ("audio" == mediaType)
            for (const key in vod_audio_id) qnid == key && (audioSamplingRate = vod_audio_id[key], media_type_params = `numChannels='2' sampleRate='${audioSamplingRate}'`);
        return `<AdaptationSet lang="chi">
        <ContentComponent contentType="${mediaType}"/>
        <Representation id="${qnid+="_"+codecid}" bandwidth="${media_bandwidth}" codecs="${media_codecs}" mimeType="${media_mimeType}" ${media_type_params} startWithSAP="${media_startWithSAP}">
          <BaseURL>${media_BaseURL}</BaseURL>
          <SegmentBase indexRange="${media_SegmentBase_indexRange}">
            <Initialization range="${media_SegmentBase_Initialization}"/>
          </SegmentBase>
        </Representation>
      </AdaptationSet>`
    } catch (e) {}
}

function getDash(ja, videoList, audioList) {
    var duration = ja.data.dash.duration;
    return `<MPD xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="urn:mpeg:dash:schema:mpd:2011" xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 DASH-MPD.xsd" type="static" mediaPresentationDuration="PT${duration}S" minBufferTime="PT${ja.data.dash.minBufferTime}S" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">
      <Period duration="PT${duration}S" start="PT0S">
        ${videoList}
        ${audioList}
      </Period>
    </MPD>`
}

function base64Encode(text) {
    return Crypto.enc.Base64.stringify(Crypto.enc.Utf8.parse(text))
}

function base64Decode(text) {
    return Crypto.enc.Utf8.stringify(Crypto.enc.Base64.parse(text))
}

function removeTags(input) {
    return input.replace(/<[^>]*>/g, "")
}

function getFullTime(numberSec) {
    let totalSeconds = "";
    try {
        var timeParts = numberSec.split(":"),
            min = parseInt(timeParts[0]),
            sec = parseInt(timeParts[1]);
        totalSeconds = 60 * min + sec
    } catch (e) {
        totalSeconds = parseInt(numberSec)
    }
    if (isNaN(totalSeconds)) return "无效输入";
    if (3600 <= totalSeconds) return timeParts = Math.floor(totalSeconds / 3600), min = totalSeconds % 3600, timeParts + `小时 ${Math.floor(min/60)}分钟 ${min%60}秒`; {
        const minutes = Math.floor(totalSeconds / 60),
            seconds = totalSeconds % 60;
        return `${minutes}分钟 ${seconds}秒`
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
            wd: '隐形的翅膀',
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
        key: 'bili',
        name: '🟢 哔哩',
        type: 3,
    },
   api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        // fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};