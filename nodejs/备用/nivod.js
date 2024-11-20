import { Crypto, dayjs, jinja2, Uri, _ } from 'assets://js/lib/cat.js';

let siteKey = '';
let siteType = 0;
let des_key = "diao.com";
let pron = false;

const INDEX_RANK_URL = 'https://api.nivodz.com/index/mobile/WAP/3.0';
const FILTER_URL = 'https://api.nivodz.com/show/filter/condition/WAP/3.0';
const SEARCH_URL = 'https://api.nivodz.com/show/search/WAP/3.0';
const CATEGORY_URL = 'https://api.nivodz.com/show/filter/WAP/3.0';
const DETAIL_URL = 'https://api.nivodz.com/show/detail/WAP/3.0';
const PLAY_URL = 'https://api.nivodz.com/show/play/info/WAP/3.0';

async function post(reqUrl, data) {
    let res = await req(reqUrl, {
        method: 'post',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
            'Referer': 'https://m.nivod.tv/',
        },
        data: data,
        postType: 'form',
    });
    return res.content;
}

async function init(cfg) {
    siteKey = cfg.skey;
    siteType = cfg.stype;
    var ext = cfg.ext;
    if (ext === 'sex') {
        pron = true;
    }
}

async function home(filter) {
    var resultJson = JSON.parse(decryptFromHex(await post(genUrl(FILTER_URL, null), {}), des_key));

    var channels = resultJson.channels;
    var regions = resultJson.regions;
    var langs = resultJson.langs;
    var yearRanges = resultJson.yearRanges;
    var sortsMap = resultJson.sortsMap;
    var typesMap = resultJson.typesMap;

    var classes = [];
    var filt = {};
    for (var i = 0; i < channels.length; i++) {
        var channel = channels[i];
        var dataItem = channel;
        var channelFitler = [];
        var jsonObject = {};
        var channelId = dataItem.channelId;
        var channelName = dataItem.channelName;
        if (channelName.includes('午夜') && !pron) {
            continue;
        }

        jsonObject.type_id = channelId;
        jsonObject.type_name = channelName.toString();
        classes.push(jsonObject);
        if (filter) {
            // sort
            var sortItems = sortsMap[channelId];
            var sortFilter = {
                name: "排序",
                key: "sort_by",
                value: []
            };
            for (var j = 0; j < sortItems.length; j++) {
                var item = sortItems[j];
                var v = {
                    n: item.title,
                    v: item.id.toString()
                };
                sortFilter.value.push(v);
            }
            channelFitler.push(sortFilter);

            // class
            var classItems = typesMap[channelId];
            var classFilter = {
                name: "类型",
                key: "show_type_id",
                value: []
            };
            var classAll = {
                n: "全部",
                v: '0'
            };
            classFilter.value.push(classAll);
            for (var j = 0; j < classItems.length; j++) {
                var item = classItems[j];
                var v = {
                    n: item.showTypeName,
                    v: item.showTypeId.toString()
                };
                classFilter.value.push(v);
            }
            channelFitler.push(classFilter);

            // area
            var areaFilter = {
                name: "地区",
                key: "region_id",
                value: []
            };
            var areaAll = {
                n: "全部",
                v: '0'
            };
            areaFilter.value.push(areaAll);
            for (var j = 0; j < regions.length; j++) {
                var item = regions[j];
                var v = {
                    n: item.regionName,
                    v: item.regionId.toString()
                };
                areaFilter.value.push(v);
            }
            channelFitler.push(areaFilter);

            // lang
            var langFilter = {
                name: "语言",
                key: "lang_id",
                value: []
            };
            var langAll = {
                n: "全部",
                v: '0'
            };
            langFilter.value.push(langAll);
            for (var j = 0; j < langs.length; j++) {
                var item = langs[j];
                var v = {
                    n: item.langName,
                    v: item.langId.toString()
                };
                langFilter.value.push(v);
            }
            channelFitler.push(langFilter);

            // year
            var yearFilter = {
                name: "年份",
                key: "year_range",
                value: []
            };
            var yearAll = {
                n: "全部",
                v: ""
            };
            yearFilter.value.push(yearAll);
            for (var j = 0; j < yearRanges.length; j++) {
                var item = yearRanges[j];
                var v = {
                    n: item.name,
                    v: item.code.toString()
                };
                yearFilter.value.push(v);
            }
            channelFitler.push(yearFilter);
        }
        filt[channelId] = channelFitler;
    }

    resultJson = JSON.parse(decryptFromHex(await post(genUrl(INDEX_RANK_URL, null), {}), des_key));

    var list = resultJson.list;
    var resultList = [];
    var result = {};

    for (var j = 0; j < list.length; j++) {
        var dataItem = list[j].rows;

        for (var k = 0; k < dataItem.length; k++) {
            var cells = dataItem[k].cells;

            for (var l = 0; l < cells.length; l++) {
                var item = cells[l].show;
                var jsonObject = {
                    vod_id: item.showIdCode,
                    vod_name: item.showTitle,
                    vod_pic: item.showImg,
                    vod_remarks: item.episodesTxt || ""
                };
                resultList.push(jsonObject);
            }
        }
        result.list = resultList;
        result.class = classes;
        result.filters = filt;
    }
    return JSON.stringify(result, null, 64 | 128 | 256);
}

async function homeVod() {
    return '{}';
}


async function category(tid, pg, filter, extend) {
    var formData = JSON.parse(
        jinja2(
            `{
                "sort_by": "{{ext.sort_by|default(1)}}",
                "channel_id": "{{tid}}",
                "show_type_id": "{{ext.show_type_id|default(0)}}",
                "region_id": "{{ext.region_id|default(0)}}",
                "lang_id": "{{ext.lang_id|default(0)}}",
                "year_range": "{{ext.year_range}}",
                "start": "{{pg}}"
    }`,
            { ext: extend, tid: tid, pg: ((pg - 1) * 20) }
        )
    );
    formData = Object.fromEntries(Object.entries(formData).sort());

    let resultJSON = JSON.parse(decryptFromHex(await post(genUrl(CATEGORY_URL, formData), formData), des_key));
    const videos = [];
    const dataItems = resultJSON["list"];

    for (let i = 0; i < dataItems.length; i++) {
        const item = dataItems[i];
        const v = {
            "vod_id": item["showIdCode"],
            "vod_name": item["showTitle"],
            "vod_pic": item["showImg"]
        };
        let remark = item["episodesTxt"];

        if (!remark || remark === "null") {
            if (item["playResolutions"] && item["playResolutions"].length > 0) {
                remark = item["playResolutions"][0];
            }
        }

        v["vod_remarks"] = remark;
        videos.push(v);
    }
    var pageCount = pg + 1;
    const result = {
        "list": videos,
        "page": pg,
        "pagecount": pageCount,
        "limit": videos.length,
        "total": videos.length * pageCount
    };
    return JSON.stringify(result, null, 64 | 128 | 256);
}


async function detail(id) {
    const result = {};
    const list = [];
    const vodInfo = {};
    const bodys = {
        "show_id_code": id
    };
    const resultJSON = JSON.parse(decryptFromHex(await post(genUrl(DETAIL_URL, bodys), bodys), des_key));
    const entity = resultJSON["entity"];
    const vodId = entity["showIdCode"];
    vodInfo["vod_id"] = vodId;
    vodInfo["vod_name"] = entity["showTitle"];
    vodInfo["vod_pic"] = entity["showImg"];
    vodInfo["vod_content"] = entity["showDesc"];
    vodInfo["vod_director"] = entity["director"];
    vodInfo["vod_remarks"] = entity["episodesTxt"] || "";
    vodInfo["vod_actor"] = entity["actors"];
    vodInfo["vod_year"] = entity["postYear"];
    vodInfo["vod_area"] = entity["regionName"];
    vodInfo["type_name"] = entity["channelName"];
    vodInfo["vod_play_from"] = "泥巴";
    const plays = entity["plays"];
    const vods = [];

    for (let i = 0; i < plays.length; i++) {
        const item = plays[i];
        vods.push(item["episodeName"] + "$" + vodId + "_" + item["playIdCode"]);
    }

    vodInfo["vod_play_url"] = vods.join("#");
    list.push(vodInfo);
    result["list"] = list;

    return JSON.stringify(result, 64 | 128 | 256);
}


async function play(flag, id, flags) {
    const result = {};
    const ids = id.split("_");
    var bodys = {
        "show_id_code": ids[0],
        "play_id_code": ids[1],
        "oid": "1"
    };

    bodys = Object.fromEntries(Object.entries(bodys).sort());

    const resultJSON = JSON.parse(decryptFromHex(await post(genUrl(PLAY_URL, bodys), bodys), des_key));
    const entity = resultJSON["entity"];
    const playUrl = entity["playUrl"];

    result["url"] = playUrl;

    const playHeader = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
    };

    result["header"] = JSON.stringify(playHeader);
    result["parse"] = "0";
    result["playUrl"] = "";

    return JSON.stringify(result, 64 | 128 | 256);
}

async function search(wd, quick) {
    const result = {};
    const videos = [];
    var bodys = {
        'keyword': wd,
        'start': '0',
        'cat_id': '1',
        'keyword_type': '0'
    };

    bodys = Object.fromEntries(Object.entries(bodys).sort());

    const resultJSON = JSON.parse(decryptFromHex(await post(genUrl(SEARCH_URL, bodys), bodys), des_key));
    const dataItems = resultJSON['list'];

    for (let i = 0; i < dataItems.length; i++) {
        const item = dataItems[i];
        const v = {
            'vod_id': item['showIdCode'],
            'vod_name': item['showTitle'],
            'vod_pic': item['showImg'],
            'vod_remarks': item['episodesTxt'] === 'null' ? '' : item['episodesTxt']
        };
        videos.push(v);
    }

    result['list'] = videos;

    return JSON.stringify(result, 64 | 128 | 256);
}






function encryptToHex(data, key) {
    const keyHex = Crypto.enc.Utf8.parse(key);
    const encrypted = Crypto.DES.encrypt(data, keyHex, {
        mode: Crypto.mode.ECB,
        padding: Crypto.pad.Pkcs7,
    });
    return encrypted.ciphertext.toString(Crypto.enc.Hex);
}

function decryptFromHex(encryptedHex, key) {
    const keyHex = Crypto.enc.Utf8.parse(key);
    const ciphertext = Crypto.enc.Hex.parse(encryptedHex);
    const decrypted = Crypto.DES.decrypt({ ciphertext }, keyHex, {
        mode: Crypto.mode.ECB,
        padding: Crypto.pad.Pkcs7,
    });
    return decrypted.toString(Crypto.enc.Utf8);
}

function genUrl(url, bodys) {
    const randomStr = "AABBCC";
    const oidTime = (Date.now() - 10 * 60 * 1000).toString();
    const oid = encryptToHex(oidTime + "_" + randomStr, des_key).toLowerCase();

    const params = {
        "_ts": oidTime,
        "app_version": "1.0",
        "platform": "4",
        "market_id": "wap_nivod",
        "device_code": "wap",
        "versioncode": "1",
        "oid": oid,
    };

    const sortedParams = Object.fromEntries(Object.entries(params).sort());

    let sign_query = "__QUERY::";
    for (const [key, value] of Object.entries(sortedParams)) {
        if (value === "") {
            continue;
        }
        sign_query += key + "=" + value + "&";
    }

    let sign_body = "__BODY::";
    if (bodys != null) {
        for (const [key, value] of Object.entries(bodys)) {
            if (value === "") {
                continue;
            }
            sign_body += key + "=" + value + "&";
        }
    }

    console.log(sign_body)

    const SECRET_PREFIX = "__KEY::";
    const secretKey = "2x_Give_it_a_shot";
    const has = Crypto.MD5(sign_query + sign_body + SECRET_PREFIX + secretKey);

    url += `?_ts=${params["_ts"]}&app_version=${params["app_version"]}&platform=${params["platform"]}&market_id=${params["market_id"]}&device_code=${params["device_code"]}&versioncode=${params["versioncode"]}&oid=${params["oid"]}&sign=${has}`;

    return url;
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

