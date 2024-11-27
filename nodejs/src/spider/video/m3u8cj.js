import * as HLS from 'hls-parser';
import req from '../../util/req.js';  
import { load } from 'cheerio';
import pkg from 'lodash';
const { _ } = pkg;

let srcobj = {};
let host = "";

async function request(reqUrl, timeout = 6000) {
    try {
        let res = await req(reqUrl, {
            method: 'get',
            timeout: 6000
        });
        return res.data;
    } catch (error) {
        return {}
    }
}

async function requestSearch(reqUrl, source) {
    try {
        let res = await req(reqUrl, {
            method: 'get',
            timeout: 6000
        });
        return { s: source, data: res.data};
    } catch (error) {
        return {}
    }
}

async function init(inReq, _outResp) {
    srcobj = inReq.server.config.m3u8cj;
    return {};
}

async function home(_inReq, _outResp) {
    let classes = [];
    let filterObj = {};

    classes = Object.keys(srcobj).map(key => ({
        type_id: key,
        type_name: srcobj[key][0].name,
    }));

    /*
    const promiseList = _.map(srcobj, (link) => {
        return request4category(link[0].url);
    });
    try {
        await Promise.all(promiseList).then(res=> {
            console.log(res)
            _.map(res, (o) => {
                // srcobj要进行取key值处理
                for (let key of Object.keys(srcobj)) {
                    let itemValues = srcobj[key];
                    let iUrl = itemValues[0].url;
                    if (iUrl === o.url) {
                        let categories = itemValues[0].categories;
                        
                        // 在这里取返回的data进行处理
                        let data = o.data;

                        // 填充
                        classes.push({
                            type_id: key,
                            type_name: itemValues[0].name,
                        });

                        let type = {
                            key: 'category',
                            name: '类型',
                        };
                        let filterAll = [];
                        let typeValues = [];
                        for (const cls of data.class) {
                            const n = cls.type_name.toString().trim();
                            if (categories && categories.length > 0) {
                                if (categories.indexOf(n) < 0) continue;
                            }
                            typeValues.push({ n: n, v: cls.type_id.toString() });
                        }
                        if (categories && categories.length > 0) {
                            typeValues = typeValues.sort((a, b) => {
                                return categories.indexOf(a.n) - categories.indexOf(b.n);
                            });
                        }
                        type['init'] = typeValues[0].v;
                        type['value'] = typeValues;
                        filterAll.push(type);
                        filterObj[key] = filterAll;
                    } 
                }
            });
            return {
                class: classes,
                filters: filterObj,
            };
          })
    } catch (error) {
        console.log(error);
    }*/
    
    return {
        class: classes,
        filters: filterObj,
    };
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    let page = pg || 1;
    if (page == 0) page = 1;
    let videos = [];
    const extend = inReq.body.filters;

    let result = null;

    // 判断extend是否需要重新变更,理应该缓存然后切换的时候不需要重新加载请求.

    // 处理菜单
    let filterObj = {};
    try {
        const obj = srcobj[tid][0];
        host = obj.url;
        const promise1 = request(obj.url);
        const promise2 = request(obj.url + `?ac=detail&t=${extend.category || ''}&pg=${page}`);
        try {
            await Promise.all([promise1, promise2]).then(res=> {
                console.log(res)
                filterObj = dealFilter(obj.url, res[0]);
                let data = res[1];
                if (data.length == 0) return {};    
                for (const vod of data.list) {
                    videos.push({
                        // vod_id: tid.concat('=').concat(vod.vod_id.toString()),
                        vod_id: vod.vod_id.toString(),
                        vod_name: vod.vod_name.toString(),
                        vod_pic: vod.vod_pic,
                        vod_remarks: vod.vod_remarks,
                    });
                }

                result = {
                    page: parseInt(data.page),
                    pagecount: data.pagecount,
                    total: data.total,
                    list: videos,
                };
            });
        } catch (error) {
        }
    } catch (error) {
    }
    result.filter = filterObj;
    return result;
}

function dealFilter(url, mfilter) {
    for (let key of Object.keys(srcobj)) {
        let itemValues = srcobj[key];
        let iUrl = itemValues[0].url;
        if (iUrl === url) {
            let categories = itemValues[0].categories;

            let type = {
                key: 'category',
                name: '类型',
            };
            let filterAll = [];
            let typeValues = [];
            for (const cls of mfilter.class) {
                const n = cls.type_name.toString().trim();
                if (categories && categories.length > 0) {
                    if (categories.indexOf(n) < 0) continue;
                }
                typeValues.push({ n: n, v: cls.type_id.toString() });
            }
            if (categories && categories.length > 0) {
                typeValues = typeValues.sort((a, b) => {
                    return categories.indexOf(a.n) - categories.indexOf(b.n);
                });
            }
            type['init'] = typeValues[0].v;
            type['value'] = typeValues;
            filterAll.push(type);
            return filterAll;
        }
    }
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (let id of ids) {        
        let resp = null;
        try {
            // 如果是搜索跳转过来,需要指定host的地址,不能是单纯的id
            const flags = (id + "").split('$$$');
            if (flags.length>1) {
                host = flags[0];
                id = flags[1];
            }
            resp = await request(host + `?ac=detail&ids=${id}`);
            // data = await request( + `?ac=detail&ids=${id.split('=')[1]}`);
            // 
        } catch (error) {
            continue;
        }

        const data = resp.list[0];
        let vod = {
            vod_id: data.vod_id,
            vod_name: data.vod_name,
            vod_pic: data.vod_pic,
            type_name: data.type_name,
            vod_year: data.vod_year,
            vod_area: data.vod_area,
            vod_remarks: data.vod_remarks,
            vod_actor: data.vod_actor,
            vod_director: data.vod_director,
            vod_content: data.vod_content.trim(),
            vod_play_from: srcobj.hasOwnProperty(data.vod_play_from) ? Object.values(srcobj[data.vod_play_from])[0].name : data.vod_play_from,
            vod_play_url: data.vod_play_url,
        };
        videos.push(vod);
    }
    return {
        list: videos,
    };
}

async function proxy(inReq, outResp) {
    const what = inReq.params.what;
    const purl = decodeURIComponent(inReq.params.ids);
    if (what == 'hls') {
        const resp = await req(purl, {
            method: 'get',
        });
        // const updatedData = resp.data.replace(/(\n#EXT-X-DISCONTINUITY\n)/g, '\n');
        const t = [];
        var s = false;
        for(var line of resp.data.split(/[\r\n]+/)) {

            if (s) {
                s = false;
                // line不处理
            }

            if(line.indexOf('#EXT-X-DISCONTINUITY') == -1) {
                t.push(line);
            } else {
                s = true;
            }
        }

        const plist = HLS.parse(t.join('\n')); // 
        if (plist.variants) {
            for (const v of plist.variants) {
                if (!v.uri.startsWith('http')) {
                    v.uri = new URL(v.uri, purl).toString();
                }
            }
            plist.variants.map((variant) => {
                variant.uri = inReq.server.prefix + '/proxy/hls/' + encodeURIComponent(variant.uri) + '/.m3u8';
            });
        }

        if (plist.segments) {
            for (const s of plist.segments) {
                if (!s.uri.startsWith('http')) {
                    s.uri = new URL(s.uri, purl).toString();
                }
                if (s.key && s.key.uri && !s.key.uri.startsWith('http')) {
                    s.key.uri = new URL(s.key.uri, purl).toString();
                }
            }

            /* 删除所有的#EXT-X-DISCONTINUITY标记
            plist.segments = plist.segments.filter((segment) => {
                return !segment.discontinuity;
            });*/

            plist.segments.map((seg) => {
                seg.uri = inReq.server.prefix + '/proxy/ts/' + encodeURIComponent(seg.uri) + '/.ts';
            });
        }
        const hls = HLS.stringify(plist);
        let hlsHeaders = {};
        if (resp.headers['content-length']) {
            Object.assign(hlsHeaders, resp.headers, { 'content-length': hls.length.toString() });
        } else {
            Object.assign(hlsHeaders, resp.headers);
        }
        delete hlsHeaders['transfer-encoding'];
        delete hlsHeaders['cache-control'];
        if (hlsHeaders['content-encoding'] == 'gzip') {
            delete hlsHeaders['content-encoding'];
        }
        outResp.code(resp.status).headers(hlsHeaders);
        return hls;
    } else {
        outResp.redirect(purl);
        return;
    }
}
async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return {
        parse: 0,
        url: inReq.server.address().dynamic + inReq.server.prefix + '/proxy/hls/' + encodeURIComponent(id) + '/.m3u8',
    };
}


async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let videos = [];

    const srcojbMay = new Map();
    _.map(srcobj, (link) => {
        srcojbMay.set(link[0].url,link[0].name);
    });

    const promiseList = _.map(srcobj, (link) => {
        if (link[0].url.search) {
            return requestSearch(link[0].url + `?ac=detail&wd=${wd}`, link[0].url);
        }
    });

    await Promise.allSettled(promiseList).then(res=> {
        console.log(res)
        _.map(res, (vk) => {
            try {
                let obj = vk.value.data;
                for (const vObj of obj.list) {
                    videos.push({
                        vod_id: vk.value.s + '$$$' + vObj.vod_id,
                        vod_name: vObj.vod_name.toString(),
                        vod_pic: vObj.vod_pic,
                        vod_remarks: vObj.vod_remarks + ' | ' + srcojbMay.get(vk.value.s),
                        // vod_remarks: Object.values(srcobj)[i][0].name,
                    });
                }
            } catch (error) {
                console.log();
            }
        });
    });

    return {
        page: 1,
        pagecount: Math.ceil(videos.length / 30),
        limit: 30,
        total: videos.length,
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
        key: 'm3u8cj',
        name: '🟢 采集',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:what/:ids/:end', proxy);
        fastify.get('/test', test);
    },
};