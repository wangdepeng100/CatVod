import CryptoJS from 'crypto-js';
import req from '../../util/req.js';
import pkg from 'lodash';
const { _ } = pkg;
import { load } from 'cheerio';
import { test } from '../../util/pan.js'

    let siteUrl = 'https://m.xiangdao.me';
    // let siteUrl ='https://v.nmvod.cn';
    let siteKey = '';
    let siteType = 0;
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
        return{}
    }

async function home(filter) {
        let classes = [{
            type_id: '1',
            type_name: '电影',
        },{
            type_id: '2',
            type_name: '剧集',
        },{
            type_id: '3',
            type_name: '综艺',
        },{
            type_id: '4',
            type_name: '动漫',
        },{
            type_id: '26',
            type_name: '短剧',
        }];
        let filterObj = genFilterObj();
        return ({
            class: classes,
            filters: filterObj
        });
    }



    async function category(inReq, _outResp) {
        const tid = inReq.body.id;
        let pg = inReq.body.page;
        const ext = inReq.body.filters;
        if (!pg) pg = 1;
        if (pg <= 0) pg = 1;
        let id = ext['id'] || tid;
        let year = ext['year'] || '';
        let area = ext['area'] || '';
        let url = siteUrl + '/index.php?m=vod-list-id-'+id+'-pg-'+pg+'-order--by-time-class-0-year-'+year+'-letter--area-'+area+'-lang-.html';
        
        let videos = await getVideos(url);
        return ({
            list: videos,
            page: pg,
        });
    }

    async function detail(inReq, _outResp) {
            const id = inReq.body.id;
            const html = await request(siteUrl + id);
            let $ = load(html);
            let content = $('article > p').text();
            let director = _.map($('section.page-bd > div:nth-child(2) > a'), (n) => {
                return $(n).text();
            }).join(' ');
            let actor = _.map($('section.page-bd > div:nth-child(3) > a'), (n) => {
                return $(n).text();
            }).join(' ');

            let play1Url = siteUrl + $('div.page-btn > span:nth-child(1) > a').attr('href');
            $ = load(await request(play1Url));
            let titles = $('section.main > div > script:nth-child(1)').text().split("mac_url='")[1].split("';")[0].split("#");
            const playUrls = [];
            let playUrlss = [];
            let playFroms = [];
            if($('div.hd > ul > li > a').text().indexOf('云播') >= 0) {
                playFroms.push('云播');
                for(const titlex of titles){
                    const title = titlex.split('$')[0];
                    playUrls.push(title+'$'+id);
                    }
                    playUrlss = playUrls.join('#');
            } else {
                for(let i=1;i<=3;i++) {
                    playFroms.push('线路' + i);
                    for(const titlex of titles){
                    const title = titlex.split('$')[0];
                    playUrls.push(title+'$'+id);
                    }
                    playUrlss = playUrls.join('#'); 
                }
            } 
            playUrlss = [playUrlss];           
            const video = {
                vod_id: id,
                vod_play_from: playFroms.join('$$$'),
                vod_play_url: playUrlss.join('$$$'),
                vod_content: content.replace('简        介：',''),
                vod_director: director,
                vod_actor: actor,
            };
            return ({list: [video]});
    }

    async function search(inReq, _outResp) {
        const wd = inReq.body.wd;
        let url = siteUrl + '/index.php?m=vod-search';
        const html = await request(url, `wd=${wd}`, true);
        const $ = load(html);
        let data = $('#data_list > li');
        let videos = _.map(data, (n) => {
            let id = $($(n).find('div.pic > a')[0]).attr('href');
            let pic = $($(n).find('div.pic > a > img')[0]).attr('data-src');
            let name = $($(n).find(' span.sTit')[0]).text();
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
    if (inReq.body.action == 'request') {
        if (inReq.body.url.indexOf('.html') > 0 || inReq.body.url.indexOf('url=') > 0) {
            const resp = await req.get(inReq.body.url, {
                headers: inReq.body.headers,
            });
            const respHeaders = resp.headers.toJSON();
            delete respHeaders['transfer-encoding'];
            delete respHeaders['cache-control'];
            delete respHeaders['content-length'];
            if (respHeaders['content-encoding'] == 'gzip') {
                delete respHeaders['content-encoding'];
            }
            _outResp.headers(respHeaders);
            return resp.data
                .replaceAll(`var p = navigator.platform;`, `var p ='';`)
                .replaceAll(
                    `</html>`,
                    `<script>
            const loop1 = setInterval(function () {
              if (
                document.querySelectorAll('[onclick*=playlist]').length > 0 &&
                window.playlist
              ) {
                clearInterval(loop1);
                document.querySelectorAll('[onclick*=playlist]')[0].click();
                return;
              }
            }, 200);</script></html>`
                )
                .replaceAll(`autoplay: false`, `autoplay: true`)
                .replaceAll(`<video`, `<video autoplay=true `);
        } else if (inReq.body.url.indexOf('video_mp4') > 0) {
            _outResp.header('sniff_end', '1');
            return 'block';
        }
    }
    return '';
}

    async function play(inReq, _outResp) {
        let id = inReq.body.id;
        id = id.replace('detail','play').replace('.html','-');
        const sniffer = await inReq.server.messageToDart({
            action: 'sniff',
            opt: {
                ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
                url: siteUrl+id+'src-1-num-1.html',
                //https://m.nmddd.com/vod-play-id-39598-src-1-num-1.html
                timeout: 10000,
                // rule: 'xxxxxxx'
                intercept: inReq.server.address().url + inReq.server.prefix + '/sniff',
            },
        });
        if (sniffer && sniffer.url) {
            return {
                parse: 0,
                url: sniffer.url,
            };
        }
    }

    function genFilterObj() {
        return {
            '1': [{'key': 'id', 'name': '类型','init':'1','value': [{'n': '全部', 'v': '1'}, {'n': '动作', 'v': '5'}, {'n': '喜剧', 'v': '6'}, {'n': '爱情', 'v': '7'}, {'n': '科幻', 'v': '8'}, {'n': '恐怖', 'v': '9'}, {'n': '剧情', 'v': '10'}, {'n': '战争', 'v': '11'},{'n': '惊悚', 'v': '16'},{'n': '奇幻', 'v': '17'}]}, 
                {'key': 'area', 'name': '地区','init':'','value': [{'n': '全部', 'v': ''}, {'n': '大陆', 'v': '大陆'}, {'n': '香港', 'v': '香港'}, {'n': '台湾', 'v': '台湾'}, {'n': '美国', 'v': '美国'}, {'n': '韩国', 'v': '韩国'},{'n': '日本', 'v': '日本'}]}, 
                {'key': 'year', 'name': '年份','init':'','value': [{'n': '全部', 'v': ''},{'n': '2024', 'v': '2024'}, {'n': '2023', 'v': '2023'}, {'n': '2022', 'v': '2022'}, {'n': '2021', 'v': '2021'}, {'n': '2020', 'v': '2020'}, {'n': '2019', 'v': '2019'}, {'n': '2018', 'v': '2018'}, {'n': '2017', 'v': '2017'}, {'n': '2016', 'v': '2016'}, {'n': '2015', 'v': '2015'}, {'n': '2014', 'v': '2014'}, {'n': '2013', 'v': '2013'}, {'n': '2012', 'v': '2012'}, {'n': '2011', 'v': '2011'}, {'n': '2010', 'v': '2010'}]}
            ], 
            '2': [{'key': 'id', 'name': '类型','init':'2','value': [{'n': '全部', 'v': '2'}, {'n': '国产剧', 'v': '12'}, {'n': '港台剧', 'v': '13'},{'n': '日韩剧', 'v': '14'}, {'n': '欧美剧', 'v': '15'}]}, 
                {'key': 'area', 'name': '地区','init':'','value': [{'n': '全部', 'v': ''}, {'n': '大陆', 'v': '大陆'}, {'n': '台湾', 'v': '台湾'}, {'n': '香港', 'v': '香港'}, {'n': '韩国', 'v': '韩国'}, {'n': '日本', 'v': '日本'}, {'n': '美国', 'v': '美国'}, {'n': '泰国', 'v': '泰国'}, {'n': '英国', 'v': '英国'}, {'n': '新加坡', 'v': '新加坡'}, {'n': '其他', 'v': '其他'}]},
                {'key': 'year', 'name': '年份','init':'','value': [{'n': '全部', 'v': ''},{'n': '2024', 'v': '2024'}, {'n': '2023', 'v': '2023'}, {'n': '2022', 'v': '2022'}, {'n': '2021', 'v': '2021'}, {'n': '2020', 'v': '2020'}, {'n': '2019', 'v': '2019'}, {'n': '2018', 'v': '2018'}, {'n': '2017', 'v': '2017'}, {'n': '2016', 'v': '2016'}, {'n': '2015', 'v': '2015'}, {'n': '2014', 'v': '2014'}, {'n': '2013', 'v': '2013'}, {'n': '2012', 'v': '2012'}, {'n': '2011', 'v': '2011'}, {'n': '2010', 'v': '2010'}, {'n': '2009', 'v': '2009'}, {'n': '2008', 'v': '2008'}, {'n': '2006', 'v': '2006'}, {'n': '2005', 'v': '2005'}]}
            ]
        };
    }

    async function getRecommend(url) {
        const html = await request(url);
        const $ = load(html);
        const cards = $('div > ul.resize_list > li:nth-child(2)')
        let videos = _.map(cards, (n) => {
            let id = $($(n).find('a')[0]).attr('href');
            let name = $($(n).find('a')[0]).attr('title');
            let pic = $($(n).find('img')[0]).attr('src');
            let remarks = $($(n).find('span.sBottom > span')[0]).text().trim().replaceAll('0.0', '');
            return {
                vod_id: id,
                vod_name: name,
                vod_pic: pic,
                vod_remarks: remarks,
            };
        });
        return videos;
    }

    async function getVideos(url) {
        const html = await request(url);
        const $ = load(html);
        const cards = $('div > ul.resize_list > li')
        let videos = _.map(cards, (n) => {
            let id = $($(n).find('a')[0]).attr('href');
            let name = $($(n).find('a')[0]).attr('title');
            let pic = $($(n).find('img')[0]).attr('src');
            let remarks = $($(n).find('span.sBottom > span > em')[0]).text().trim();
            return {
                vod_id: id,
                vod_name: name,
                vod_pic: pic,
                vod_remarks: remarks,
            };
        });
        return videos;
    }



export default {
    meta: {
        key: 'nongmin',
        name: '🟢 农民',
        type: 3,
    },
   api: async (fastify) => {
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
