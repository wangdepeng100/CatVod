import req from '../../util/req.js';
import { MAC_UA, formatPlayUrl } from '../../util/misc.js';
import { load } from 'cheerio';
import * as HLS from 'hls-parser';
import { getDownload, getFilesByShareUrl, getLiveTranscoding, getShareData, initAli } from '../../util/ali.js';
import dayjs from 'dayjs';

let url = '';

async function request(reqUrl) {
    const resp = await req.get(reqUrl, {
        headers: {
            'User-Agent': MAC_UA,
        },
    });
    return resp.data;
}

/*
tudou: {
    url: 'https://aliz.lvdoui.top',
},
*/
async function init(inReq, _outResp) {
    url = inReq.server.config.tudou.url;
    await initAli(inReq.server.db, inReq.server.config.ali);
    return {};
}

async function home(_inReq, _outResp) {
    let fiters = '';
    let classes = [{'type_id':'1','type_name':'电影片库'},{'type_id':'2','type_name':'国产剧片库'},{'type_id':'21','type_name':'韩剧片库'},{'type_id':'22','type_name':'美剧片库'},{'type_id':'3','type_name':'综艺片库'},{'type_id':'4','type_name':'动漫片库'},{'type_id':'20','type_name':'纪录片片库'}];
    let filterObj = {
        '1':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'剧情','v':'剧情'},{'n':'喜剧','v':'喜剧'},{'n':'动作','v':'动作'},{'n':'爱情','v':'爱情'},{'n':'惊悚','v':'惊悚'},{'n':'恐怖','v':'恐怖'},{'n':'科幻','v':'科幻'},{'n':'剧情','v':'剧情'},{'n':'犯罪','v':'犯罪'},{'n':'悬疑','v':'悬疑'},{'n':'战争','v':'战争'},{'n':'动画','v':'动画'},{'n':'科幻','v':'科幻'},{'n':'恐怖','v':'恐怖'},{'n':'奇幻','v':'奇幻'},{'n':'家庭','v':'家庭'},{'n':'武侠','v':'武侠'},{'n':'冒险','v':'冒险'},{'n':'枪战','v':'枪战'},{'n':'经典','v':'经典'},{'n':'青春','v':'青春'},{'n':'传记','v':'传记'},{'n':'冒险','v':'冒险'},{'n':'歌舞','v':'歌舞'},{'n':'历史','v':'历史'},{'n':'运动','v':'运动'},{'n':'音乐','v':'音乐'},{'n':'纪录','v':'纪录'},{'n':'伦理','v':'伦理'},{'n':'西部','v':'西部'}]},
        {'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'香港','v':'香港'},{'n':'台湾','v':'台湾'},{'n':'美国','v':'美国'},{'n':'法国','v':'法国'},{'n':'英国','v':'英国'},{'n':'日本','v':'日本'},{'n':'韩国','v':'韩国'},{'n':'德国','v':'德国'},{'n':'泰国','v':'泰国'},{'n':'印度','v':'印度'},{'n':'意大利','v':'意大利'},{'n':'西班牙','v':'西班牙'},{'n':'加拿大','v':'加拿大'},{'n':'澳大利亚','v':'澳大利亚'},{'n':'其他','v':'其他'}]},
        {'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},
        {'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},
        {'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},
        {'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '2':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'剧情','v':'剧情'},{'n':'喜剧','v':'喜剧'},{'n':'动作','v':'动作'},{'n':'爱情','v':'爱情'},{'n':'惊悚','v':'惊悚'},{'n':'恐怖','v':'恐怖'},{'n':'科幻','v':'科幻'},{'n':'剧情','v':'剧情'},{'n':'犯罪','v':'犯罪'},{'n':'悬疑','v':'悬疑'},{'n':'战争','v':'战争'},{'n':'动画','v':'动画'},{'n':'科幻','v':'科幻'},{'n':'恐怖','v':'恐怖'},{'n':'奇幻','v':'奇幻'},{'n':'家庭','v':'家庭'},{'n':'武侠','v':'武侠'},{'n':'冒险','v':'冒险'},{'n':'枪战','v':'枪战'},{'n':'经典','v':'经典'},{'n':'青春','v':'青春'},{'n':'传记','v':'传记'},{'n':'冒险','v':'冒险'},{'n':'歌舞','v':'歌舞'},{'n':'历史','v':'历史'},{'n':'运动','v':'运动'},{'n':'音乐','v':'音乐'},{'n':'纪录','v':'纪录'},{'n':'伦理','v':'伦理'},{'n':'西部','v':'西部'}]},
        {'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'香港','v':'香港'},{'n':'台湾','v':'台湾'}]},
        {'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'}]},
        {'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},
        {'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},
        {'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '21':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'剧情','v':'剧情'},{'n':'喜剧','v':'喜剧'},{'n':'动作','v':'动作'},{'n':'爱情','v':'爱情'},{'n':'惊悚','v':'惊悚'},{'n':'恐怖','v':'恐怖'},{'n':'科幻','v':'科幻'},{'n':'剧情','v':'剧情'},{'n':'犯罪','v':'犯罪'},{'n':'悬疑','v':'悬疑'},{'n':'战争','v':'战争'},{'n':'动画','v':'动画'},{'n':'科幻','v':'科幻'},{'n':'恐怖','v':'恐怖'},{'n':'奇幻','v':'奇幻'},{'n':'家庭','v':'家庭'},{'n':'武侠','v':'武侠'},{'n':'冒险','v':'冒险'},{'n':'枪战','v':'枪战'},{'n':'经典','v':'经典'},{'n':'青春','v':'青春'},{'n':'传记','v':'传记'},{'n':'冒险','v':'冒险'},{'n':'歌舞','v':'歌舞'},{'n':'历史','v':'历史'},{'n':'运动','v':'运动'},{'n':'音乐','v':'音乐'},{'n':'纪录','v':'纪录'},{'n':'伦理','v':'伦理'},{'n':'西部','v':'西部'}]},
        {'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'韩国','v':'韩国'}]},{'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'韩语','v':'韩语'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},{'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},{'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '22':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'剧情','v':'剧情'},{'n':'喜剧','v':'喜剧'},{'n':'动作','v':'动作'},{'n':'爱情','v':'爱情'},{'n':'惊悚','v':'惊悚'},{'n':'恐怖','v':'恐怖'},{'n':'科幻','v':'科幻'},{'n':'剧情','v':'剧情'},{'n':'犯罪','v':'犯罪'},{'n':'悬疑','v':'悬疑'},{'n':'战争','v':'战争'},{'n':'动画','v':'动画'},{'n':'科幻','v':'科幻'},{'n':'恐怖','v':'恐怖'},{'n':'奇幻','v':'奇幻'},{'n':'家庭','v':'家庭'},{'n':'武侠','v':'武侠'},{'n':'冒险','v':'冒险'},{'n':'枪战','v':'枪战'},{'n':'经典','v':'经典'},{'n':'青春','v':'青春'},{'n':'传记','v':'传记'},{'n':'冒险','v':'冒险'},{'n':'歌舞','v':'歌舞'},{'n':'历史','v':'历史'},{'n':'运动','v':'运动'},{'n':'音乐','v':'音乐'},{'n':'纪录','v':'纪录'},{'n':'伦理','v':'伦理'},{'n':'西部','v':'西部'}]},
        {'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'美国','v':'美国'},{'n':'法国','v':'法国'},{'n':'英国','v':'英国'},{'n':'德国','v':'德国'},{'n':'泰国','v':'泰国'},{'n':'印度','v':'印度'},{'n':'意大利','v':'意大利'},{'n':'西班牙','v':'西班牙'},{'n':'加拿大','v':'加拿大'},{'n':'其他','v':'其他'}]},
        {'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'英语','v':'英语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},{'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},
        {'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},
        {'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '3':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'游戏','v':'游戏'},{'n':'脱口秀','v':'脱口秀'},{'n':'音乐舞台','v':'音乐舞台'},{'n':'情感','v':'情感'},{'n':'生活','v':'生活'},{'n':'职场','v':'职场'},{'n':'喜剧','v':'喜剧'},{'n':'美食','v':'美食'},{'n':'潮流运动','v':'潮流运动'},{'n':'竞技','v':'竞技'},{'n':'影视','v':'影视'},{'n':'电竞','v':'电竞'},{'n':'推理','v':'推理'},{'n':'访谈','v':'访谈'},{'n':'亲子','v':'亲子'},{'n':'文化','v':'文化'},{'n':'互动','v':'互动'},{'n':'晚会','v':'晚会'},{'n':'资讯','v':'资讯'}]},
        {'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'海外','v':'海外'}]},
        {'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'其它','v':'其它'}]},
        {'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'}]},
        {'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},
        {'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '4':[{'key':'class','name':'剧情','init':'','value':[{'n':'全部','v':''},{'n':'战斗','v':'战斗'},{'n':'科幻','v':'科幻'},{'n':'经典','v':'经典'},{'n':'推理','v':'推理'},{'n':'搞笑','v':'搞笑'},{'n':'冒险','v':'冒险'},{'n':'科幻','v':'科幻'},{'n':'校园','v':'校园'},{'n':'玄幻','v':'玄幻'},{'n':'魔幻','v':'魔幻'},{'n':'武侠','v':'武侠'},{'n':'恋爱','v':'恋爱'},{'n':'腾讯出品','v':'腾讯出品'},{'n':'日常','v':'日常'},{'n':'校园','v':'校园'},{'n':'悬疑','v':'悬疑'},{'n':'真人','v':'真人'},{'n':'历史','v':'历史'},{'n':'竞技','v':'竞技'},{'n':'其他','v':'其他'}]},
        {'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'日本','v':'日本'},{'n':'欧美','v':'欧美'},{'n':'其他','v':'其他'}]},
        {'key':'lang','name':'语言','init':'','value':[{'n':'全部','v':''},{'n':'国语','v':'国语'},{'n':'英语','v':'英语'},{'n':'粤语','v':'粤语'},{'n':'闽南语','v':'闽南语'},{'n':'韩语','v':'韩语'},{'n':'日语','v':'日语'},{'n':'法语','v':'法语'},{'n':'德语','v':'德语'},{'n':'其它','v':'其它'}]},
        {'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},
        {'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},
        {'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
        '20':[{'key':'area','name':'地区','init':'','value':[{'n':'全部','v':''},{'n':'中国大陆','v':'中国大陆'},{'n':'香港','v':'香港'},{'n':'台湾','v':'台湾'},{'n':'美国','v':'美国'},{'n':'法国','v':'法国'},{'n':'英国','v':'英国'},{'n':'日本','v':'日本'},{'n':'韩国','v':'韩国'},{'n':'德国','v':'德国'},{'n':'泰国','v':'泰国'},{'n':'印度','v':'印度'},{'n':'意大利','v':'意大利'},{'n':'西班牙','v':'西班牙'},{'n':'加拿大','v':'加拿大'},{'n':'澳大利亚','v':'澳大利亚'},{'n':'其他','v':'其他'}]},
        {'key':'year','name':'年份','init':'','value':[{'n':'全部','v':''},{'n':'2024','v':'2024'},{'n':'2023','v':'2023'},{'n':'2022','v':'2022'},{'n':'2021','v':'2021'},{'n':'2020','v':'2020'},{'n':'2019','v':'2019'},{'n':'2018','v':'2018'},{'n':'2017','v':'2017'},{'n':'2016','v':'2016'},{'n':'2015','v':'2015'},{'n':'2014','v':'2014'},{'n':'2013','v':'2013'},{'n':'2012','v':'2012'},{'n':'2011','v':'2011'},{'n':'2010','v':'2010'},{'n':'2009','v':'2009'},{'n':'2008','v':'2008'},{'n':'2007','v':'2007'},{'n':'2006','v':'2006'},{'n':'2005','v':'2005'},{'n':'2004','v':'2004'}]},
        {'key':'letter','name':'字母','init':'','value':[{'n':'全部','v':''},{'n':'A','v':'A'},{'n':'B','v':'B'},{'n':'C','v':'C'},{'n':'D','v':'D'},{'n':'E','v':'E'},{'n':'F','v':'F'},{'n':'G','v':'G'},{'n':'H','v':'H'},{'n':'I','v':'I'},{'n':'J','v':'J'},{'n':'K','v':'K'},{'n':'L','v':'L'},{'n':'M','v':'M'},{'n':'N','v':'N'},{'n':'O','v':'O'},{'n':'P','v':'P'},{'n':'Q','v':'Q'},{'n':'R','v':'R'},{'n':'S','v':'S'},{'n':'T','v':'T'},{'n':'U','v':'U'},{'n':'V','v':'V'},{'n':'W','v':'W'},{'n':'X','v':'X'},{'n':'Y','v':'Y'},{'n':'Z','v':'Z'},{'n':'0-9','v':'0-9'}]},
        {'key':'by','name':'排序','value':[{'n':'时间','v':'time'},{'n':'人气','v':'hits'},{'n':'评分','v':'score'}]}],
    };
    return({
        class: classes,
        filters: filterObj,
    });
    
}

function fixImgUrl(imgUrl) {
    if (imgUrl.startsWith('/img.php?url=')) {
        return imgUrl.substr(13);
    }
    return imgUrl;
}


function getFilterUrlPart(extend, part) {
    let result = '';
    if (extend[part]) {
        result = '/' + part + '/' + extend[part];
    }
    return result;
}

async function category(inReq, _outResp) {
    const tid = inReq.body.id;
    const pg = inReq.body.page;
    const extend = inReq.body.filters;
    let page = pg || 1;
    if (page == 0) page = 1;
    const clazz = getFilterUrlPart(extend, 'class');
    const area = getFilterUrlPart(extend, 'area');
    const by = getFilterUrlPart(extend, 'by');
    const lang = getFilterUrlPart(extend, 'lang');
    const letter = getFilterUrlPart(extend, 'letter');
    const year = getFilterUrlPart(extend, 'year');
    let reqUrl = url + '/index.php/vod/show' + area + by + clazz + '/id/' + (extend.cateId || tid) + lang + '/page/' + page + letter + year + '.html';
    let con = await request(reqUrl, MAC_UA);
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

async function detail(inReq, _outResp) {
    const ids = !Array.isArray(inReq.body.id) ? [inReq.body.id] : inReq.body.id;
    const videos = [];
    for (const id of ids) {
        const html = await request(`${url}/index.php/vod/detail/id/${id}.html`);
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
            vod_content:$('p.sqjj_a').text().trim().replace('[收起部分]', ''),
        };

        const shareUrls = $('div.module-row-info p')
            .map((_, p) => p.children[0].data)
            .get();
        const froms = [];
        const urls = [];
        for (const shareUrl of shareUrls) {
            const shareData = getShareData(shareUrl);
            if (shareData) {
                const videos = await getFilesByShareUrl(shareData);
                if (videos.length > 0) {
                    froms.push(shareData.shareId);
                    urls.push(
                        videos
                            .map((v) => {
                                const ids = [v.share_id, v.file_id, v.subtitle ? v.subtitle.file_id : ''];
                                return formatPlayUrl('', v.name) + '$' + ids.join('*');
                            })
                            .join('#'),
                    );
                }
            }
        }
        vod.vod_play_from = froms.join('$$$');
        vod.vod_play_url = urls.join('$$$');
        videos.push(vod);
    }
    return {
        list: videos,
    };
}

const transcodingCache = {};
const downloadingCache = {};

async function proxy(inReq, outResp) {
    await initAli(inReq.server.db, inReq.server.config.ali);
    const what = inReq.params.what;
    const shareId = inReq.params.shareId;
    const fileId = inReq.params.fileId;
    if (what == 'trans') {
        const flag = inReq.params.flag;
        const end = inReq.params.end;

        if (transcodingCache[fileId]) {
            const purl = transcodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0].url;
            if (parseInt(purl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                delete transcodingCache[fileId];
            }
        }

        if (transcodingCache[fileId] && end.endsWith('.ts')) {
            const transcoding = transcodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0];
            if (transcoding.plist) {
                const tsurl = transcoding.plist.segments[parseInt(end.replace('.ts', ''))].suri;
                if (parseInt(tsurl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                    delete transcodingCache[fileId];
                }
            }
        }

        if (!transcodingCache[fileId]) {
            const transcoding = await getLiveTranscoding(shareId, fileId);
            transcodingCache[fileId] = transcoding;
        }

        const transcoding = transcodingCache[fileId].filter((t) => t.template_id.toLowerCase() == flag)[0];
        if (!transcoding.plist) {
            const resp = await req.get(transcoding.url, {
                headers: {
                    'User-Agent': MAC_UA,
                },
            });
            transcoding.plist = HLS.parse(resp.data);
            for (const s of transcoding.plist.segments) {
                if (!s.uri.startsWith('http')) {
                    s.uri = new URL(s.uri, transcoding.url).toString();
                }
                s.suri = s.uri;
                s.uri = s.mediaSequenceNumber.toString() + '.ts';
            }
        }

        if (end.endsWith('.ts')) {
            outResp.redirect(transcoding.plist.segments[parseInt(end.replace('.ts', ''))].suri);
            return;
        } else {
            const hls = HLS.stringify(transcoding.plist);
            let hlsHeaders = {
                'content-type': 'audio/x-mpegurl',
                'content-length': hls.length.toString(),
            };
            outResp.code(200).headers(hlsHeaders);
            return hls;
        }
    } else {
        if (downloadingCache[fileId]) {
            const purl = downloadingCache[fileId].url;
            if (parseInt(purl.match(/x-oss-expires=(\d+)/)[1]) - dayjs().unix() < 15) {
                delete downloadingCache[fileId];
            }
        }
        if (!downloadingCache[fileId]) {
            const down = await getDownload(shareId, fileId);
            downloadingCache[fileId] = down;
        }
        outResp.redirect(downloadingCache[fileId].url);
        return;
    }
}

async function play(inReq, _outResp) {
    const id = inReq.body.id;
    const ids = id.split('*');
    const transcoding = await getLiveTranscoding(ids[0], ids[1]);
    transcoding.sort((a, b) => b.template_width - a.template_width);
    const urls = [];
    const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy';
 
    urls.push('SRC');
    urls.push(`${proxyUrl}/src/nil/${ids[0]}/${ids[1]}/.bin`);
    const result = {
        parse: 0,
        url: urls,
    };
    if (ids[2]) {
        result.extra = {
            subt: `${proxyUrl}/src/nil/${ids[0]}/${ids[2]}/.bin`,
        };
    }
	   transcoding.forEach((t) => {
        urls.push(t.template_id);
        urls.push(`${proxyUrl}/trans/${t.template_id.toLowerCase()}/${ids[0]}/${ids[1]}/.m3u8`);
    });
    return result;
}

async function search(inReq, _outResp) {
    const pg = inReq.body.page;
    const wd = inReq.body.wd;
    let page = pg || 1;
    if (page == 0) page = 1;
    const html = await request(`${url}/index.php/vod/search/wd/${wd}.html`);
    const $ = load(html);
    const videos = $('div.module-items > div.module-search-item')
        .map((_, div) => {
            const t = $(div).find('div.video-info-header h3 a')[0];
            return {
                vod_id: t.attribs.href.match(/detail\/id\/(.*).html/)[1],
                vod_name: t.attribs.title,
                vod_pic: fixImgUrl($(div).find('div.module-item-pic img')[0].attribs['data-src']),
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
        key: 'tudou',
        name: '🟢 土豆',
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
};
