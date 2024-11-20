import req from '../../util/req.js';
import { load } from 'cheerio';
import dayjs from 'dayjs';
import {initAli} from '../../util/ali.js';
import { ua, detail0 , proxy , play , test } from '../../util/pan.js';

let url = 'https://zhaoziyuan1.cc';
let patternAli = /(https:\/\/www\.(aliyundrive|alipan)\.com\/s\/[^"]+)/
let patternVid = /(\\S+)/;
let username = '';
let password = '';
let cookie = '';

async function request(reqUrl, headers, method, data) {
    const resp = await req(reqUrl, {
      method: method || 'get',
      headers: headers,
      cookie: cookie,
      data: data,
      postType: method === 'post' ? 'form' : '',
    });
    return resp;
}

async function init(inReq, _outResp) {
  url = inReq.server.config.zhaozy.url;
  cookie = inReq.server.config.zhaozy.cookie;
  username = inReq.server.config.zhaozy.username;
  password = inReq.server.config.zhaozy.password;
  await initAli(inReq.server.db, inReq.server.config.ali);
  return {};
}

async function home(_inReq, _outResp) {
  return {};
}

async function category(inReq, _outResp) {
  const tid = inReq.body.id;
  const pg = inReq.body.page;
  const extend = inReq.body.filters;

  return {};
}

function conversion(bytes){
  let mb = bytes / (1024 * 1024);
  if(mb > 1024){
    return `${(mb/1024).toFixed(2)}GB`;
    }else{
        return `${parseInt(mb).toFixed(0)}MB`;
    }
}

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (const id of ids) {
      let matches = id.match(patternAli);
      if (Object.keys(matches) !== 0) {
        const shareUrl = matches[0];
        let vod = {};
        videos.push(await detail0(shareUrl, vod));
      }
    }
    return {
        list: videos,
    };
}

async function search(inReq, _outResp) {
  const pg = inReq.body.page || 1;
  const wd = inReq.body.wd;
  const limit = 15;
  // const headers = await getHeaders();
  // const html = await request(url + '/so?filename=' + encodeURIComponent(wd) + '&page=' + pg, headers);
  const html = await request(url + '/so?filename=' + encodeURIComponent(wd) + '&page=' + pg);
  const $ = load(html.data);
  const elements = $('div.li_con div.news_text');
  const videos = [];
  for(const item of elements){
      const element = $(item);
      const href = element.find('div.news_text a').attr('href');
      if (!href) continue;
      const name = element.find("div.news_text a h3").text();
      const remark = element.find("div.news_text a p").text().split("|")[1].split("：")[1];
      const resp = (await request(url + '/' + href)).data;
      const $1 = load(resp);
      const file = $1('a[data-target=""]').attr('href');
      let vod = {
          vod_id: file,
          vod_name: name,
          vod_pic: "https://img.omii.top/i/2024/03/17/vqn6em.webp",
          vod_remarks: remark,
      };
      videos.push(vod);
  }
  const nextPage = $('.page a li:contains(下一页)');
  const hasMore = Object.keys(nextPage) === 0 ? false : nextPage.attr('class') != 'disabled';
  const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
  return {
      page: parseInt(pg),
      pagecount: pgCount,
      limit: limit,
      total: limit * pgCount,
      list: videos.filter(item => item !== undefined),
  };
}

async function getHeaders() {
    if (!cookie) {
        cookie = await getCookie();
    }
    return {
        'User-Agent': ua,
        'Referer': url,
        'Cookie': cookie,
    };
}

async function getCookie() {
    const params = {
        "username": username,
        "passwoxx": password,
    };
    const headers = {
        "User-Agent": ua,
        "Referer": url + "/login.html",
        "Origin": url,
    };
    const res = await request(url + "/logiu.html", headers, 'post', params);
    // const res = await https.post(url + "/logiu.html", params, { headers }, (res) => {});
    let result = '';
    for (const cookie of res.headers['set-cookie']) {
        result += cookie.split(";")[0] + ";";
    }
    return result;
}

export default {
    meta: {
        key: 'zhaozy',
        name: '🔍 资源',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};
