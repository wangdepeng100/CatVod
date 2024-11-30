import CryptoJS from 'crypto-js';
import req from '../../util/req.js';
import pkg from 'lodash';
const {_} = pkg;
import {load}from 'cheerio';

let host = 'http://m.ttvbox.com';
let UA = 'Mozilla/5.0 (Linux; Android 14; 22127RK46C Build/UKQ1.230804.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36';
let headers = {
    'User-Agent': UA
};

async function request(reqUrl, postData, post) {
    let res = await req(reqUrl, {
        method: post ? 'post' : 'get',
        headers: headers,
        data: postData || {},
        postType: post ? 'form' : '',
    });
    return res.data;
}

async function init(inReq, _outResp) {
    return {};
}

//await home({},{});
async function home(inReq, outResp) {
    let filterObj = {};
    const classes = [{
            type_id: '1',
            type_name: '电影',
        },{
            type_id: '2',
            type_name: '电视剧',
        },{
            type_id: '3',
            type_name: '动漫',
        },{
            type_id: '4',
            type_name: '综艺',
        },{
            type_id: '7',
            type_name: '音乐',
        },
    ];
    filterObj = await genFilterObj(classes);
    
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}

async function genFilterObj(classes) {
    let filterObj = {};
    for (let value of classes) {
        let typeId = value.type_id;
        const html = await request(host + `/list-select-id-${typeId}-type--area--year--star--state--order-addtime.html`);
        const $ = load(html);
        
        //类型
        const tags = $('dl.dl-horizontal > dd:nth-of-type(2) > a');
        let tag = {
            key: 'tag',
            name: '类型',
            value: _.map(tags, (n) => {
                let v = n.attribs['href'] || '';
                v = v.match(/type-(.*?)-/)[1];
                return { n: n.children[0].data, v: v };
            }),
        };
        tag['init'] = tag.value[0].v;
    
        //地区
        const areas = $('dl.dl-horizontal > dd:nth-of-type(3) > a');
        let area = {
            key: 'area',
            name: '地区',
            value: _.map(areas, (n) => {
                let v = n.attribs['href'] || '';
                v = v.match(/area-(.*?)-/)[1];
                return { n: n.children[0].data, v: v };
            }),
        };
        area['init'] = area.value[0].v;
       
        //年代
        const years = $('dl.dl-horizontal > dd:nth-of-type(4) > a');
        let year = {
            key: 'year',
            name: '年代',
            value: _.map(years, (n) => {
                let v = n.attribs['href'] || '';
                v = v.match(/year-(.*?)-/)[1];
                return { n: n.children[0].data, v: v };
            }),
        };
        year['init'] = year.value[0].v;
        
        //排序
        let order = {
            key: 'order',
            name: '排序',
            value:[
                {'n': '最近热播', 'v': 'hits'},
                {'n': '最新上映', 'v': 'addtime'},
                {'n': '点赞最多', 'v': 'up'}
            ]
        };
        order['init'] = order.value[0];
        
        filterObj[typeId] = [tag,area,year,order];
    }
    return filterObj;
}

//await category({body: {id: '1', page: '1',filters: {tag: '', area: '', year: '', order: 'addtime'}}})
async function category(inReq, _outResp) {
    // tid, pg, filter, extend
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    const extend = inReq.body.filters;

	if(pg <= 0) pg = 1;

    const tag = extend.tag || '';
    const area = extend.area || '';
    const year = extend.year || '';
    const order = extend.order || '';
    const link = host + `/list-select-id-${tid}-type-${tag}-area-${area}-year-${year}-star--state--order-${order}-p-${pg}.html`;
    const html = await request(link);
    const $ = load(html);
    const items = $('ul.list-unstyled.vod-item-img.ff-img-140 > li');
    let videos = _.map(items, (item) => {
        const img = $(item).find('img:first')[0];
        const a = $(item).find('a:first')[0];
        const continu = $($(item).find('span.continu')[0]).text().trim();
        return {
            vod_id: a.attribs.href,
            vod_name: img.attribs.alt,
            vod_pic: img.attribs['data-original'],
            vod_remarks: continu ||  '',
        };
    });

    return JSON.stringify({
        page: parseInt(pg),
        list: videos,
    });
}

//await detail({body: {id: '/vod-read-id-177355.html'}});
async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const videos = [];
    const html = await request(host + id);
    let $ = load(html);
    const detail = $('dl.dl-horizontal > dt');
    let vod = {
        vod_id: id,
        vod_pic: $('img.media-object.img-thumbnail.ff-img').attr('data-original'),
        vod_remarks: '',
        vod_content: $('meta[name = description]').attr('content').trim(),
    };
    for (const info of detail) {
        const i = $(info).text().trim();
        if (i.startsWith('地区：')) {
            vod.vod_area = _map($(info).find('+ dd').find('a'), (a) =>{
                return a.children[0].data }).join('/');
        } else if (i.startsWith('年份：')) {
            vod.vod_year = _map($(info).find('+ dd').find('a'), (a) =>{
                return a.children[0].data }).join('/');
        } else if (i.startsWith('导演：')) {
            vod.vod_director = _map($(info).find('+ dd').find('a'), (a) =>{
                return a.children[0].data }).join('/');
            }).join('/');
        } else if (i.startsWith('主演：')) {
            vod.vod_actor = _map($(info).find('+ dd').find('a'), (a) =>{
                return a.children[0].data }).join('/');
        } else if (i.startsWith('语言：')) {
            vod.vod_lang = _map($(info).find('+ dd').find('a'), (a) =>{
                return a.children[0].data }).join('/');
        }
    }
    let playUrls = $($('ul.list-unstyled.row.text-center.ff-playurl-line.ff-playurl')[0]).find('li > a');
    const playlist = _.map(playUrls, (a) => {
        return a.children[0].data + '$' + a.attribs.href;
    });
    vod.vod_play_from = '盒子影视';
    vod.vod_play_url = playlist.join('#');
    videos.push(vod);

    return {
        list: videos
    };
}
//await search({body: {wd: '都市'}});
async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let url = host + '/index.php?s=vod-search-name';
    const html = await request(url, `wd=${wd}`, true);
    const $ = load(html);
    let data = $('ul.list-unstyled.vod-item-img.ff-img-140 > li');
    let videos = _.map(data, (n) => {
        let id = $($(n)
            .find('p.image > a')[0])
            .attr('href');
        let pic = $($(n)
            .find('p.image > a > img')[0])
            .attr('data-original');
        let name = $($(n)
            .find('p.image > a > img')[0])
            .attr('alt');
        let continu = $($(n)
            .find('p.image span')[0])
            .text().trim();
        return {
            vod_id: id,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: continu
        };
    });
    return ({
        list: videos,
    });
}


//await play({body: {id: '/vod-play-id-178008-sid-2-pid-1.html'}})
async function play(inReq, _outResp) {
    let id = inReq.body.id;
    let link = host + id;
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
        printErr(resp.json());
        if (dataResult.home.class && dataResult.home.class.length > 0) {
            resp = await inReq.server.inject()
                .post(`${prefix}/category`)
                .payload({
                id: dataResult.home.class[1].type_id,
                page: 1,
                filter: true,
                filters: {},
            });
            dataResult.category = resp.json();
            printErr(resp.json());
            if (dataResult.category.list && dataResult.category.list.length > 0) {
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
                                resp = await inReq.server.inject()
                                    .post(`${prefix}/play`)
                                    .payload({
                                    flag: flag,
                                    id: urls[i].split('$')[1],
                                });
                                dataResult.play.push(resp);
                            }
                        }
                    }
                }
            }
        }
        resp = await inReq.server.inject()
            .post(`${prefix}/search`)
            .payload({
            wd: '都市',
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
        key: 'hezi',
        name: '🟢 盒子',
        type: 3,
    },
    api: async(fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};