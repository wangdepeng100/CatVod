import { load, dayjs, _ } from 'assets://js/lib/cat.js';
import { log } from './lib/utils.js';
import { initAli, detailContent, playContent } from './lib/ali.js';

let siteKey = 'yingso';
let siteType = 0;
let host = 'https://yingso.fun';
let siteUrl = host + ':3000';
let aliUrl = 'https://www.aliyundrive.com/s/';

const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';

async function request(reqUrl, data) {
    const res = await req(reqUrl, {
        method: 'post',
        headers: {
            'User-Agent': UA,
            'Referer': host,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(data),
        postType: '',
    });
    return res.content;
}

// cfg = {skey: siteKey, ext: extend}
async function init(cfg) {
    try {
        siteKey = _.isEmpty(cfg.skey) ? '' : cfg.skey;
        siteType = _.isEmpty(cfg.stype) ? '' : cfg.stype;
        await initAli(cfg.ext);
    } catch (e) {
        await log('init:' + e.message + ' line:' + e.lineNumber);
    }
}

async function home(filter) {
    const classes = [{'type_id':'home','type_name':'首页'}];
    const filterObj = {};
    return {
        class: classes,
        filters: filterObj,
    };
}

async function homeVod() {}

async function category(tid, pg, filter, extend) {
    if (pg <= 0) pg = 1;
    const limit = 30;
    const params = {
        pageSize: limit,
        pageNum: pg,
    };
    const resp = await request(siteUrl + '/ali/all', params);
    return parseVodList(resp, pg, limit);
}

function parseVodList(resp, pg, limit) {
    const json = JSON.parse(resp);
    const videos = _.map(json.data, (item) => {
        return {
            vod_id: aliUrl + item.key,
            vod_name: item.title,
            vod_pic: 'https://pic.rmb.bdstatic.com/bjh/6a2278365c10139b5b03229c2ecfeea4.jpeg',
            vod_remarks: dayjs(item.time).format('YY/MM/DD hh:mm'),
        };
    });
    const pgCount = _.isEmpty(videos) ? pg : pg + 1;
    return {
        page: pg,
        pagecount: pgCount,
        limit: limit,
        total: limit * pgCount,
        list: videos,
    };
}

async function detail(id) {
    try {
        return await detailContent(id);
    } catch (e) {
        await log('detail:' + e.message + ' line:' + e.lineNumber);
    }
}

async function play(flag, id, flags) {
    try {
        return await playContent(flag, id, flags);
    } catch (e) {
        await log('play:' + e.message + ' line:' + e.lineNumber);
    }
}

async function search(wd, quick, pg) {
    if (pg <= 0) pg = 1;
    const limit = 30;
    const params = {
        pageSize: limit,
        pageNum: pg,
        title: wd
    };
    const resp = await request(siteUrl + '/ali/search', params);
    return parseVodList(resp, pg, limit);
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search,
    };
}