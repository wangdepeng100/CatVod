import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { MAC_UA } from '../../util/misc.js';

let live = '';

function getHeader() {
    let header = {};
    header['User-Agent'] = MAC_UA;
    return header;
}

async function getString(url, header) {
    let res = await req(url, {
        headers: header
    });
    return res.data;
}

let groups = {};
let channels = {};

let groupReg = new RegExp(".*group-title=\"(.?|.+?)\".*");
let logoReg = new RegExp(".*tvg-logo=\"(.?|.+?)\".*");
let nameReg = new RegExp(".*,(.+?)$");

function extract(line, reg) {
    let matches = line.match(reg);
    if (_.isEmpty(matches)) return "";
    return matches[1];
}

function m3u(text) {
    if(!groups){
    groups = {};
    channels = {};
    }
    let channel = {'name':'', 'url':'', 'logo':''};
    let group = '默认';

    for(var line of text.split(/\n/)) {

        if (line.startsWith('#EXTM3U')) {
            continue;
        } else if (line.startsWith('#EXTINF:')) {
            group = extract(line, groupReg);
            let logo = extract(line, logoReg);
            let name = extract(line, nameReg);
            groups[group] = group;
            channel = {'name':name, 'url':'', 'logo':logo};
            if (_.isEmpty(channels[group])) {
                channels[group] = {};
            }
            if (_.isEmpty(channels[group][name])) {
                channels[group][name] = [];
            }
        } else if (line.indexOf('://') > -1) {
            channel['url'] = line;
            let channelName = channel['name'];
            channels[group][channelName].push(channel);
        }
    }

}

function txt(text) {
    if(!groups){
    groups = {};
    channels = {};
    }
    let group = '默认';
    for(var line of text.split(/\n|<br>/)) {
        let split = line.split(',');
        if (split.length < 2) continue;
        if (line.indexOf('#genre#') > -1) {
            group = split[0];
            groups[group] = group;
            if (_.isEmpty(channels[group])) {
                channels[group] = {};
            }
        } else if (line.indexOf('://') > -1) {
            let name = split[0];
            let url = split[1];
            let channel = {'name':name, 'url':url, 'logo':''};
            if (_.isEmpty(channels[group][name])) {
                channels[group][name] = [];
            }
            channels[group][name].push(channel);
        }

    }
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outRes) {
    let exts = [];
    exts = inReq.server.config.live.url;
    for(const ext of exts){
    live = await getString(ext, getHeader());
    if (live.startsWith('#EXTM3U')) {
        m3u(live);
    } else {
        txt(live);
    }
    }
}

let classes = [];
let filterObj = {};

async function home(inReq, _outResp) {
    for(var key in groups) {
        let oneCls = {'type_id': key, 'type_name': groups[key]};
        classes.push(oneCls);
    }
    return({
        class: _.map(classes, (cls) => {
            cls.land = 1.5;
            cls.ratio = 1;
            return cls;
        }),
        filters: filterObj,
    })
}


async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    if (_.isEmpty(channels[tid])) return '{}';
    let videos = [];
    for (let channelName in channels[tid]) {
        let channel = channels[tid][channelName];
        let first = channel[0];
        let url = first['url'];
        let name = first['name'];
        let pic = `https://img.omii.top/i/2024/03/23/lmtg5s.webp`;
        let vodId = tid + '######' + name;
        videos.push({
            vod_id: vodId,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: '',
        });
}
    return ({
        page: parseInt(pg),
        pagecount: 1,
        limit: channels[tid].length,
        total: channels[tid].length,
        list: videos,
    });
}

async function detail(inReq, _outResp) {
    const id = inReq.body.id;
    let vodId = id;
    let vodArr = id.split('######');
    let group = vodArr[0];
    let name = vodArr[1];
    let pic = `https://img.omii.top/i/2024/03/23/lmtg5s.webp`;

    let playFroms = [];
    let playUrls = [];
    for(var key in channels[group][name]) {
        let one = channels[group][name][key];
        let url = one['url'];
        playFroms.push('线路' + (parseInt(key) + 1));
        playUrls.push('' + name + '$' + url);
    }

    let vod = {
        vod_id: vodId,
        vod_name: name,
        vod_pic: pic,
        type_name: '',
        vod_year: '',
        vod_area: '',
        vod_remarks: '',
        vod_actor: '',
        vod_director: '',
        vod_content: name,
        vod_play_from: playFroms.join('$$$'),
        vod_play_url: playUrls.join('$$$'),
    };
    let result = ({
        list: [vod],
    });
    return result;
}


async function play(inReq, _outResp) {
    const id = inReq.body.id;
    return ({
        parse: 0,
        url: id,
    });
}


async function search(inReq, _outResp) {
    return '{}';
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
        key: 'live',
        name: '🟢 直播',
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
