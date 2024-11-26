import CryptoJS from 'crypto-js';
import req from '../../util/req.js';
import pkg from 'lodash';
const {_} = pkg;
import {load}from 'cheerio';

let siteUrl = 'http://m.ttvbox.com';
let headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 14; 22127RK46C Build/UKQ1.230804.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.0.0 Mobile Safari/537.36',
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

async function home(filter) {
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
    let filterObj = await genFilterObj(classes);
    
    return ({
        class: classes,
        filters: filterObj
    });
}

async function genFilterObj(classes) {
    let filterObj = {};
    for (let value of classes) {
        let typeId = value.type_id;
        const html = await request(url + `/list-select-id-${typeId}-type--area--year--star--state--order-addtime.html`);
        const $ = load(html);
        
        //类型
        const tags = $('dl.dl-horizontal > dd:nth-of-type(2) > a');
        let tag = {
            key: 'tag',
            name: '类型',
            value: _.map(tags, (n) => {
                let v = n.attribs['href'] || '';
                v = v.match(/type-(.*?)-/);
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
                v = v.match(/area-(.*?)-/);
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
                v = v.match(/year-(.*?)-/);
                return { n: n.children[0].data, v: v };
            }),
        };
        year['init'] = year.value[0].v;
        
        //排序
        const orders = $('dl.dl-horizontal > dd:nth-of-type(5) > a');
        let order = {
            key: 'order',
            name: '排序',
            value: _.map(orders, (n) => {
                let v = n.attribs['href'] || '';
                v = v.match(/order-(.*?).html/);
                return { n: n.children[0].data, v: v };
            }),
        };
        order['init'] = order.value[0].v;
        
        filterObj[typeId] = [tag,area,year,order];
    }
    return filterObj;
}

async function category(inReq, _outResp) {

}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    const html = await request(siteUrl + id);
    let $ = load(html);
    let content = $('meta[name = description]').attr('content');
    const play1Urls = $('ul.list-unstyled.row.text-center.ff-playurl-line.ff-playurl');
    let playFroms = [];
    const playUrls = [];
    const playUrlx = _.map($(play1Urls),(play1Url) => {
          let url = siteUrl + $(play1Url).attr('href');
          let title = $(play1Url).text().trim();
          return title + '$' + url;
    }).reverse().join('#');
    for (let i = 1; i <= 3; i++) {
          playFroms.push('线路' + i);
          playUrls.push(playUrlx);
    }
    const videos = 
    {
      vod_content: content,
      vod_play_from: playFroms.join('$$$'),
      vod_play_url: playUrls.join('$$$'),
    };
    return {
        list: [videos]
    };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let url = siteUrl + '/index.php?s=vod-search-name';
    const html = await request(url, `wd=${wd}`, true);
    const $ = load(html);
    let data = $('ul.list-unstyled.vod-item-img.ff-img-140 > li');
    let videos = _.map(data, (n) => {
        let id = $($(n)
            .find('p.img > a')[0])
            .attr('href');
        let pic = $($(n)
            .find('p.img > a > img')[0])
            .attr('data-original');
        let name = $($(n)
            .find('p.img > a > img')[0])
            .attr('alt');
        return {
            vod_id: id,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: '',
        };
    });
    return ({
        list: videos,
    });
}

async function sniff(inReq, _outResp) {
    
}

async function play(inReq, _outResp) {
    
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
            wd: '仙逆',
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
        fastify.post('/sniff', sniff);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/test', test);
    },
};