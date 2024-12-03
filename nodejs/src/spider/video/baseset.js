import req from '../../util/req.js'; 
import CryptoJS from 'crypto-js';
import { load } from 'cheerio';
import { PC_UA } from '../../util/misc.js';
import qr from 'qrcode';
const Fn = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.81 Safari/537.36 SE 2.X MetaSr 1.0";
// import sharp from 'sharp'; // 引入 sharp 库
let lI = null, fI = null;

var cI, uI;

let Yie = "/alipan/tokens";

// let url = 'http://help.nicotv.life/';
let url = 'http://www.nicotv.life/';
const headers = {
    'User-Agent': PC_UA,
};

async function requestpost(method, reqUrl, header, postData) {
    var res = await req(reqUrl, {
        method: method,
        headers: header || headers,
        data: postData || {},        
        transformResponse: (r) => r,
    });
    return res;
}

function base64Decode(text) {
    return CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(text));
}

function base64Encode(text) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(text));
}

async function request(method, reqUrl, header, postData) {
    var res = await req(reqUrl, {
        method: method,
        headers: header || headers,
        data: postData || {},        
    });
    return res;
}

async function Lf(e, t, r, n) {
    return await req(e, {
        method: t || "get",
        headers: r || {},
        data: n || {}
    })
}

async function mqe(e) {
    return await Lf("https://auth.aliyundrive.com/v2/account/token", "post", {
        "User-Agent": Fn,
        "Content-Type": "application/json",
        referer: "https://www.aliyundrive.com/"
    }, {
        refresh_token: e,
        grant_type: "refresh_token"
    })
}

async function gqe(e) {
    return await Lf("https://open.aliyundrive.com/oauth/users/authorize?client_id=76917ccccd4441c39457a04f6084fb2f&redirect_uri=https%3A%2F%2Falist.nn.ci%2Ftool%2Faliyundrive%2Fcallback&scope=user%3Abase%2Cfile%3Aall%3Aread%2Cfile%3Aall%3Awrite&state=", "post", {
        "User-Agent": Fn,
        "Content-Type": "application/json",
        referer: "https://www.aliyundrive.com/",
        authorization: e
    }, {
        authorize: 1,
        scope: "user:base,file:all:read,file:all:write"
    })
}

async function _qe(e) {
    return await Lf("https://api.xhofe.top/alist/ali_open/code", "post", {
        "User-Agent": Fn,
        "Content-Type": "application/json",
        referer: "https://www.aliyundrive.com/"
    }, {
        code: e,
        grant_type: "authorization_code"
    })
}

async function Eqe(inReq, outResp) {
    // e, t
    // return cI = e.server.db, uI = e.server.config, {}
    // await Ali.initAli(inReq.server.db, inReq.server.config.ali);
    // await Quark.initQuark(inReq.server.db, inReq.server.config.quark);


    cI = inReq.server.db, uI = inReq.server.config;

    return {}
}


async function vqe(e, t) {
    return {
        class: [{
            type_id: "1",
            type_name: "阿里云盘"
        }, {
            type_id: "2",
            type_name: "夸克网盘"
        }]
    }
}

// 分类实现方法
async function yqe(e, t) {
    let r = e.body.id;
        let n = [];
    if (r == 1) {
        let i = await Lf("https://passport.aliyundrive.com/newlogin/qrcode/generate.do?appName=aliyun_drive&fromSite=52&appName=aliyun_drive&appEntrance=web&isMobile=false&lang=zh_CN&returnUrl=&bizParams=&_bx-v=2.2.3");
        var w8 = null;
        // w8 = encodeURIComponent(i.data.content.data.codeContent);
        w8 = i.data.content.data.codeContent;
        lI = i.data.content.data.ck;
        fI = i.data.content.data.t;
        
        const proxyUrl = e.server.address().url + e.server.prefix + '/proxy';

        n.push({
            vod_id: "ai" + lI,
            vod_name: "扫码登录后点我",
            // vod_pic: `http://127.0.0.1:3000/generate-qr-code?t=${fI}&data=${w8}`
            vod_pic: proxyUrl + '/' + base64Encode(`${w8}`)
        })
    } else if (r == 2) {
        let i = await Lf("https://uop.quark.cn/cas/ajax/getTokenForQrcodeLogin?client_id=532&v=1.2", "get", {
            "User-Agent": Fn
        });
        var S0 = null, dI = null, ml = [], I8 = null;
        // I8 = encodeURIComponent("https://su.quark.cn/4_eMHBJ?token=" + i.data.data.members.token + "&client_id=532&ssb=weblogin&uc_param_str=&uc_biz_str=S%3Acustom%7COPT%3ASAREA%400%7COPT%3AIMMERSIVE%401%7COPT%3ABACK_BTN_STYLE%400");
        I8 = ("https://su.quark.cn/4_eMHBJ?token=" + i.data.data.members.token + "&client_id=532&ssb=weblogin&uc_param_str=&uc_biz_str=S%3Acustom%7COPT%3ASAREA%400%7COPT%3AIMMERSIVE%401%7COPT%3ABACK_BTN_STYLE%400");
        let s = i.headers["set-cookie"];
        ml = ml.concat(s.map(o => o.split(";")[0] + ";"));
        dI = i.data.data.members.token;

        const proxyUrl = e.server.address().url + e.server.prefix + '/proxy';
        n.push({
            vod_id: "aquark" + dI,
            vod_name: "扫码登录后点我",
            // vod_pic: `http://127.0.0.1:3000/generate-qr-code?data=${I8}`
            vod_pic: proxyUrl + '/' + base64Encode(`${I8}`)
        })
    }
    return {
        page: 1,
        pagecount: 1,
        limit: 1,
        total: 1,
        list: n
    }
}

// 详情方法
async function bqe(e, t) {
    let r = e.body.id,
        n, i;
    if (r.includes("ai")) {
        let o = await Lf("https://passport.aliyundrive.com/newlogin/qrcode/query.do?appName=aliyun_drive&fromSite=52&_bx-v=2.2.3", "POST", {
            "content-type": "application/x-www-form-urlencoded"
        }, {
            t: fI,
            appName: "aliyun_drive",
            ck: lI,
            appEntrance: "web",
            isMobile: "false",
            lang: "zh_CN",
            returnUrl: "",
            navlanguage: "zh-CN",
            navPlatform: "MacIntel",
            fromSite: "52",
            bizParams: ""
        });
        if (o.data.content.data.qrCodeStatus == "CONFIRMED") {
            let c = o.data.content.data.bizExt,
                u = atob(c),
                l = decodeURI(u),
                m = JSON.parse(l).pds_login_result.refreshToken;
            if (m) {
                await cI.push(Yie + "/" + uI.ali.token, m);
                let h = await mqe(m);
                if (h.status == 200) {
                    let _ = h.data.token_type,
                        y = h.data.access_token,
                        S = _ + " " + y,
                        v = await gqe(S);
                    if (v.status == 200) {
                        let T = /code=([a-zA-Z0-9]+)/,
                            b = v.data.redirectUri.match(T)[1],
                            x = await _qe(b);

                        if (x.status == 200) {
                            x.data.refresh_token ? (await cI.push(Yie + "/" + uI.ali.token280, x.data.refresh_token), n = "TOKEN设置成功✔: 重启软件即可使用", i = "TOKEN已设置成功，重启软件即可使用阿里系云盘接口。") : (n = "token设置失败:404", i = "refresh_token获取失败,refresh_token为空")
                        } else {
                            n = "token设置失败:403", i = "刷新频繁,频繁获取或者regex取值失败"
                        }
                    } else {
                        n = "token设置失败:402", i = "authorization拼接失败,可能是token_type(Bearer)或者access_token(个人代码)获取失败"
                    }
                } else {
                    n = "token设置失败:401", i = "扫码后获取到了32token成功,可能是32失效或者32获取失败"
                }
            } else {
                n = "token设置失败:400", i = "扫码后获取32token失败,可能是扫码问题或者二维码失效"
            }
        } else {
            n = "出现错误❌: 请按步骤操作扫码登录后再点击", i = "返回上一页，使用阿里云盘App扫码确认登录后再点击"
        }
    } else if (r.includes("aquark")) {
        let s = N8.default.enc.Hex.stringify(N8.default.MD5(uI.quark.cookie)).toString(),
            a = await Lf(`https://uop.quark.cn/cas/ajax/getServiceTicketByQrcodeToken?client_id=532&v=1.2&token=${dI}`);
        if (a.data.status == 2e6) {
            let o = a.data.data.members.service_ticket;
            S0 = ml.join("");
            let c = await Lf(`https://pan.quark.cn/account/info?st=${o}&fr=pc&platform=pc`, "get", {
                    "User-Agent": Fn,
                    Cookie: S0
                }),
                u = c.headers["set-cookie"];
            if (ml = ml.concat(u.map(l => l.split(";")[0] + ";")), S0 = ml.join(""), u) {
                let d = (await Lf("https://drive-pc.quark.cn/1/clouddrive/share/sharepage/dir?pr=ucpro&fr=pc&uc_param_str=&aver=1", "get", {
                    "User-Agent": Fn,
                    Cookie: S0
                })).headers["set-cookie"];
                ml = ml.concat(d.map(m => m.split(";")[0] + ";")), S0 = ml.join(""), d ? (await cI.push(`/quark/${s}`, S0), n = "Cookie设置成功✔: 重启软件即可使用", i = "Cookie设置成功") : (n = "Cookie设置失败:404", i = "个人Puus获取失败" + d.data.message)
            } else n = "Cookie设置失败:403", i = "个人Pus获取失败" + c.data.message
        } else n = "出现错误❌: 请按步骤操作扫码登录后再点击", i = "扫码后再点击 或者service_ticket获取失败" + a.data.message
    }
    return {
        list: [{
            vod_name: n,
            vod_content: i
        }]
    }
}

async function proxy(inReq, outResp) {
    const img = inReq.params.img;
    const text = base64Decode(img)

    // 生成二维码的 Data URL
   
        // 生成指定大小的二维码的 Buffer 对象，设置大小为 300x300
         
        const buffer = await qr.toBuffer(text, { width: 120, height: 120, margin: 10 });
        // 将生成的 Buffer 对象作为响应发送给客户端
        outResp.send(buffer);
       
/*
      qr.toBuffer(text, (err, buffer) => {
        if (err) {
          console.error(err);
          outResp.status(500).send('Error generating QR code');
        } else {
          // 设置响应的 Content-Type 为 'image/png'
          // outResp.type('image/png');
          // 直接发送 Buffer 对象
          outResp.send(buffer);
        }
      });*/

    /*qr.toDataURL(text, (err, dataURL) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error generating QR code');
        } else {
          // 将 Data URL 作为响应发送给客户端
          outResp.send(dataURL);
        }
      });*/

      /*
    // 异步地生成二维码图片的 Buffer 对象
    qr.toBuffer(text, (err, buffer) => {
        if (err) {
          console.error(err);
          outResp.status(500).send('Error generating QR code');
        } else {
          // 设置响应的 Content-Type 为 'image/png'
          outResp.type('image/png');
          // 直接发送 Buffer 对象
          outResp.send(buffer);
        }
      });*/


    // outResp.code(200).headers('Content-Type', 'image/jpeg').send(buffer);

    /*
    qr.toBuffer(text, (err, buffer) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error generating QR code');
        } else {
          // 获取 ArrayBuffer
          // const arrayBuffer = buffer.buffer;

          // outResp.headers('Content-Type', 'application/octet-stream')
          // res.setHeader('Content-Type', 'application/octet-stream');
          // 直接发送 ArrayBuffer
          
        }
      });*/

      /*
    var resp = await req(t, {
        // buffer: 2,
        headers: {
            // Referer: url,
            Referer: this.siteUrl,
            'User-Agent': UA,
        },
        responseType: 'arraybuffer',
        // proxy: this.headersProxy(),
        
    });
    // outResp.code(200).content = resp.data;
    outResp.code(200).headers('Content-Type', resp.headers['Content-Type']).send(resp.data);*/
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
            }
        }
        resp = await inReq.server.inject().post(`${prefix}/search`).payload({
            wd: '科技',
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
        key: 'baseset',
        name: '⚙️ 配置',
        type: 3,
    },
    api: async (fastify) => {
        fastify.post('/init', Eqe);
        fastify.post('/home', vqe);
        fastify.post('/category', yqe);
        fastify.post('/detail', bqe);
        fastify.get('/test', test);
        fastify.get('/proxy/:img', proxy);
        /*
        fastify.get('/proxy/:img', async (inReq, _outResp) => {
            return await spider.proxy(inReq, _outResp);
        });*/
    },
};