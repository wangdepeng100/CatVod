import { Spider } from "../spider.js";
import req from '../../util/req.js';
import { MAC_UA, formatPlayUrl } from '../../util/misc.js';
import { load } from 'cheerio';
import * as HLS from 'hls-parser';
import { getDownload, getFilesByShareUrl, getLiveTranscoding, getShareData, initAli } from '../../util/ali.js';
import dayjs from 'dayjs';

let siteUrl = 'https://wobge.run.goorm.io';

class WobgSpider extends Spider {

    constructor() {
        super();
        this.siteUrl = 'https://wobge.run.goorm.io';
    }

    getName() { return "🕸️|玩偶表哥" }

    getAppName() { return "玩偶表哥" }

    getJSName() { return "wobg" }

    async request(reqUrl) {
        const resp = await req.get(reqUrl, {
            headers: {
                'User-Agent': MAC_UA,
            },
        });
        return resp.data;
    }
    
    /*
    tudou: {
        url: 'https://wobge.run.goorm.io',
    },
    */
    async init(inReq, _outResp) {
        this.siteUrl = inReq.server.config.wobg.url;
        await initAli(inReq.server.db, inReq.server.config.ali);
        return {};
    }
    
    async home(_inReq, _outResp) {
        let fiters = '';
    let classes = [{'type_id':'1','type_name':'自营电影'},{'type_id':'2','type_name':'自营剧集'},{'type_id':'3','type_name':'动漫'},{'type_id':'4','type_name':'综艺'},{'type_id':'5','type_name':'音乐'},{'type_id':'44','type_name':'自营短剧'}];
        let filterObj = {
            '1':[{'key':'cateId','name':'类型','init':'1','value':[{'n':'全部','v':'1'},{'n':'大陆自营电影','v':'6'},{'n':'香港自营电影','v':'7'},{'n':'台湾自营电影','v':'8'},{'n':'美国自营电影','v':'9'},{'n':'法国自营电影','v':'10'},{'n':'英国自营电影','v':'11'},{'n':'日本自营电影','v':'12'},{'n':'韩国自营电影','v':'20'},{'n':'德国自营电影','v':'21'}]},{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'喜剧','v':'喜剧'},{'n':'爱情','v':'爱情'},{'n':'恐怖','v':'恐怖'},{'n':'动作','v':'动作'},{'n':'科幻','v':'科幻'},{'n':'剧情','v':'剧情'},{'n':'战争','v':'战争'},{'n':'警匪','v':'警匪'},{'n':'犯罪','v':'犯罪'},{'n':'动画','v':'动画'},{'n':'奇幻','v':'奇幻'},{'n':'武侠','v':'武侠'},{'n':'冒险','v':'冒险'},{'n':'枪战','v':'枪战'},{'n':'恐怖','v':'恐怖'},{'n':'悬疑','v':'悬疑'},{'n':'惊悚','v':'惊悚'},{'n':'经典','v':'经典'},{'n':'青春','v':'青春'},{'n':'文艺','v':'文艺'},{'n':'微电影','v':'微电影'},{'n':'古装','v':'古装'},{'n':'历史','v':'历史'},{'n':'运动','v':'运动'},{'n':'农村','v':'农村'},{'n':'儿童','v':'儿童'},{'n':'网络电影','v':'网络电影'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'大陆','v':'大陆'},{'n':'香港','v':'香港'},{'n':'台湾','v':'台湾'},{'n':'美国','v':'美国'},{'n':'法国','v':'法国'},{'n':'英国','v':'英国'},{'n':'日本','v':'日本'},{'n':'韩国','v':'韩国'},{'n':'德国','v':'德国'},{'n':'泰国','v':'泰国'},{'n':'印度','v':'印度'},{'n':'意大利','v':'意大利'},{'n':'西班牙','v':'西班牙'},{'n':'加拿大','v':'加拿大'},{'n':'其他','v':'其他'}]},{'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},{'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},{'key':'by','name':'排序','init':'time','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
            '2':[{'key':'cateId','name':'类型','init':'2','value':[{'n':'全部','v':'2'},{'n':'大陆自营剧集','v':'13'},{'n':'香港自营剧集','v':'14'},{'n':'台湾自营剧集','v':'15'},{'n':'美国自营剧集','v':'16'},{'n':'法国自营剧集','v':'22'},{'n':'英国自营剧集','v':'23'},{'n':'日本自营剧集','v':'24'},{'n':'韩国自营剧集','v':'25'},{'n':'德国自营剧集','v':'26'}]},{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'古装','v':'古装'},{'n':'战争','v':'战争'},{'n':'青春偶像','v':'青春偶像'},{'n':'喜剧','v':'喜剧'},{'n':'家庭','v':'家庭'},{'n':'犯罪','v':'犯罪'},{'n':'动作','v':'动作'},{'n':'奇幻','v':'奇幻'},{'n':'剧情','v':'剧情'},{'n':'历史','v':'历史'},{'n':'经典','v':'经典'},{'n':'乡村','v':'乡村'},{'n':'情景','v':'情景'},{'n':'商战','v':'商战'},{'n':'网剧','v':'网剧'},{'n':'其他','v':'其他'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'内地','v':'内地'},{'n':'韩国','v':'韩国'},{'n':'香港','v':'香港'},{'n':'台湾','v':'台湾'},{'n':'日本','v':'日本'},{'n':'美国','v':'美国'},{'n':'泰国','v':'泰国'},{'n':'英国','v':'英国'},{'n':'新加坡','v':'新加坡'},{'n':'其他','v':'其他'}]},{'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},{'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},{'key':'by','name':'排序','init':'time','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
            '3':[{'key':'cateId','name':'类型','init':'3','value':[{'n':'全部','v':'3'},{'n':'大陆动漫','v':'27'},{'n':'香港动漫','v':'28'},{'n':'台湾动漫','v':'29'},{'n':'美国动漫','v':'30'},{'n':'法国动漫','v':'31'},{'n':'英国动漫','v':'32'},{'n':'日本动漫','v':'33'},{'n':'韩国动漫','v':'34'},{'n':'德国动漫','v':'35'}]},{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'选秀','v':'选秀'},{'n':'情感','v':'情感'},{'n':'访谈','v':'访谈'},{'n':'播报','v':'播报'},{'n':'旅游','v':'旅游'},{'n':'音乐','v':'音乐'},{'n':'美食','v':'美食'},{'n':'纪实','v':'纪实'},{'n':'曲艺','v':'曲艺'},{'n':'生活','v':'生活'},{'n':'游戏互动','v':'游戏互动'},{'n':'财经','v':'财经'},{'n':'求职','v':'求职'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'内地','v':'内地'},{'n':'港台','v':'港台'},{'n':'日韩','v':'日韩'},{'n':'欧美','v':'欧美'}]},{'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},{'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},{'key':'by','name':'排序','init':'time','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
            '4':[{'key':'cateId','name':'类型','init':'4','value':[{'n':'全部','v':'4'},{'n':'大陆综艺','v':'36'},{'n':'香港综艺','v':'37'},{'n':'台湾综艺','v':'38'},{'n':'美国综艺','v':'39'},{'n':'法国综艺','v':'40'},{'n':'英国综艺','v':'41'},{'n':'日本综艺','v':'42'},{'n':'韩国综艺','v':'43'}]},{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'情感','v':'情感'},{'n':'科幻','v':'科幻'},{'n':'热血','v':'热血'},{'n':'推理','v':'推理'},{'n':'搞笑','v':'搞笑'},{'n':'冒险','v':'冒险'},{'n':'萝莉','v':'萝莉'},{'n':'校园','v':'校园'},{'n':'动作','v':'动作'},{'n':'机战','v':'机战'},{'n':'运动','v':'运动'},{'n':'战争','v':'战争'},{'n':'少年','v':'少年'},{'n':'少女','v':'少女'},{'n':'社会','v':'社会'},{'n':'原创','v':'原创'},{'n':'亲子','v':'亲子'},{'n':'益智','v':'益智'},{'n':'励志','v':'励志'},{'n':'其他','v':'其他'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'国产','v':'国产'},{'n':'日本','v':'日本'},{'n':'欧美','v':'欧美'},{'n':'其他','v':'其他'}]},{'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},{'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},{'key':'by','name':'排序','init':'time','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
            '5':[{'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},{'key':'by','name':'排序','init':'time','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
            '44':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'情感','v':'情感'},{'n':'科幻','v':'科幻'},{'n':'热血','v':'热血'},{'n':'推理','v':'推理'},{'n':'搞笑','v':'搞笑'},{'n':'冒险','v':'冒险'},{'n':'萝莉','v':'萝莉'},{'n':'校园','v':'校园'},{'n':'动作','v':'动作'},{'n':'机战','v':'机战'},{'n':'运动','v':'运动'},{'n':'战争','v':'战争'},{'n':'少年','v':'少年'},{'n':'少女','v':'少女'},{'n':'社会','v':'社会'},{'n':'原创','v':'原创'},{'n':'亲子','v':'亲子'},{'n':'益智','v':'益智'},{'n':'励志','v':'励志'},{'n':'其他','v':'其他'}]},{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'内地','v':'内地'}]},{'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},{'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},{'key':'by','name':'排序','init':'time','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        };
        return({
            class: classes,
            filters: filterObj,
        });
        
    }
    
    fixImgUrl(imgUrl) {
        if (imgUrl.startsWith('/img.php?url=')) {
            return imgUrl.substr(13);
        }
        return imgUrl;
    }
    
    getFilterUrlPart(extend, part) {
        let result = '';
        if (extend[part]) {
            result = '/' + part + '/' + extend[part];
        }
        return result;
    }
    
    async category(inReq, _outResp) {
        const tid = inReq.body.id;
        const pg = inReq.body.page;
        const extend = inReq.body.filters;
        let page = pg || 1;
        if (page == 0) page = 1;
        const clazz = this.getFilterUrlPart(extend, 'class');
        const area = this.getFilterUrlPart(extend, 'area');
        const by = this.getFilterUrlPart(extend, 'by');
        const lang = this.getFilterUrlPart(extend, 'lang');
        const letter = this.getFilterUrlPart(extend, 'letter');
        const year = this.getFilterUrlPart(extend, 'year');
        let reqUrl = this.siteUrl + '/index.php/vod/show' + area + by + clazz + '/id/' + (extend.cateId || tid) + lang + '/page/' + page + letter + year + '.html';
        let con = await this.request(reqUrl, MAC_UA);
        const $ = load(con);
        let items = $('.module:eq(0) > .module-list > .module-items > .module-item');
        let videos = [];
        for(var item of items) {
            let oneA = $(item).find('.module-item-cover .module-item-pic a').first();
            let href = oneA.attr('href');
            let name = oneA.attr('title');
            let oneImg = $(item).find('.module-item-cover .module-item-pic img').first();
            let pic = oneImg.attr('data-src');
            let remark = $(item).find('.module-item-text').first().text();
            videos.push({
                vod_id: href,
                vod_name: name,
                vod_pic: pic,
                vod_remarks: remark,
            });
        }
    
        const hasMore = $('#page > a:contains(下一页)').length > 0;
        const pgCount = hasMore ? parseInt(page) + 1 : parseInt(page);
        return ({
            page: parseInt(page),
            pagecount: pgCount,
            limit: 72,
            total: 72 * pgCount,
            list: videos,
        });
    }
    
    async detail(inReq, _outResp) {
        const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
        const videos = [];
        for (const id of ids) {
            const html = await this.request(`${this.siteUrl}/index.php/vod/detail/id/${id}.html`);
            const $ = load(html);
            const director = [];
            const actor = [];
            let year = '';
            $('div.video-info-items a[href*=/search/]').each((_, a) => {
                const hrefs = a.attribs.href.match(/actor|director|year/)[0];
                const name = $(a).text().trim();
                const idx = hrefs.length;
                if (idx === 8) {
                    const c = {name: name };
                    director.push(`${name}`);
                } else if (idx === 5) {
                    const c = {name: name };
                    actor.push(`${name}`);
                } else if (idx === 4) {
                    year = name;
                }
            });
            let vod = {
                vod_year: year,
                vod_actor: actor.join(', '),
                vod_director: director.join(', '),
                vod_content: $('p.sqjj_a').text().trim().replace('[收起部分]', ''),
            };
    
            const shareUrls = $('div.module-row-info p').map((_, p) => p.children[0].data).get();
            
            let p = await  this.panDetail(shareUrls);
            vod.vod_play_from = p.play_from;
            vod.vod_play_url = p.play_url;

            videos.push(vod);
        }
        return {
            list: videos,
        };
    }

    async search(inReq, _outResp) {
        const pg = inReq.body.page;
        const wd = inReq.body.wd;
        let page = pg || 1;
        if (page == 0) page = 1;
        const html = await this.request(`${this.siteUrl}/index.php/vod/search/wd/${wd}.html`);
        const $ = load(html);
        const videos = $('div.module-items > div.module-search-item')
            .map((_, div) => {
                const t = $(div).find('div.video-info-header h3 a')[0];
                return {
                    vod_id: t.attribs.href.match(/detail\/id\/(.*).html/)[1],
                    vod_name: t.attribs.title,
                    vod_pic: this.fixImgUrl($(div).find('div.module-item-pic img')[0].attribs['data-src']),
                    vod_remarks: $(div).find('a.video-serial').text(),
                };
            })
            .get();
        return {
            page: page,
            pagecount: videos.length < 10 ? page : page + 1,
            list: videos,
        };
    }
}

/*
export default {
    meta: {
        key: 'wobg',
        name: '🕸️|玩偶表哥',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        fastify.get('/proxy/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    },
};*/


let spider = new WobgSpider()

async function init(inReq, _outResp) {
    return await spider.init(inReq, _outResp)
}

async function home(inReq, _outResp) {
    return await spider.home(inReq, _outResp)
}

async function category(inReq, _outResp) {
    return await spider.category(inReq, _outResp)
}

async function detail(inReq, _outResp) {
    return await spider.detail(inReq, _outResp)
}

async function play(inReq, _outResp) {
    return await spider.play(inReq, _outResp)
}

async function search(inReq, _outResp) {
    return await spider.search(inReq, _outResp)
}

async function test(inReq, _outResp) {
    return await spider.test(inReq, _outResp)
}

async function proxy(inReq, _outResp) {
    return await spider.proxy(inReq, _outResp)
}

export default {
    meta: {
        key: spider.getJSName(), name: spider.getName(), type: spider.getType(),
    }, 
    api: async (fastify) => {
        fastify.post('/init', init);
        fastify.post('/home', home);
        fastify.post('/category', category);
        fastify.post('/detail', detail);
        fastify.post('/play', play);
        fastify.post('/search', search);
        // fastify.get('/proxy/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/proxy/:site/:what/:flag/:shareId/:fileId/:end', proxy);
        fastify.get('/test', test);
    }, 
    spider: {
        init: init, home: home, category: category, detail: detail, play: play, search: search, test: test, proxy: proxy
    }
}