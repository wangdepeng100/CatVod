import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { MAC_UA } from '../../util/misc.js';

// 每次读文件时重置1
let playnums = new Map();
const linkArray = new Map();

function getHeader() {
    let header = {};
    header['User-Agent'] = MAC_UA;
    return header;
}

async function getString(url, name, header) {
    let res = await req(url, {
        headers: header
    });
    return {url: url, name: name, data: res.data};
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
        playnums = 1;
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

function contents(input, text) {
    if(!groups){
        groups = {};
        channels = {};
    }
    let group = '默认';
    for(var line of text.split(/\n|<br>/)) {
        let split = line.split(',');
        // if (split.length < 2) continue;
        if (line.indexOf('#genre#') > -1) {
            group = split[0];
            groups[group] = group;
            if (_.isEmpty(channels[group])) {
                channels[group] = {};
            }
        } else { //  if (line.indexOf('://') > -1) 
            let name = split[0];
            if (name) {
                let channel = {'name':name, 'url':'', 'logo':''};
                if (_.isEmpty(channels[group][name])) {
                    channels[group][name] = [];
                    channels[group][name].push(channel);
                }
            }
        }
    }
    console.log();
}

function playurlc(channel, name, url) {
    let urls = url.split('#');
    const t = [];

    let num = playnums.get(channel + name)
    num = num !== undefined ? num : 0;
    for (let i = 0; i < urls.length; i++) {
        num++
        t.push(urls[i].replace(/http/i, name + (num) + '|http'))
    }
    playnums.set(channel + name, num)
    return t.join('#');
}

function txt(name, text) {
    for(var line of text.split(/\n|<br>/)) {
        let split = line.split(',');
        if (split.length < 2) continue;
        if (line.indexOf('://') > -1) {
            let hturl = linkArray.get(split[0])
            if (hturl && hturl.indexOf() < 0) {
                linkArray.set(split[0], hturl + '#' + playurlc(split[0], name, split[1]));
            } else {
                linkArray.set(split[0], playurlc(split[0], name, split[1]));
            }

            /*
            if (split[1].indexOf("#") > 0) {
                linkArray.set(split[0], playurlc(split[0], name, split[1]));
            } else {
                
            }*/
        }
    }
    console.log()
}

// cfg = {skey: siteKey, ext: extend}
async function init(inReq, _outRes) {
    let exts = inReq.server.config.live1.url;
    linkArray.clear
    var i = 0;
    let group = '其它'
    let assort = '';
    let index = '';

    const promiseList = _.map(exts, (ext) => {
        if (ext.index) {
            index = ext.url;
        }
        return getString(ext.url, ext.name, getHeader());
    });

    if (!_.isEmpty(inReq.server.config.live1.contents)) {
        assort = inReq.server.config.live1.contents;
        promiseList.push(getString(assort, '', getHeader()))
        // let cs = await getString(inReq.server.config.live.contents, getHeader());
        // contents('', cs);
    }

    await Promise.allSettled(promiseList).then(res=> {
        _.map(res, (vk) => {
            try {
                if (vk.status === 'fulfilled' && vk.value !== undefined) {
                    let data = vk.value.data;
                    if (vk.value.url === assort) {
                        groups[group] = group;
                        if (_.isEmpty(channels[group])) {
                            channels[group] = {};
                        }

                        contents('', data);
                    } else {
                        if (vk.value.url === index) {
                            contents(vk.value.name, data);
                        }
                        if (data.startsWith('#EXTM3U')) {
                            m3u(data);
                        } else {
                            txt(vk.value.name, data);
                        }
                    }
                }
            } catch (error) {
                console.log()
            }
        });
    });
    
    // 处理分组中的数据.
    for(var key in channels) {
        for(let data in channels[key]) {
            let str1 = linkArray.get(data)
            if (str1) {
                channels[key][data][0].url = str1;
            }
            // linkArray.delete(data);
        }
    }

    // 填充其它类型
    var d = 0;
    for(const item of linkArray){
        d++
        let name = item[0];
        let channel = {'name': name, 'url':item[1], 'logo':''};

        if (_.isEmpty(channels[group][name])) {
            channels[group][name] = [];
        }
        channels[group][name].push(channel);
        if (d > 500) break;
    }
    
    // 处理完成后,把存储释放掉
    linkArray.clear();
    playnums.clear();
    return {}
    // 加载成完目录,填充分组
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
    });
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    let pg = inReq.body.page;
    if (_.isEmpty(channels[tid])) return '{}';
    let videos = [];
    for (let channelName in channels[tid]) {
        let channel = channels[tid][channelName];
        let first = channel[0];
        let url = first['url'];
        if (_.isEmpty(url)) continue;
        let name = first['name'];
        // let pic = _.isEmpty(first['logo']) ? 'https://epg.112114.xyz/logo/' + name.replace('-', '') + '.png' : first['logo'];
        let pic = `https://vip.helloimg.com/i/2024/03/19/65f9a9aa30e3c.jpeg`;
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
    // let pic = channels[group][name][0]['logo'];
    let pic = `https://vip.helloimg.com/i/2024/03/19/65f9a9aa30e3c.jpeg`;

    let playFroms = [];
    let playUrls = [];
    for(var key in channels[group][name]) {
        let one = channels[group][name][key];
        let url = one['url'];
        playFroms.push('线路' + (parseInt(key) + 1));

        if (url.startsWith('#')) url = url.substring(1);
        const urls = url.split('#')
        let temp = []
        for (let j = 0; j < urls.length; j++) {
            let arrt = urls[j].split('|')
            temp.push('' + arrt[0] + '$' + arrt[1]);
        }
        playUrls.push(temp.join('#'));
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
        // url: id.split('|')[1],
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
        key: 'live1',
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
