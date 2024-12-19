import req from './req.js';
import chunkStream  from './chunk.js';
import CryptoJS from 'crypto-js';
import { formatPlayUrl, conversion, lcs, findBestLCS, delay, IOS_UA as ua } from './misc.js';

export function getShareData(url) {
    let regex = /https:\/\/cloud\.189\.cn\/t\/(\w+)(?:\?password=(\w+))?|
                  https:\/\/cloud\.189\.cn\/web\/share\?code=(\w+)(?:&password=(\w+))?/;
    let matches = regex.exec(url);
    if (matches) {
        return {
            shareCode: match[1] || match[3],
            password: match[2] || match[4] || '',
        };
    }
    return null;
}

export const baseHeader = {
    'User-Agent': ua,
    Referer: 'https://cloud.189.cn/',
};

let localDb = null;
let ckey = null;

const apiUrl = 'https://cloud.189.cn/api/';
export let cookie = '';
const shareInfoCache = {};

export async function initTyi(db, cfg) {
    if (cookie) return;
    localDb = db;
    cookie = cfg.cookie;
    ckey = CryptoJS.enc.Hex.stringify(CryptoJS.MD5(cfg.cookie)).toString();
    const localCfg = await db.getObjectDefault(`/tyi`, {});
    if (localCfg[ckey]) {
        cookie = localCfg[ckey];
    }
}

async function api(url, data, headers, method, retry) {
    headers = headers || {};
    Object.assign(headers, baseHeader);
    Object.assign(headers, {
        Cookie: cookie || '',
        Accept: 'application/json;charset=UTF-8',
        Sign-Type: '1',
    });
    method = method || 'post';
    const resp =
        method == 'get'
            ? await req
                  .get(`${apiUrl}/${url}`, {
                      headers: headers,
                  })
                  .catch((err) => {
                      console.error(err);
                      return err.response || { status: 500, data: {} };
                  })
            : await req
                  .post(`${apiUrl}/${url}`, data, {
                      headers: headers,
                  })
                  .catch((err) => {
                      console.error(err);
                      return err.response || { status: 500, data: {} };
                  });
    const leftRetry = retry || 3;

    if (resp.status === 429 && leftRetry > 0) {
        await delay(1000);
        return await api(url, data, headers, method, leftRetry - 1);
    }
    return resp.data || {};
}

async function getShareInfo(shareData) {
    if (!shareInfoCache[shareData.shareCode]) {
        delete shareInfoCache[shareData.shareCode];
        // 如果 password 不为空，先验证密码
        if(shareData.password){
            const checkData = await api(`open/share/checkAccessCode.action?noCache=${Math.random()}&shareCode=${shareData.shareCode}&accessCode=${shareData.password}`);
            if (checkData.res_code !== 0) {
                return ;
            }
        }
        //获取分享文件信息
        const shareInfo = await api(`open/share/getShareInfoByCodeV2.action?noCache=${Math.random()}&shareCode=${shareData.shareCode}`);
        if (shareInfo) {
            shareInfoCache[shareData.shareCode] = {
                shareId: shareInfo.shareId,
                fileId: shareInfo.fileId
            }
        }
    }
}

const subtitleExts = ['.srt', '.ass', '.scc', '.stl', '.ttml'];

export async function getFilesByShareUrl(shareInfo) {
    const shareData = typeof shareInfo === 'string' ? getShareData(shareInfo) : shareInfo;
    if (!shareData) return [];
    await getShareInfo(shareData);
    if (!shareInfoCache[shareData.shareCode]) return [];
    const videos = [];
    const subtitles = [];
    const listFile = async function (shareId, fileId, pageNum) {
        const pageSize = 200;
        pageNum = pageNum || 1;
        const listData = await api(`open/share/listShareDir.action?noCache=${Math.random()}&pageNum=${pageNum}&pageSize=${pageSize}&fileId=${fileId}&shareDirFileId=${fileId}&isFolder=true&shareId=${shareId}&iconOption=5&orderBy=filename&descending=true&accessCode=`, {}, {}, 'get');
        if (!listData.fileListAO) return [];
        const files = listData.fileListAO.fileList;     
        const subDir = listData.fileListAO.folderList;

        for (const file of files) {
            if (file.mediaType === 3) {
                if (file.size < 1024 * 1024 * 5) continue;
                file.shareId = shareInfoCache[shareData.shareCode].shareId;
                videos.push(file);
            } else if (subtitleExts.some((x) => file.name.endsWith(x))) {
                subtitles.push(file);
            }
        }

        if (pageNum < Math.ceil(listData.fileListAO.count / pageSize)) {
            const nextItems = await listFile(shareId, fileId, pageNum + 1);
            for (const item of nextItems) {
                items.push(item);
            }
        }

        for (const dir of subDir) {
            const subItems = await listFile(shareId, dir.id);
            for (const item of subItems) {
                items.push(item);
            }
        }

        return items;
    };
    await listFile(shareData.shareId, shareData.fileId);
    if (subtitles.length > 0) {
        videos.forEach((item) => {
            var matchSubtitle = findBestLCS(item, subtitles);
            if (matchSubtitle.bestMatch) {
                item.subtitle = matchSubtitle.bestMatch.target;
            }
        });
    }

    return videos;
}

export async function getDownload(shareId, fileId) {
    const down = await api(`portal/getNewVlcVideoPlayUrl.action?noCache=0.617329187255641&dt=1&shareId=${shareId}&fileId=${fileId}&type=4`);
    if (down) {
        return down.normal;
    }
    return null;
}

export async function detail(shareUrl) {
    if (shareUrl.includes('https://cloud.189.cn')) {
        const shareData = getShareData(shareUrl);
        const result = {};
        if (shareData) {
            const videos = await getFilesByShareUrl(shareData);
            if (videos.length > 0) {
                result.from = '天翼网盘-' + shareData.shareCode;
                result.url = videos
                        .map((v) => {
                            const ids = [shareData.shareId, v.id, v.subtitle ? v.subtitle.id : ''];
                            const size = conversion(v.size);
                            return formatPlayUrl('', ` ${v.name.replace(/.[^.]+$/,'')}  [${size}]`) + '$' + ids.join('*');
                        })
                        .join('#')
            }
        }
        return result;
    }
}

const tyiDownloadingCache = {};

export async function proxy(inReq, outResp) {
    const site = inReq.params.site;
    const what = inReq.params.what;
    const shareId = inReq.params.shareId;
    const fileId = inReq.params.fileId;
    if (site == 'tyi') {
        let downUrl = '';
        const ids = fileId.split('*');
        const flag = inReq.params.flag;
        if (what == 'src') {
            if (!tyiDownloadingCache[ids[1]]) {
                const down = await getDownload(shareId, decodeURIComponent(ids[0]), ids[1], ids[2], flag == 'down');
                if (down) quarkDownloadingCache[ids[1]] = down;
            }
            downUrl = tyiDownloadingCache[ids[1]].download_url;
            if (flag == 'redirect') {
                outResp.redirect(downUrl);
                return;
            }
        }
        return await chunkStream(
            inReq,
            outResp,
            downUrl,
            ids[1],
            Object.assign(
                {
                    Cookie: cookie,
                },
                baseHeader,
            ),
        );
    }
}

export async function play(inReq, outResp) {
    const flag = inReq.body.flag;
    const id = inReq.body.id;
    const ids = id.split('*');
    let idx = 0;
    if (flag.startsWith('天翼网盘')) {
        const urls = [];
        const proxyUrl = inReq.server.address().url + inReq.server.prefix + '/proxy/tyi';
        urls.push('代理');
        urls.push(`${proxyUrl}/src/down/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
        urls.push('原画');
        urls.push(`${proxyUrl}/src/redirect/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[2]}*${ids[3]}/.bin`);
        const result = {
            parse: 0,
            url: urls,
            header: Object.assign(
                {
                    Cookie: cookie,
                },
                baseHeader,
            ),
        };
        if (ids[3]) {
            result.extra = {
                subt: `${proxyUrl}/src/subt/${ids[0]}/${encodeURIComponent(ids[1])}*${ids[4]}*${ids[5]}/.bin`,
            };
        }
        return result;
    }
}
