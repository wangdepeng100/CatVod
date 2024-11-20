import req from '../../util/req.js';
import { load } from 'cheerio';
import * as HLS from 'hls-parser';
import * as Quark from '../../util/quark.js';
import dayjs from 'dayjs';
import pkg from 'lodash';
const { _ } = pkg;

let HOST = 'https://www.6080yy3.com';

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl) {
    let res = await req(reqUrl, {
        method: 'get',
        headers: {
            'User-Agent': UA,
            'Referer': HOST
        },
    });
    return res.data;
}


async function init(inReq, outResp) {
    await initParseMap();
    // await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
    return {}
}

let parseMap = {};

async function initParseMap() {
    const t = dayjs(new Date()).format('YYYYMMDD');
    const js = await request(HOST + '/static/js/playerconfig.js?t=' + t);
    try {
        const jsEval = js + '\nMacPlayerConfig';
        const playerList = eval(jsEval).player_list;
        const players = _.values(playerList);
        _.each(players, (item) => {
            if (_.isEmpty(item.parse)) return;
            if (item.show.includes('超清') || item.show.includes('高清')) return;
            parseMap[item.show] = item.parse;
        });
    } catch(e) {
    }
}

async function home(filter) {
    let classes = [{'type_id':1,'type_name':'电影'},{'type_id':2,'type_name':'电视剧'},{'type_id':3,'type_name':'综艺'},{'type_id':4,'type_name':'动漫'},{'type_id':63,'type_name':'纪录片'}];
    let filterObj = {
        '1':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'喜剧','v':'喜剧'},{'n':'爱情','v':'爱情'},{'n':'恐怖','v':'恐怖'},{'n':'动作','v':'动作'},{'n':'科幻','v':'科幻'},{'n':'剧情','v':'剧情'},{'n':'战争','v':'战争'},{'n':'警匪','v':'警匪'},{'n':'犯罪','v':'犯罪'},{'n':'动画','v':'动画'},{'n':'奇幻','v':'奇幻'},{'n':'武侠','v':'武侠'},{'n':'冒险','v':'冒险'},{'n':'枪战','v':'枪战'},{'n':'恐怖','v':'恐怖'},{'n':'悬疑','v':'悬疑'},{'n':'惊悚','v':'惊悚'},{'n':'经典','v':'经典'},{'n':'青春','v':'青春'},{'n':'文艺','v':'文艺'},{'n':'微电影','v':'微电影'},{'n':'古装','v':'古装'},{'n':'历史','v':'历史'},{'n':'运动','v':'运动'},{'n':'农村','v':'农村'},{'n':'儿童','v':'儿童'},{'n':'网络电影','v':'网络电影'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'中国香港','v':'中国香港'},{'n':'中国台湾','v':'中国台湾'},{'n':'美国','v':'美国'},{'n':'法国','v':'法国'},{'n':'英国','v':'英国'},{'n':'日本','v':'日本'},{'n':'韩国','v':'韩国'},{'n':'德国','v':'德国'},{'n':'泰国','v':'泰国'},{'n':'印度','v':'印度'},{'n':'意大利','v':'意大利'},{'n':'西班牙','v':'西班牙'},{'n':'加拿大','v':'加拿大'},{'n':'其他','v':'其他'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},{'key':'by','name':'排序','init':'','value':[{'n':'全部','v':''},{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '2':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'爱情','v':'爱情'},{'n':'古装','v':'古装'},{'n':'悬疑','v':'悬疑'},{'n':'都市','v':'都市'},{'n':'喜剧','v':'喜剧'},{'n':'战争','v':'战争'},{'n':'剧情','v':'剧情'},{'n':'青春','v':'青春'},{'n':'历史','v':'历史'},{'n':'网剧','v':'网剧'},{'n':'奇幻','v':'奇幻'},{'n':'冒险','v':'冒险'},{'n':'励志','v':'励志'},{'n':'犯罪','v':'犯罪'},{'n':'商战','v':'商战'},{'n':'恐怖','v':'恐怖'},{'n':'穿越','v':'穿越'},{'n':'农村','v':'农村'},{'n':'人物','v':'人物'},{'n':'商业','v':'商业'},{'n':'生活','v':'生活'},{'n':'短剧','v':'短剧'},{'n':'其他','v':'其他'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'中国香港','v':'中国香港'},{'n':'中国台湾','v':'中国台湾'},{'n':'韩国','v':'韩国'},{'n':'香港','v':'香港'},{'n':'台湾','v':'台湾'},{'n':'日本','v':'日本'},{'n':'美国','v':'美国'},{'n':'泰国','v':'泰国'},{'n':'英国','v':'英国'},{'n':'新加坡','v':'新加坡'},{'n':'其他','v':'其他'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},{'key':'by','name':'排序','init':'','value':[{'n':'全部','v':''},{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '3':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'音乐','v':'音乐'},{'n':'情感','v':'情感'},{'n':'生活','v':'生活'},{'n':'职场','v':'职场'},{'n':'真人秀','v':'真人秀'},{'n':'搞笑','v':'搞笑'},{'n':'公益','v':'公益'},{'n':'艺术','v':'艺术'},{'n':'访谈','v':'访谈'},{'n':'益智','v':'益智'},{'n':'体育','v':'体育'},{'n':'少儿','v':'少儿'},{'n':'时尚','v':'时尚'},{'n':'人物','v':'人物'},{'n':'其他','v':'其他'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'港台','v':'港台'},{'n':'韩国','v':'韩国'},{'n':'欧美','v':'欧美'},{'n':'其他','v':'其他'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},{'key':'by','name':'排序','init':'','value':[{'n':'全部','v':''},{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '4':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'冒险','v':'冒险'},{'n':'战斗','v':'战斗'},{'n':'搞笑','v':'搞笑'},{'n':'经典','v':'经典'},{'n':'科幻','v':'科幻'},{'n':'玄幻','v':'玄幻'},{'n':'魔幻','v':'魔幻'},{'n':'武侠','v':'武侠'},{'n':'恋爱','v':'恋爱'},{'n':'推理','v':'推理'},{'n':'日常','v':'日常'},{'n':'校园','v':'校园'},{'n':'悬疑','v':'悬疑'},{'n':'真人','v':'真人'},{'n':'历史','v':'历史'},{'n':'竞技','v':'竞技'},{'n':'其他','v':'其他'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'日本','v':'日本'},{'n':'韩国','v':'韩国'},{'n':'欧美','v':'欧美'},{'n':'其他','v':'其他'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},{'key':'by','name':'排序','init':'','value':[{'n':'全部','v':''},{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '63':[{'key':'by','name':'排序','init':'','value':[{'n':'全部','v':''},{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
    };

    return ({
        class: classes,
        filters: filterObj,
    });
}


async function category(inReq, outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;
    if (pg <= 0) pg = 1;
    let page = '';
    if (pg > 1) {
        page = pg;
    }
    const link = HOST + '/vodshow/' + tid + '-' + (extend.area || '') + '-' + (extend.by || '') + '-' + (extend.class || '') + '-' + (extend.lang || '') + '-' + (extend.letter || '') + '---' + page + '---' + (extend.year || '') + '.html';
    const html = await request(link);
    const $ = load(html);
    const items = $('.module-list .module-item');
    const videos = _.map(items, (item) => {
        const $item = $(item);
        const link = $item.find('.module-item-content a:first').attr('href');
        const title = $item.find('.video-name').text().trim();
        const img = $item.find('.module-item-pic img:first').attr('data-src');
        const remarks = $item.find('.module-item-text').text().trim();
        return {
            vod_id: link.replace(/.*?\/video\/(.*).html/g, '$1'),
            vod_name: title,
            vod_pic: img,
            vod_remarks: remarks || '',
        };
    });
    const hasMore = $('#page a.page-next:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    const limit = 40;
    return ({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    });
}

async function detail(inReq, outResp) {
    const id = inReq.body.id;
    const html = await request(HOST + '/video/' + id + '.html');
    let $ = load(html);
    const vod = {
        vod_id: id,
        vod_name: $('h1.page-title').text().trim(),
        vod_type: $('.video-info-aux a.tag-link:first').text().trim(),
        vod_area: $('.video-info-aux a.tag-link:eq(2)').text().trim(),
        vod_year: $('.video-info-aux a.tag-link:eq(1)').text().trim(),
        vod_director: $('.video-info-main .video-info-items:contains(导演：)').text().substring(3).trim().replace(/(^\/|\/$)/g, '').trim(),
        vod_actor: $('.video-info-main .video-info-items:contains(主演：)').text().substring(3).trim().replace(/(^\/|\/$)/g, '').trim(),
        vod_pic: $('.video-cover img:first').attr('data-src'),
        vod_remarks : $('.video-info-main .video-info-items:contains(备注：)').text().substring(3) || '',
        vod_content: $('.video-info-main .video-info-items:contains(剧情：)').text().substring(3).trim().replace(/收起$/g, ''),
    };
    /*
    const Url = $('a:contains(4K合集)').attr('href');
    console.log(Url);
    const url = await request(HOST + Url);
    $ = load(url);
        const shareUrl = $('a')
            .map((_, a) => $(a).attr('href'))
            .get();
        const froms = [];
        const urls = [];
        const videos = [];
       const shareData = Quark.getShareData(shareUrl);
                if (shareData) {
                    const videos = await Quark.getFilesByShareUrl(shareData);
                    if (videos.length > 0) {
                        froms.push('Quark-' + shareData.shareId);
                        urls.push(
                            videos
                                .map((v) => {
                                    const ids = [shareData.shareId, v.stoken, v.fid, v.share_fid_token, v.subtitle ? v.subtitle.fid : '', v.subtitle ? v.subtitle.share_fid_token : ''];
                                    return formatPlayUrl('', v.file_name) + '$' + ids.join('*');
                                })
                                .join('#'),
                       
                        );
                    }
                }
        vod.vod_play_from = froms.join('$$$');
        vod.vod_play_url = urls.join('$$$');
        videos.push(vod);
    return {
        list: videos,
    };
}
    */
    const playMap = {};
    const tabs = $('.module-player-tab .module-tab-item');
    const playlists = $('.module-player-list > .module-blocklist');
    _.each(tabs, (tab, i) => {
        const $tab = $(tab);
        const from = $tab.find('span:first').text().trim();
        if (from.includes('夸克')) return;
        let list = playlists[i];
        list = $(list).find('a');
        _.each(list, (it) => {
            const $it = $(it);
            const title = $it.find('span:first').text().trim();
            const playUrl = $it.attr('href');
            if (!playMap.hasOwnProperty(from)) {
                playMap[from] = [];
            }
            playMap[from].push(title + '$' + playUrl);
        });
    });
    vod.vod_play_from = _.keys(playMap).join('$$$');
    const url = _.values(playMap);
    const vod_play_url = _.map(url, (urlist) => {
        return urlist.join('#');
    });
    vod.vod_play_url = vod_play_url.join('$$$');
    return ({
        list: [vod],
    });
}

async function play(inReq, outResp) {
    const id = inReq.body.id;
    const flag = inReq.body.flag;
    const link = HOST + id;
    /*
    const html = await request(link);
    let $ = load(html);
    let json = $('script:contains(player_aaaa)').text().replace('var player_aaaa=','');
    let js = JSON.parse(json);
    let playUrl = js.url;
    if (js.encrypt == 1) {
        playUrl = unescape(playUrl);
    } else if (js.encrypt == 2) {
        playUrl = unescape(base64Decode(playUrl));
    }
    let parseUrl = parseMap[flag];
    if (parseUrl) {
        const extHeader = {
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Dest': 'iframe',
        };
        let playHtml = await request(parseUrl + playUrl, extHeader);
        json = playHtml.match(/let ConFig = {([\w\W]*)},box/)[1];
        const jsConfig = JSON.parse('{' + json.trim() + '}');
        playUrl = decryptUrl(jsConfig);
    }
    if(playUrl.indexOf('.m3u8') > 0)
    return {
        parse: 0,
        url: playUrl,
        header: {
            'User-Agent': UA,
        }
    };
 */
const sniffer = await inReq.server.messageToDart({
            action: 'sniff',
            opt: {
                url: link,
                timeout: 10000,
                rule: 'http((?!http).){12,}?\\.(m3u8|mp4|mkv|flv|mp3|m4a|aac)\\?.*|http((?!http).){12,}\\.(m3u8|mp4|mkv|flv|mp3|m4a|aac)|http((?!http).)*?video/tos*|http((?!http).)*?obj/tos*',
            },
        });
        if (sniffer.url.indexOf('url=http')!==-1) {
            sniffer.url=sniffer.url.match(/url=(.*?)&/)[1];
            }
        if (sniffer && sniffer.url) {
            const hds = {};
            if (sniffer.headers) {
                if (sniffer.headers['user-agent']) {
                    hds['User-Agent'] = sniffer.headers['user-agent'];
                }
                if (sniffer.headers['referer']) {
                    hds['Referer'] = sniffer.headers['referer'];
                }
            }
            return {
                parse: 0,
                url: sniffer.url,
                header: hds,
            };
        }
}    

    

    /*
function decryptUrl(jsConfig) {
    const key = CryptoJS.enc.Utf8.parse('2890' + jsConfig.config.uid + 'tB959C');
    const iv = CryptoJS.enc.Utf8.parse('2F131BE91247866E');
    const mode = CryptoJS.mode.CBC;
    const padding = CryptoJS.pad.Pkcs7;
    const decrypted = CryptoJS.AES.decrypt(jsConfig.url, key, {
        'iv': iv,
        'mode': mode,
        'padding': padding
    });
    const decryptedUrl = CryptoJS.enc.Utf8.stringify(decrypted);
    return decryptedUrl;
}

function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
}
/*
const quarkTranscodingCache = {};
const quarkDownloadingCache = {};

async function proxy(inReq, outResp) {
    await Quark.initQuark(inReq.server.db, inReq.server.config.quark);
    const site = inReq.params.site;
    const what = inReq.params.what;
    const shareId = inReq.params.shareId;
    const fileId = inReq.params.fileId;
        let downUrl = '';
        const ids = fileId.split('*');
        const flag = inReq.params.flag;
        if (what == 'trans') {
            if (!quarkTranscodingCache[ids[1]]) {
                quarkTranscodingCache[ids[1]] = (await Quark.getLiveTranscoding(shareId, decodeURIComponent(ids[0]), ids[1], ids[2])).filter((t) => t.accessable);
            }
            downUrl = quarkTranscodingCache[ids[1]].filter((t) => t.resolution.toLowerCase() == flag)[0].video_info.url;
            outResp.redirect(downUrl);
            return;
        } else {
            if (!quarkDownloadingCache[ids[1]]) {
                const down = await Quark.getDownload(shareId, decodeURIComponent(ids[0]), ids[1], ids[2], flag == 'down');
                if (down) quarkDownloadingCache[ids[1]] = down;
            }
            downUrl = quarkDownloadingCache[ids[1]].download_url;
            if (flag == 'redirect') {
                outResp.redirect(downUrl);
                return;
            }
        }
        return await Quark.chunkStream(
            inReq,
            outResp,
            downUrl,
            ids[1],
            Object.assign(
                {
                    Cookie: Quark.cookie,
                },
                Quark.baseHeader,
            ),
        );
}
*/
 
async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    let pg = inReq.body.page;
    let datas = await request(HOST + '/index.php/ajax/suggest?mid=1&limit=50&wd=' + wd)  ;
    // console.log(data);
    let data = data.list;
    let videos = [];
    for (const vod of data) {
        videos.push({
            vod_id: vod.id,
            vod_name: vod.name,
            vod_pic: vod.pic,
            vod_remarks: '',
        });
    }
    return ({
        list: videos,
    });
}
/*
async function play(inReq, _outResp) {
    const flag = inReq.body.flag;
    const id = inReq.body.id;
    const ids = id.split('*');
        const transcoding = (await Quark.getLiveTranscoding(ids[0], ids[1], ids[2], ids[3])).filter((t) => t.accessable);
        quarkTranscodingCache[ids[2]] = transcoding;
        const urls = [];
        const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/quark';
        transcoding.forEach((t) => {
            urls.push(t.resolution.toUpperCase());
            urls.push(`${proxyUrl}/trans/${t.resolution.toLowerCase()}/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.mp4`);
        });
        urls.push('SRC');
        urls.push(`${proxyUrl}/src/redirect/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
        urls.push('SRC_Proxy');
        urls.push(`${proxyUrl}/src/down/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
        const result = {
            parse: 0,
            url: urls,
            header: Object.assign(
                {
                    Cookie: Quark.cookie,
                },
                Quark.baseHeader,
            ),
        };
        if (ids[3]) {
            result.extra = {
                subt: `${proxyUrl}/src/subt/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[4]}*${ids[5]}/.bin`,
            };
        }
        return result;
}
*/
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
            wd: '爱',
            page: 1,
        });
        dataResult.search = resp.json();
        printErr(resp.json());
        return dataResult;
    } catch (err) {
        console.error(err);
        outResp.code(500);
        // return { err: err.message, tip: 'check debug console output' };
    }
}




export default {
    meta: {
        key: 'xinshijue',
        name: '视觉影视',
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