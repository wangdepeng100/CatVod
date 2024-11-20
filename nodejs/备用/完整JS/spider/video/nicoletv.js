import req from '../../util/req.js'; 
import CryptoJS from 'crypto-js';
import { load } from 'cheerio';
import { PC_UA } from '../../util/misc.js';


let url = 'http://v1.nicotv.bet';
const headers = {
    'User-Agent': PC_UA,
};

async function requestpost(method, reqUrl, header, postData) {
    var res = await req(reqUrl, {
        method: method,
        headers: header || headers,
        data: postData || {},        
        transformResponse: (r) => r,
    });
    return res;
}

async function request(method, reqUrl, header, postData) {
    var res = await req(reqUrl, {
        method: method,
        headers: header || headers,
        data: postData || {},        
    });
    return res;
}

async function init(_inReq, _outResp) {
    return {};
}

async function home(_inReq, _outResp) {
    let classes = [
        {
            type_id: 'type3',
            type_name: '动漫',
        },
        {
            type_id: 'type1',
            type_name: '电影',
        },
        {
            type_id: 'type2',
            type_name: '电视剧',
        },
    ];   
    const currentDate = new Date();
    const tyear = currentDate.getFullYear();
    let tyr = '';
    for (let i = 0; i < (tyear - 2023); i++) {
        tyr += '{"n": "' + (tyear - i) + '","v": "' + (tyear - i) + '"},'
    }    
    let fjson = '{"type1":[{"key":"category","name":"类型","init":"","value":[{"n":"全部","v":""},{"n":"喜剧","v":"喜剧"},{"n":"爱情","v":"爱情"},{"n":"恐怖","v":"恐怖"},{"n":"动作","v":"动作"},{"n":"科幻","v":"科幻"},{"n":"剧情","v":"剧情"},{"n":"战争","v":"战争"},{"n":"警匪","v":"警匪"},{"n":"犯罪","v":"犯罪"},{"n":"动画","v":"动画"},{"n":"奇幻","v":"奇幻"},{"n":"武侠","v":"武侠"},{"n":"冒险","v":"冒险"},{"n":"枪战","v":"枪战"},{"n":"恐怖","v":"恐怖"}]},{"key":"area","name":"地区","init":"","value":[{"n":"全部","v":""},{"n":"内地","v":"内地"},{"n":"美国","v":"美国"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"韩国","v":"韩国"},{"n":"日本","v":"日本"},{"n":"法国","v":"法国"},{"n":"英国","v":"英国"},{"n":"德国","v":"德国"},{"n":"泰国","v":"泰国"},{"n":"印度","v":"印度"},{"n":"欧洲","v":"欧洲"},{"n":"东南亚","v":"东南亚"},{"n":"其他","v":"其他"}]},{"key":"year","name":"年代","init":"","value":[{"n":"全部","v":""},' + tyr + '{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2010-2000","v":"20002010"},{"n":"90年代","v":"19901999"},{"n":"更早","v":"18001989"}]},{"key":"star","name":"明星","init":"","value":[{"n":"全部","v":""},{"n":"王宝强","v":"王宝强"},{"n":"黄渤","v":"黄渤"},{"n":"周迅","v":"周迅"},{"n":"周冬雨","v":"周冬雨"},{"n":"范冰冰","v":"范冰冰"},{"n":"陈学冬","v":"陈学冬"},{"n":"陈伟霆","v":"陈伟霆"},{"n":"郭采洁","v":"郭采洁"},{"n":"邓超","v":"邓超"},{"n":"成龙","v":"成龙"},{"n":"葛优","v":"葛优"},{"n":"林正英","v":"林正英"},{"n":"张家辉","v":"张家辉"}]},{"key":"source","name":"资源","init":"","value":[{"n":"全部","v":""},{"n":"正片","v":"正片"},{"n":"预告片","v":"预告片"},{"n":"花絮","v":"花絮"}]},{"key":"by","name":"按","init":"","value":[{"n":"最近热播","v":"hits"},{"n":"最新","v":"addtime"},{"n":"评分最高","v":"gold"}]}],"type2":[{"key":"category","name":"类型","init":"","value":[{"n":"全部","v":""},{"n":"古装","v":"古装"},{"n":"战争","v":"战争"},{"n":"青春偶像","v":"青春偶像"},{"n":"喜剧","v":"喜剧"},{"n":"家庭","v":"家庭"},{"n":"犯罪","v":"犯罪"},{"n":"动作","v":"动作"},{"n":"奇幻","v":"奇幻"},{"n":"剧情","v":"剧情"},{"n":"历史","v":"历史"},{"n":"经典","v":"经典"},{"n":"乡村","v":"乡村"},{"n":"情景","v":"情景"},{"n":"商战","v":"商战"},{"n":"网剧","v":"网剧"}]},{"key":"area","name":"地区","init":"","value":[{"n":"全部","v":""},{"n":"内地","v":"内地"},{"n":"韩国","v":"韩国"},{"n":"香港","v":"香港"},{"n":"台湾","v":"台湾"},{"n":"日本","v":"日本"},{"n":"美国","v":"美国"},{"n":"泰国","v":"泰国"},{"n":"英国","v":"英国"},{"n":"新加坡","v":"新加坡"},{"n":"其他","v":"其他"}]},{"key":"year","name":"年代","init":"","value":[{"n":"全部","v":""},' + tyr + '{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2014","v":"2014"},{"n":"2010-2000","v":"20002010"},{"n":"90年代","v":"19901999"},{"n":"更早","v":"18001989"}]},{"key":"star","name":"明星","init":"","value":[{"n":"全部","v":""},{"n":"王宝强","v":"王宝强"},{"n":"胡歌","v":"胡歌"},{"n":"霍建华","v":"霍建华"},{"n":"赵丽颖","v":"赵丽颖"},{"n":"刘涛","v":"刘涛"},{"n":"刘诗诗","v":"刘诗诗"},{"n":"陈伟霆","v":"陈伟霆"},{"n":"吴奇隆","v":"吴奇隆"},{"n":"陆毅","v":"陆毅"},{"n":"唐嫣","v":"唐嫣"},{"n":"关晓彤","v":"关晓彤"},{"n":"孙俪","v":"孙俪"},{"n":"李易峰","v":"李易峰"}]},{"key":"source","name":"资源","init":"","value":[{"n":"全部","v":""},{"n":"正片","v":"正片"},{"n":"预告片","v":"预告片"},{"n":"花絮","v":"花絮"}]},{"key":"by","name":"按","init":"","value":[{"n":"最近热播","v":"hits"},{"n":"最新","v":"addtime"},{"n":"评分最高","v":"gold"}]}],"type3":[{"key":"category","name":"类型","init":"","value":[{"n":"全部","v":""},{"n":"热血","v":"热血"},{"n":"恋爱","v":"恋爱"},{"n":"科幻","v":"科幻"},{"n":"奇幻","v":"奇幻"},{"n":"百合","v":"百合"},{"n":"后宫","v":"后宫"},{"n":"励志","v":"励志"},{"n":"搞笑","v":"搞笑"},{"n":"冒险","v":"冒险"},{"n":"校园","v":"校园"},{"n":"战斗","v":"战斗"},{"n":"机战","v":"机战"},{"n":"运动","v":"运动"},{"n":"战争","v":"战争"},{"n":"萝莉","v":"萝莉"}]},{"key":"area","name":"地区","init":"","value":[{"n":"全部","v":""},{"n":"日本","v":"日本"},{"n":"大陆","v":"大陆"},{"n":"欧美","v":"欧美"},{"n":"其他","v":"其他"}]},{"key":"year","name":"年代","init":"","value":[{"n":"全部","v":""},' + tyr + '{"n":"2023","v":"2023"},{"n":"2022","v":"2022"},{"n":"2021","v":"2021"},{"n":"2020","v":"2020"},{"n":"2019","v":"2019"},{"n":"2018","v":"2018"},{"n":"2017","v":"2017"},{"n":"2016","v":"2016"},{"n":"2015","v":"2015"},{"n":"2010-2000","v":"20002010"},{"n":"90年代","v":"19901999"},{"n":"更早","v":"18001989"}]},{"key":"by","name":"按","init":"","value":[{"n":"最近热播","v":"hits"},{"n":"最新","v":"addtime"},{"n":"评分最高","v":"gold"}]}]}';
    let filterObj = JSON.parse(fjson);    
    return {
        class: classes,
        filters: filterObj,
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    const extend = inReq.body.filters;
    let page = pg || 1;
    if (page == 0) page = 1;
    let link = url + `/video/${tid}/${extend.category || ''}-${extend.area || ''}-${extend.year || ''}-${extend.star || ''}-${extend.source || ''}--${extend.by || 'addtime'}-${page}.html`;    
    const html = (await request('get', link)).data;
    const $ = load(html);
    let items = $('ul.list-unstyled.vod-item-img.ff-img-215 > li >p > a');
    let videos = [];
    for (let item of items) {
        let href = $(item).attr('href');
        let srcImg = $(item).find('img.img-responsive').first();
        let pic = $(srcImg).attr('data-original');
        let name = $(srcImg).attr('alt');
        let span = $(item).find('span.continu').first();
        let remark = $(span).text().trim();
        videos.push({
            vod_id: href,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: remark,
        });
    }    
    const hasMore = items.length < 30;
    const pgCount = hasMore ? parseInt(page) : parseInt(page) + 1;
    return ({
        page: parseInt(page),
        pagecount: pgCount,
        limit: 30,
        total: 30 * pgCount,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const ids = inReq.body.id;
    const videos = [];
    const html = (await request('get', `${url}${ids}`)).data;
    const $ = load(html);    
    let srcImg = $('div.row > div.col-md-8.col-xs-12 > div > div.media-left  > a > img');
    let vod = {
        vod_id: ids,
        vod_name: $(srcImg).attr('alt'),
        vod_pic: $(srcImg).attr('data-original'),
    };
    let froms = [];
    let urls = [];
    let sources = $('ul.nav.nav-tabs.ff-playurl-tab > li > a');
    let sourceList = $('div.tab-content.ff-playurl-tab > ul.list-unstyled');
    if (sources.length == 0) {
        sources = $('div.page-header.ff-playurl-line > h2');
        sourceList = $('ul.list-unstyled.row.text-center.ff-playurl-line.ff-playurl');
    }
    for (let i = 0; i < sources.length; i++) {
        let source = $(sources[i]);
        let playList = $(sourceList[i]).find('li > a')
        froms.push($(source).text().trim());
        let urlst = [];
        for (let item of playList) {
            urlst.push($(item).text().trim() + '$' + $(item).attr('href'));
        }
        urls.push(urlst.join('#'));
    }
    vod.vod_play_from = froms.join('$$$');
    vod.vod_play_url = urls.join('$$$');
    videos.push(vod);
    return {
        list: videos,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    let playUrl = '';
    try {
        let html = (await request('get', `${url}${id}`)).data;
        let $ = load(html);
        const src = $('#cms_player > script:nth-child(1)').attr('src');
        let regex = /u=([^&]+)/;
        let match = src.match(regex);
        const srcurlt = match ? match[1] : '';
        const s = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(srcurlt));        
        if (s.includes('index.m3u8')) {
            if (s.includes('url=')) {
                regex = /url=(https:\/\/[^\s&]+)/;
                match = s.match(regex);
                playUrl = match ? match[1] : '';
            } else {
                playUrl = s;
            }

        } else {
            let header = headers;
            header['Referer'] = `${url}${id}`;
            html = (await request('get', `${url}${src}`, header)).data;
            $ = load(html);
            const cmsplayersrc = $('body').text();
            regex = /var cms_player = ({[\s\S]+?});/;
            match = cmsplayersrc.match(regex);
            let cmspsrc = match ? match[1] : '';
            const cmsplayer = cmspsrc === '' ? '' : JSON.parse(cmspsrc);
            let url360lifan = cmsplayer.jiexi + encodeURIComponent(cmsplayer.url) + '&time=' + cmsplayer.time + '&auth_key=' + cmsplayer.auth_key;
            html = (await request('get', url360lifan)).data;
            $ = load(html);
            let wang = $('#WANG');
            let wapurl = $(wang).attr('src');
            html = (await request('get', wapurl)).data;
            $ = load(html);
            let script = $('body > script:nth-child(7)');
            regex = /eval\("(.+)"\);/;
            match = $(script).text().match(regex);
            const keysrcraw = match ? match[1] : '';
            let keysrchd = eval(`"${keysrcraw}"`);
            regex = /val\('([^']+)'\);/;
            match = keysrchd.match(regex);
            let keysrc = match ? match[1] : '';
            const key = CryptoJS.enc.Hex.stringify(CryptoJS.MD5(keysrc.concat('stvkx2019'))).toString().toLowerCase();
            regex = /\$.post\(["'][^"']*["'],\s*({[\s\S]*?}),/;
            match = $(script).text().match(regex);
            let playersrc = match ? match[1] : '';
            playersrc = playersrc.replace('desn($(\'#hdMd5\').val())', `"${key}"`);
            const postData = JSON.parse(playersrc);            
            header['Referer'] = wapurl;
            header['Content-Type'] = 'application/x-www-form-urlencoded';
            header['X-Requested-With'] = 'XMLHttpRequest';
            let content = await requestpost('post', 'http://v2.shenjw.com:8022/api.php', header, {
                time: postData.time,
                key: postData.key,
                GaoDuan2019: postData.GaoDuan2019,
                url: postData.url,
                url_222: postData.url_222,
            });               
            const playsrc = JSON.parse(content.data);
            playUrl = playsrc.url;
        }
    } catch (e) {
        console.log(e);
    }
    return {
        parse: 0,
        url: playUrl,
    };
}

async function search(inReq, _outResp) {
    const videos = [];
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;      
    const html = (await request('get', `${url}/vod-search-wd-${wd}-p-${page}.html`)).data;
    const $ = load(html);    
    const srcResult = $('div.container > ul.list-unstyled > li > p > a');
    for (let vod of srcResult) {
        videos.push({
            vod_id: $(vod).attr('href'),
            vod_name: $(vod).find('img').attr('alt'),
            vod_pic: $(vod).find('img').attr('data-original'),
            vod_remarks: $(vod).find('span').text().trim() || '',
        });
    }
    return {
        page: page,
        pagecount: videos.length < 30 ? page : page + 1,
        list: videos,
    };
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
        if (dataResult.home.class.length > 0) {
            resp = await inReq.server.inject().post(`${prefix}/category`).payload({
                id: dataResult.home.class[0].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list.length > 0) {
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
        return { err: err.message, tip: 'check debug console output' };
    }
}

export default {
    meta: {
        key: 'nicoletv',
        name: '🟢 妮可',
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
