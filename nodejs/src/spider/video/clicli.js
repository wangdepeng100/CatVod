import req from "../../util/req.js";
import {isEmpty,test}from "../../util/pan.js";
import dayjs from "dayjs";

const WEEK_DAYS = {
    '0': '周日',
    '1': '周一',
    '2': '周二',
    '3': '周三',
    '4': '周四',
    '5': '周五',
    '6': '周六',
};
const url = 'https://www.clicli.cc';

async function request(reqUrl) {
    const res = await req(reqUrl, {
        method: 'get',
        headers: {
            'user-agent': 'Dart/3.3 (dart:io)',
            'content-type': 'application/json',
            'clicli-user-agent': 'Instances.appVersion',
        },
    });
    return res.data;
}

async function init(inReq, outResp) {
    return {};
}

async function home(_inReq, outResp) {
    const classes = [{
        'type_id': 'post',
        'type_name': '发现'
    }, {
        'type_id': 'new',
        'type_name': '新番'
    }, {
        'type_id': 'rank',
        'type_name': '排行'
    }];
    const filterObj = {
        'post': [{
            'key': 'type',
            'name': '',
            'init': '推荐',
            'value': [{
                'n': '推荐',
                'v': '推荐'
            }, {
                'n': '最新',
                'v': ''
            }, {
                'n': '国漫',
                'v': '国漫'
            }, {
                'n': '剧场版',
                'v': '剧场版'
            }, {
                'n': '漫画改',
                'v': '漫画改'
            }, {
                'n': '小说改',
                'v': '小说改'
            }, {
                'n': '游戏改',
                'v': '游戏改'
            }, {
                'n': '耽美',
                'v': '耽美'
            }, {
                'n': '乙女',
                'v': '乙女'
            }, {
                'n': '百合',
                'v': '百合'
            }, {
                'n': '后宫',
                'v': '后宫'
            }, {
                'n': '热血',
                'v': '热血'
            }, {
                'n': '战斗',
                'v': '战斗'
            }, {
                'n': '运动',
                'v': '运动'
            }, {
                'n': '奇幻',
                'v': '奇幻'
            }, {
                'n': '神魔',
                'v': '神魔'
            }, {
                'n': '搞笑',
                'v': '搞笑'
            }, {
                'n': '冒险',
                'v': '冒险'
            }, {
                'n': '校园',
                'v': '校园'
            }, {
                'n': '恐怖',
                'v': '恐怖'
            }, {
                'n': '推理',
                'v': '推理'
            }, {
                'n': '科幻',
                'v': '科幻'
            }, {
                'n': '日常',
                'v': '日常'
            }, {
                'n': '古风',
                'v': '古风'
            }, {
                'n': '恋爱',
                'v': '恋爱'
            }, {
                'n': 'r15',
                'v': 'r15'
            }, {
                'n': '泡面番',
                'v': '泡面番'
            }, {
                'n': '治愈',
                'v': '治愈'
            }, {
                'n': '特摄',
                'v': '特摄'
            }, {
                'n': '真人剧',
                'v': '真人剧'
            }]
        }, ],
        'rank': [{
            'key': 'type',
            'name': '',
            'init': '1000',
            'value': [{
                'n': '总榜',
                'v': '1000'
            }, {
                'n': '季榜',
                'v': '90'
            }, {
                'n': '月榜',
                'v': '30'
            }, {
                'n': '日榜',
                'v': '2'
            }, ]
        }, ],
    };
    return {
        class: classes,
        filters: filterObj,
    };
}

async function category(inReq, outResp) {
    const tid = inReq.body.id;
    const extend = inReq.body.filters;
    let pg = inReq.body.page;
    if (pg <= 0) pg = 1;
    let path;
    if (tid == 'rank') {
        path = `/rank?day=${extend.type}`;
        pg = undefined;
    } else {
        let sort, tag, limit;
        if (tid == 'post') {
            sort = '完结,新番';
            tag = extend.type;
            limit = 21;
        } else {
            sort = '新番';
            tag = '';
            limit = 50;
        }
        path = `/posts?status=public&sort=${sort}&tag=${tag}&uid=&page=${pg}&pageSize=${limit}`;
    }
    const resp = await request(url + path);
    return parseVodList(resp, pg);
}

function parseVodList(resp, pg) {
    const videos = [];
    for (const post of resp.posts) {
        const matches = post.content.match(/\!\[suo\]\((.*?)\)/);
        if (isEmpty(matches)) continue;
        let remarks;
        const count = isEmpty(post.videos) ? 0 : post.videos.split('\n')
            .length;
        if (post.sort == '完结') {
            remarks = count == 0 ? '完结' : count + 'P全';
        } else {
            const day = dayjs(post.time);
            const weekday = day.get('d');
            remarks = WEEK_DAYS[weekday] + ',';
            remarks += day.format('hh:mm');
            if (count > 0) {
                remarks += ' P' + count;
            }
        }
        videos.push({
            vod_id: post.id,
            vod_name: post.title,
            vod_pic: matches[1],
            vod_remarks: remarks,
        });
    };
    let pgCount;
    if (pg) {
        pgCount = isEmpty(videos) ? pg : pg + 1;
    } else {
        pg = 1;
        pgCount = 1;
    }
    return {
        page: pg,
        pagecount: pgCount,
        list: videos,
    };
}

async function detail(inReq, outResp) {
    const id = inReq.body.id;
    const resp = await request(url + '/post/' + id);
    const vodData = resp.result;
    const vod = {
        vod_id: id,
        vod_name: vodData.title,
        vod_content: vodData.content,
        vod_play_from: 'CliCli',
        vod_play_url: vodData.videos.replaceAll('\n', '#').replace(/#线路二.*/gs,''),
    };
    console.log(vod)
    return {
        list: [vod],
    };
}

async function play(inReq, outResp) {
    const id = inReq.body.id;
    const resp = await request(url + '/play?url=' + id);
    let playUrl = resp.result.url;
    if (isEmpty(playUrl)) {
        playUrl = id;
    }
    return {
        parse: 0,
        url: playUrl,
    };
}

async function search(inReq, outResp) {
    const wd = inReq.body.wd;
    const resp = await request(url + '/search/posts?key=' + wd);
    return parseVodList(resp);
}

export default {
    meta: {
        key: 'clicli',
        name: '🟢 C站',
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