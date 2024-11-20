import pkg from 'lodash';
import * as HLS from 'hls-parser';
const {
    _
} = pkg;
import req from '../../util/req.js';

//import sharp from 'sharp';
import { load } from 'cheerio';
import _url from "url";
import _fs from 'fs';
import _axios from 'axios';
let url = "https://netflav5.com";
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1",
    cookie = {};
async function request(reqUrl, referer, mth, data) {
    //  console.log(referer.data);
    var headers = {
            "User-Agent": UA,
            "X-CLIENT": "open",
            Cookie: _.map(cookie, (value, key) => key + "=" + value)
                .join(";")
        },
        referer = (referer && (headers.referer =referer), await req(reqUrl, {
            method: mth || "get",
            headers: headers,
            data: data,
            postType: "post" === mth ? "form" : ""
        }));
    return referer.data
}

const cacheRoot = (process.env['NODE_PATH'] || '.') + '/netflav_cache';

async function init(inReq, _outResp) {
    url = inReq.server.config.netflav.url;
    fs.access(cacheRoot, fs.constants.F_OK, (err) => {
        if (err) {
            // 目录不存在，创建目录
            fs.mkdir(cacheRoot, {
                recursive: true
            }, (mkdirErr) => {
                if (mkdirErr) {
                    console.error(mkdirErr);
                } else {
                    console.log('Directory created!');
                }
            });
        } else {
            console.log('Directory already exists.');
        }
    });

    return {};
}

async function home(inReq, _outResp) {
    let result = {};
    let classes = [];
    let fenleis = "首页推荐&有碼影片&無碼影片&中文字幕&女優&类别".split("&");
    let fenleisval = "/&/censored&/uncensored&/chinese-sub&/actress&/genre".split("&");
    for (let i = 0; i < fenleis.length; i++) {
        let fenjson = {
            type_id: fenleisval[i],
            type_name: fenleis[i],
            type_flag: 2,

        }

        if (fenleisval[i] != "/actress"&&fenleisval[i] !="/genre") {
            fenjson.land = 1.0;
        }
        classes.push(fenjson);
    }
    result.class = classes;
    return result;

}



async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    return categoryContentImpl(tid, pg, extend,inReq);

}


async function categoryContentImpl(tid, pg, extend,inReq) {
    let webUrl = url + tid;
    if (tid.startsWith("http")) {
        webUrl = tid;
    }
    if (extend) {
        if (extend.path!=undefined) {
            console.log(extend)
            let path = extend.path;
            delete extend.path;
            console.log(extend)
            if (path.startsWith(url)) {
                webUrl = path;
            } else {
                webUrl += path;
            }
        }
    }
    if (tid.indexOf("video") < 0) {
        if (pg > 1) {
            if (webUrl.indexOf("?") > -1) {
                webUrl += "&page=" + pg;
            } else {
                webUrl += "?page=" + pg;
            }

        }
    }

    if (extend) {
        for (let key in extend) {
            if (extend[key]!=undefined) {
                let value =extend[key];
                if (webUrl.indexOf("?") < 0) {
                    webUrl += "?";
                }
                if (!webUrl.endsWith("?")) {
                    webUrl += "&" + key + "=" + value;
                } else {
                    webUrl += key + "=" + value;
                }
            }
        }
    }
    const html = await request(webUrl, url);
    const $ = load(html);
    let result = getVideos($,inReq);
    if (!result["total"] || result["total"] == 0) {
        if ("/" == (tid) || "/categories/" == (tid)) {
            result.page = pg;
            result.pagecount = 1;
            result.limit = result.list.length;
            result.total = result.list.length;

        } else {
            result.page = pg;
            result.pagecount = 999;
            result.limit = result.list.length;
            result.total = 999*result.limit;
        }
    }
    return result;

}

function getVideos($,inReq) {
    const result = {};
    let allVideos = [];
    const data = $("#__NEXT_DATA__")
        .html();
    const netflavData = JSON.parse(data);


    if (netflavData.page.indexOf("/genre") > -1) {
        const videos = getCategoriesVideos($);
        for (let vod of videos) {
            vod.circle = 1;
            vod.ratio = 1.0;
        }
        if (videos != null) {
            allVideos=allVideos.concat(videos);
        }
        result.page = 1;
        result.pagecount = 1;
        result.limit = videos.length;
        result.total = videos.length;
    }
    const initialState = netflavData.props.initialState;

    const videoPage = getVideoPage(initialState);

    if (videoPage != null) {
        const videos = getVideosByPage(videoPage);
        if (videos != null) {
            for (let vod of videos) {
                vod.land=1.0;
                vod.ratio=1.49;
            }
            // if (netflavData.page.indexOf("/uncensored") > -1) {
            //     for (let vod of videos) {
            //         vod.land=1.0;
            //         vod.ratio=1.49;
            //     }
            // }else {
            //     for (let vod of videos) {
            //         let cover = vod.vod_pic;
            //         if(cover!=undefined&&cover!=""){
            //             cover= inReq.server.address()
            //                 .dynamic + inReq.server.prefix + '/proxy/img?img=' + encodeURIComponent(cover);
            //             vod.vod_pic = cover;
            //         }
            //     }
            // }
            allVideos=allVideos.concat(videos);
        }
        result.page = videoPage.page;
        result.pagecount =999;
        result.limit = videoPage.limit;
        result.total = 999*result.limit;
    }

    const actressPage = getActressPage(initialState);
    if (actressPage != null) {
        const videos = getModelVideos(actressPage);
        if (videos != null) {
            for (let vod of videos) {
                vod.circle = 1;
                vod.ratio = 1.0;
            }
            allVideos=allVideos.concat(videos);
        }
        result.page = parseInt(actressPage.page);
        result.pagecount = actressPage.pages;
        result.limit = actressPage.limit;
        result.total = actressPage.total;
    }

    const videoData = initialState.video;
    if (videoData != null && videoData.data != null) {
        const video = videoData.data;
        console.log(videoData)
        const videos = getVideosByVideo(video);
        for (let vod of videos) {
            vod.land=1.0;
            vod.ratio=1.49;
        }
        // if(!video.category=="無碼"){
        //     for (let vod of videos) {
        //         let cover = vod.vod_pic;
        //         if(cover!=undefined&&cover!=""){
        //             cover= inReq.server.address()
        //                 .dynamic + inReq.server.prefix + '/proxy/img?img=' + encodeURIComponent(cover);
        //             vod.vod_pic = cover;
        //         }
        //     }
        // }
        if (videos != null) {
            allVideos=allVideos.concat(videos);
        }
        result.page = 1;
        result.pagecount = 1;
        result.limit = videos.length;
        result.total = videos.length;

    }


    for (let vod of allVideos) {
        if ("folder" == vod.vod_tag && vod.cate == null) {
            vod.cate = {
                land:1.0,
                page: 1,
                pagecount: 1,
                limit: 0,
                total: 0,
                class: [],
                list: [],
                filters: {}
            };
        }
        let cover = vod.vod_pic;
        if(cover!=undefined&&cover!=""){
            cover= inReq.server.address()
                .dynamic + inReq.server.prefix + '/proxy/img?img=' + encodeURIComponent(cover);
            vod.vod_pic = cover;
        }


    }
    result.list = allVideos;
    result.parse= 0;
    result.jx=0;
    return result;
}

function getCategoriesVideos($) {
    const videos = [];
    const list = $(".genre_item");
    for (let i = 0; i < list.length; i++) {
        let vod = {
            vod_id: list[i].attribs.href,
            vod_tag: "folder",
            vod_name: $(list[i]).text(),
            vod_pic: "",
            size: 0
        };
        videos.push(vod);
    }



    //  vod = {
    //     vod_id: 1,
    //     vod_tag: "folder",
    //     vod_name: $(list[0]).text(),
    //     size: 0
    // };
    // videos.push(vod);
    // for (let i = 0; i < list.length; i++) {
    //     const item = list.get(i);
    //     const title = $(item)
    //         .text();
    //
    //     const id = item.attribs.href;
    //     let vod = {
    //         vod_id: id,
    //         vod_tag: "folder",
    //         vod_name: title,
    //         size: 0
    //     };
    //
    //     videos.push(vod);
    // }
    return videos;
}

function getHost(url) {
    return new URL(url)
        .host;
}
function getBase(url){
    let u= new URL(url);
    return u.protocol+"//"+u.host;
}


function getVideosByVideo(video) {
    const videos = [];

    let cover = video.preview;
    if (cover == undefined) {
        cover = video.previewImagesUrl;
    }

    const title = video.title;
    let vod = {
        vod_tag: "file",
        vod_name: title,
        vod_pic: cover
    };

    const src = video.src;
    vod.vod_id = src;
    vod.vod_remarks = getHost(src);
    videos.push(vod);
    for (let i = 0; i < video.srcs.length; i++) {
        let src1 = video.srcs[i];
        if (src == src1) {
            continue;
        }
        let v = {
            vod_tag: "file",
            vod_name: title,
            vod_pic: cover
        };
        v.vod_id = src1;
        v.vod_remarks = getHost(src1);
        videos.push(v);
    }
    for (let i = 0; i < video.magnets.length; i++) {
        const magnet = video.magnets[i];
        let v = {
            vod_tag: "file",
            vod_name: title,
            vod_pic: cover
        };
        v.vod_id = magnet.src;
        v.vod_remarks = magnet.title;
        videos.push(v);
    }
    return videos;
}

function getModelVideos(actressPage) {

    let videos = [];
    for (let i = 0; i < actressPage.docs.length; i++) {
        let item = actressPage.docs[i];

        let cover = item.icon;
        let title = item.name;
        let remarks = item.type + ":" + item.videoCount + "";;
        let id = "/all?actress=" + item.name;
        let v = {};
        v.vod_tag = "folder";
        v.vod_id = id;
        v.vod_name = title;
        v.vod_pic = cover;
        v.vod_remarks = remarks;
        videos.push(v);
    }
    return videos;

}

function getVideosByPage(videoPage) {
    let videos = [];
    for (let i = 0; i < videoPage.docs.length; i++) {
        let item = videoPage.docs[i];

        let cover = item.preview;
        if (cover == undefined) {
            cover = item.previewImagesUrl;
        }

        let title = item.title;
        let remarks = item.sourceDate;
        let id = "/video?id=" + item.videoId;
        let v = {};
        v.vod_tag = "folder";
        v.vod_id = id;
        v.vod_name = title;
        v.vod_pic = cover;
        v.vod_remarks = remarks;
        videos.push(v);
    }
    return videos;
}

function getActressPage(initialState) {
    if (initialState.actress != null && initialState.actress.total != null) {
        return initialState.actress;
    }
    if (initialState.censoredActress != null && initialState.censoredActress.total != null) {
        return initialState.censoredActress;
    }
    if (initialState.uncensoredActress != null && initialState.uncensoredActress.total != null) {
        return initialState.uncensoredActress;
    }

    return null;
}

function getVideoPage(initialState) {
    if (initialState.all != null && initialState.all.total != null) {
        return initialState.all;
    }
    if (initialState.censored != null && initialState.censored.total != null) {
        return initialState.censored;
    }
    if (initialState.uncensored != null && initialState.uncensored.total != null) {
        return initialState.uncensored;
    }
    if (initialState.chinese != null && initialState.chinese.total != null) {
        return initialState.chinese;
    }
    if (initialState.trending != null && initialState.trending.total != null) {
        return trending.all;
    }
    if (initialState.recent != null && initialState.recent.total != null) {
        return initialState.recent;
    }
    if (initialState.bookmark != null && initialState.bookmark.total != null) {
        return initialState.bookmark;
    }
    if (initialState.share != null && initialState.share.total != null) {
        return initialState.share;
    }

    return null;
}

async function detail(inReq, _outResp) {

    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;

    for (const id of ids) {
        let data = analysis(id)
        return data;
    }
}
async function analysis(id) {
    const webUrl = decodeURIComponent(id);
    if(webUrl.indexOf("mmfl")>-1||webUrl.indexOf("netflavns")>-1 ||webUrl.indexOf("mmsw")>-1){
        return detailContentM3u8(webUrl);
    }
    if(webUrl.indexOf("d0000d")>-1 ||webUrl.indexOf("dooood.com")>-1){
        return detailContentPass5(webUrl);
    }

    if(webUrl.indexOf("javtiktoker.com")>-1){
        return detailContentSelf(webUrl);
    }
    return detailContentM3u8(webUrl);
}

 async function  detailContentSelf(webUrl) {
     let  videos =[];
     let titles = [];
     let links = [];

     titles.push(getHost(webUrl))
     links.push("立即播放$" + realurl)
     videos.push({
         vod_tag: "file",
         vod_id: webUrl.toString(),
         type_name: "h5",
         vod_play_from: titles.join("$$$"),
         vod_play_url: links.join("$$$"),
     });

     return {
         list: videos,
     };
}


async function  detailContentPass5( webUrl) {
    const html = await request(webUrl, url);
    webUrl =webUrl.replace("dooood","d0000d");
    let pass = html.substring(html.indexOf("/pass_md5"),html.length);
    pass = pass.substring(0,pass.indexOf("'"));
    pass = getBase(webUrl)+pass;

    let token =html.substring(html.indexOf("token=")+6,html.length);
    token=token.substring(0,token.indexOf("&"));
    console.log(webUrl)
    let realurl = await request(pass, webUrl);
    realurl+= makePlay(token);
    let  videos =[];

    let titles = [];
    let links = [];

    titles.push(getHost(webUrl))
    links.push("立即播放$" + realurl)
    videos.push({
        vod_tag: "file",
        vod_id: webUrl.toString(),
        type_name: "h5",
        vod_play_from: titles.join("$$$"),
        vod_play_url: links.join("$$$"),
    });

    return {
        list: videos,
    };

}

function  makePlay( token) {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const n = t.length;
    let a = "";
    for (let  o = 0; 10 > o; o++) {
        const index =Math.floor(Math.random() * n);
        a += t.charAt(index);
    }
    return a + "?token="+token+"&expiry=" +Date.now();
};


async function detailContentM3u8(webUrl) {
    const html = await request(webUrl, url);
    console.log(html)
    let m3u8 = html.substring(html.indexOf("sources: [{file:\"") + 17, html.indexOf("\"}],"));
    console.log(m3u8)
    let titles = [];
    let links = [];
    let allm3u8 = await request(m3u8);
    let m3u8array = allm3u8.split("\n");
    let host = m3u8.substring(0, m3u8.indexOf("master"));
    let tem=[];
    for (let i = 0; i < m3u8array.length; i++) {
        let m3u8title = m3u8array[i];
        if (m3u8title.startsWith("#EXT-X-STREAM-INF")) {
            if (m3u8array.length >= i + 1) {
                let m3u8link = m3u8array[i + 1];
                if (!m3u8link.startsWith("#")) {
                    i++;
                    m3u8link = host + m3u8link;
                    let resolution = m3u8title.substring(m3u8title.indexOf("RESOLUTION=") + 11);
                    resolution = resolution.substring(0, resolution.indexOf(","));
                   // titles.push(resolution);
                  //  links.push("立即播放$" + m3u8link);
                    tem.push({
                        index:resolution.split("x")[0],
                        link:resolution+"$"+m3u8link
                    })
                }
            }
        }
        tem.sort((a, b) => b.index - a.index);
    }
    for(let  link of tem){
        links.push(link.link)
    }
    let videos = [];

    videos.push({
        vod_tag: "file",
        vod_id: webUrl.toString(),
        type_name: "m3u8",
        vod_play_from: "m3u8",
        vod_play_url: links.join("#"),
    });

    return {
        list: videos,
    };

}


async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return {
        parse: 0,
        url: inReq.server.address()
            .dynamic + inReq.server.prefix + '/proxy/hls/' + encodeURIComponent(id) + '/.m3u8',
    };
}

async function pipeImg(jpegStream,output){
    jpegStream.pipe(output);
    return new Promise((resolve, reject) => {
        jpegStream.on('error', reject);
        output.on('error', reject);
        output.on('finish', resolve);
    });

}

async function proxyimg(inReq, outResp) {
    const query = _url.parse(inReq.url, true)
        .query;
    const imgurl = decodeURIComponent(query.img);


    const imgarray = imgurl.split("/");
    const fileName = imgarray[imgarray.length - 1];
    const cacheFileName = "extract_" + fileName;
    const cacheFilePath = cacheRoot+"/" + cacheFileName;
    const srcFilePath = cacheRoot+"/" + fileName;
    if (!_fs.existsSync(srcFilePath)) {
        const res = await _axios.get(imgurl, {
            responseType: 'arraybuffer', // 特别注意，需要加上此参数
        });
        if(res.data!=undefined){
            _fs.writeFileSync(srcFilePath,res.data)
        }
    }
    const stream = _fs.readFileSync(srcFilePath);

    outResp.header('Content-Type', 'image/jpeg');
    // 将图片内容作为响应返回
    outResp.send(stream);
    // const imgarray = imgurl.split("/");
    // const fileName = imgarray[imgarray.length - 1];
    // const cacheFileName = "extract_" + fileName;
    // const cacheFilePath = cacheRoot+"/" + cacheFileName;
    // const srcFilePath = cacheRoot+"/" + fileName;
    // if (!_fs.existsSync(cacheFilePath)) {
    //     const res = await _axios.get(imgurl, {
    //         responseType: 'arraybuffer', // 特别注意，需要加上此参数
    //     });
    //     _fs.writeFileSync(srcFilePath,res.data)
    //
    //     // const image = await loadImage(srcFilePath);
    //     // let _height = image.height;
    //     // let _width = image.height * 379 / 538;
    //     // let x_start = image.width - _width;
    //     // let y_start = 0;
    //     // const canvas = createCanvas(_width, _height);
    //     // const context = canvas.getContext('2d');
    //     // context.drawImage(image, x_start, y_start, _width, _height, 0, 0, _width, _height);
    //     // const output = _fs.createWriteStream(cacheFilePath);
    //     // const jpegStream = canvas.createJPEGStream({ quality: 100 });
    //     // await pipeImg(jpegStream,output)
    //
    //     const sharpTool = new sharp(res.data);
    //     const metadata = await sharpTool.metadata();
    //     let _height = metadata.height;
    //     let _width = metadata.height * 379 / 538;
    //     let x_start = metadata.width - _width;
    //     let y_start = 0;
    //     await sharpTool.extract({
    //         left: x_start,
    //         top: y_start,
    //         width: _width,
    //         height: _height
    //     }).toFile(cacheFilePath);
    // }
    // const stream = _fs.readFileSync(cacheFilePath);
    // 设置 Content-Type 为图片类型（这里假设是 JPEG）
    // outResp.header('Content-Type', 'image/jpeg');
    // // 将图片内容作为响应返回
    // outResp.send(stream);

}

async function proxy(inReq, outResp) {
    const what = inReq.params.what;
    const purl = decodeURIComponent(inReq.params.ids);
    if (what == 'hls') {
        const resp = await req(purl, {
            method: 'get',
        });
        const plist = HLS.parse(resp.data);
        if (plist.variants) {
            for (const v of plist.variants) {
                if (!v.uri.startsWith('http')) {
                    v.uri = new URL(v.uri, purl)
                        .toString();
                }
            }
            plist.variants.map((variant) => {
                variant.uri = inReq.server.prefix + '/proxy/hls/' + encodeURIComponent(variant.uri) + '/.m3u8';
            });
        }
        if (plist.segments) {
            for (const s of plist.segments) {
                if (!s.uri.startsWith('http')) {
                    s.uri = new URL(s.uri, purl)
                        .toString();
                }
                if (s.key && s.key.uri && !s.key.uri.startsWith('http')) {
                    s.key.uri = new URL(s.key.uri, purl)
                        .toString();
                }
            }
            plist.segments.map((seg) => {
                seg.uri = inReq.server.prefix + '/proxy/ts/' + encodeURIComponent(seg.uri) + '/.ts';
            });
        }
        const hls = HLS.stringify(plist);
        let hlsHeaders = {};
        if (resp.headers['content-length']) {
            Object.assign(hlsHeaders, resp.headers, {
                'content-length': hls.length.toString()
            });
        } else {
            Object.assign(hlsHeaders, resp.headers);
        }
        delete hlsHeaders['transfer-encoding'];
        delete hlsHeaders['cache-control'];
        if (hlsHeaders['content-encoding'] == 'gzip') {
            delete hlsHeaders['content-encoding'];
        }
        outResp.code(resp.status)
            .headers(hlsHeaders);
        return hls;
    } else {
        outResp.redirect(purl);
        return;
    }
}



async function search(inReq, _outResp) {
    // wd, quick
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;

    let data = (await request(url + "?wd=" + wd));

    let videos = [];
    // for (const vod of data.data) {
    for (const vod of data.list) {
        videos.push({
            vod_id: vod.vod_id,
            vod_name: vod.vod_name,
            vod_pic: vod.vod_pic,
            vod_remarks: vod.vod_content,
        });
    }
    return JSON.stringify({
        page: page,
        list: videos,
    });
    // return request(url + "?wd=" + wd)
}

async function test(inReq, outResp) {
    try {
        const printErr = function(json) {
            if (json.statusCode && json.statusCode == 500) {
                console.error(json);
            }
        };
        const prefix = inReq.server.prefix;
        const dataResult = {};
        let resp = await inReq.server.inject()
            .post(`${prefix}/init`);
        dataResult.init = resp.json();
        printErr(resp.json());
        resp = await inReq.server.inject()
            .post(`${prefix}/home`);
        dataResult.home = resp.json();
        printErr("" + resp.json());
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject()
                .post(`${prefix}/category`)
                .payload({
                    id: dataResult.home.class[0].type_id,
                    page: 1,
                    filter: true,
                    filters: {},
                });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
                resp = await inReq.server.inject()
                    .post(`${prefix}/detail`)
                    .payload({
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
        resp = await inReq.server.inject()
            .post(`${prefix}/search`)
            .payload({
                wd: '暴走',
                page: 1,
            });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        return {
            err: err.message,
            tip: 'check debug console output'
        };
    }

}

export default {
    meta: {
        key: 'netflav',
        name: '🟡 妳妃',
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
        fastify.get('/proxy/:what/:ids/:end', proxy);
        fastify.get('/proxy/img', proxyimg);
    },
};