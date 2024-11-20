import req from '../../util/req.js';
import dayjs from 'dayjs';
import CryptoJS from 'crypto-js';

import { formatPlayUrl, randDeviceWithId } from '../../util/misc.js';

import NodeRSA from 'node-rsa';

let appVersion = '1.1.7';
let appUA = '';
let appData = {};
let device = {};
let nativeEncode = '1449682949';
const pk = NodeRSA(
    `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtSwotbu7UEonUCzCsJXP
SpYOrkuMnpyk24PBQskkcwYZsUTwbh8Y9vHuPIerh3AfZZ1luFV9yPC282xiNX+/
+IAzWHWG6M+dWmJnDyybeUVTh7H7YVM31eSR9TFT4VASr7NftgCv7hfS2mVNL0sx
RrMSPSXa6SbjkIeW4GTpYpWKehKfaqrgDwVfFCu67ogL9JLIdDxvWthIe42uUMnz
4II1/pdrPtWRu0CDjaxvsLz26UdMGSL3gFEloaJhp4KuIPK4RlIx+9t28H00+3Ip
eVirmiayDYJQe1cjiDKoERSkLubJRD2yj5X3trGmgXex3QkcRtx5UNXYkLEuEMNG
iwIDAQAB
-----END PUBLIC KEY-----`,
    'pkcs8-public-pem',
    {
        encryptionScheme: 'pkcs1',
    },
);

async function request(method, reqUrl, postData) {
    const headers = {
        'User-Agent': appUA,
        Referer: appData.http_referer,
    };
    if (method === 'post') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    var res = await req(reqUrl, {
        method: method,
        headers: headers,
        data: postData || {},
    });
    return res.data;
}

async function init(inReq, _outResp) {
    const deviceKey = inReq.server.prefix + '/device';
    device = await inReq.server.db.getObjectDefault(deviceKey, {});
    if (!device.id) {
        device = randDeviceWithId(32);
        device.id = device.id.toLowerCase();
        device.ua = 'Dalvik/2.1.0 (Linux; U; Android ' + device.release + '; ' + device.model + ' Build/' + device.buildId + ')';
        await inReq.server.db.push(deviceKey, device);
    }
    appUA = '(Mozilla/5.0 (Linux; Android ' + device.release + '; ' + device.model + ' Build/' + device.buildId + '; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/68.0.3440.70 Mobile Safari/537.36)';
    try {
        let content = await request('get', 'https://lags.oss-cn-hangzhou.aliyuncs.com/' + appVersion + '.json');
        var datas = content.data.split('$6c1cef78ae=');
        var json = '';
        for (const d of datas) {
            json += pk.decryptPublic(d, 'utf8');
        }
        appData = JSON.parse(json);
        appUA = appData.ua + '/' + appVersion + appUA;
    } catch (error) {
        console.log(error);
    }
    return {};
}

async function home(_inReq, _outResp) {
    let content = await request('get', appData.json_url + 'cat/index.json');
    let datas = content.data;
    let classes = [];
    let filterObj = {};
    for (const data of datas) {
        let name = data.title.replace('分类', '');

        let type = {
            key: 'type',
            name: '类型',
        };
        var values = data.types.reduce((result, t) => {
            result.push({ n: t.name, v: t.type_id });
            return result;
        }, []);
        type['init'] = values[0]['v'];
        type['value'] = values;
        let sort = {
            key: 'sort',
            name: '排序',
            init: 'hot',
        };
        let sortValues = [];
        sortValues.push({ n: '默认', v: 'index' });
        sortValues.push({ n: '热门', v: 'hot' });
        sortValues.push({ n: '连载', v: 'serial' });
        sortValues.push({ n: '完结', v: 'done' });
        sort['value'] = sortValues;

        filterObj[type['init']] = [type, sort];
        classes.push({
            type_id: type['init'],
            type_name: name,
        });
    }
    return {
        class: classes,
        filters: filterObj,
    };
}

function imgUrl(pic) {
    if (pic.startsWith('http')) return pic;
    return appData.img_url + pic;
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    const extend = inReq.body.filters;
    let page = pg || 1;
    if (page == 0) page = 1;
    let type = extend.type || tid;
    let sort = extend.sort || 'hot';
    let content = await request('get', appData.json_url + 'cat_list/' + type + '/' + sort + '/' + page + '.json');
    let datas = content.data;
    let books = [];
    for (const book of datas.books) {
        books.push({
            book_id: book.book_id,
            book_name: book.name,
            book_pic: imgUrl(book.pic),
            book_remarks: book.status,
        });
    }
    return {
        page: page,
        pagecount: datas.scroll == 1 ? page + 1 : page,
        limit: 999,
        total: 99999999,
        list: books,
    };
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const books = [];
    for (const id of ids) {
        let content = await request('get', appData.json_url + 'cont/' + id + '.json');
        let data = content.data;
        let book = {
            audio: 1,
            book_id: data.book_id,
            book_name: data.name,
            book_pic: imgUrl(data.pic),
            type_name: '',
            book_year: data.time,
            book_area: '',
            book_remarks: data.status,
            book_actor: data.teller,
            book_director: '',
            book_content: data.synopsis,
        };
        let us = data.play_data
            .map(function (b) {
                return formatPlayUrl(book.book_name, b.name) + '$' + data.book_id + '-' + b.play_id;
            })
            .join('#');
        book.volumes = '书卷';
        book.urls = us;
        books.push(book);
    }
    return {
        list: books,
    };
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    var info = id.split('-');
    let time = dayjs().unix();
    time = time - (time % 60);
    let t = CryptoJS.enc.Hex.stringify(CryptoJS.MD5(CryptoJS.enc.Hex.stringify(CryptoJS.MD5('play' + info[0] + info[1])).toString() + nativeEncode + time)).toString();
    let data = {
        m: 'play',
        t: t,
        aid: info[0],
        pid: info[1],
    };
    var params = pk.encrypt(JSON.stringify(data), 'base64');
    let content = await request('post', appData.api_url, {
        params: params,
        version: appVersion,
    });
    var datas = content.data;
    return {
        url: datas.url,
        header: {
            'User-Agent': appUA,
            Referer: appData.referer,
        },
    };
}

async function search(inReq, _outResp) {
    const wd = inReq.body.wd;
    let time = dayjs().unix();
    time = time - (time % 60);
    let t = CryptoJS.enc.Hex.stringify(CryptoJS.MD5(CryptoJS.enc.Hex.stringify(CryptoJS.MD5('search00')).toString() + nativeEncode + time)).toString();
    let data = {
        m: 'search',
        t: t,
        aid: 0,
        pid: 0,
        key: wd,
    };
    var params = pk.encrypt(JSON.stringify(data), 'base64');
    let content = await request('post', appData.api_url, {
        params: params,
        version: appVersion,
    });
    var datas = content.data;
    let books = [];
    for (const book of datas.books) {
        books.push({
            book_id: book.book_id,
            book_name: book.name,
            book_pic: imgUrl(book.pic),
            book_remarks: book.status,
        });
    }
    return {
        list: books,
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
                    id: dataResult.category.list[0].book_id, // dataResult.category.list.map((v) => v.vod_id),
                });
                dataResult.detail = resp.json();
                printErr(resp.json());
                if (dataResult.detail.list && dataResult.detail.list.length > 0) {
                    dataResult.play = [];
                    for (const book of dataResult.detail.list) {
                        const flags = book.volumes.split('$$$');
                        const ids = book.urls.split('$$$');
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
        key: 'laobaigs',
        name: '🎧 老白听书',
        type: 10,
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
