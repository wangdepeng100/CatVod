import req from './req.js';
import CryptoJS from 'crypto-js';
import { join } from 'path';
import fs from 'fs';
import { PassThrough } from 'stream';

export function getShareData(url) {
    let regex = /https:\/\/pan\.quark\.cn\/s\/([^\\|#/]+)/;
    let matches = regex.exec(url);
    if (matches) {
        return {
            shareId: matches[1],
            folderId: '0',
        };
    }
    return null;
}

const pr = 'pr=ucpro&fr=pc';

export const baseHeader = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) quark-cloud-drive/2.5.20 Chrome/100.0.4896.160 Electron/18.3.5.4-b478491100 Safari/537.36 Channel/pckk_other_ch',
    Referer: 'https://pan.quark.cn',
};

let localDb = null;
let ckey = null;

const apiUrl = 'https://drive.quark.cn/1/clouddrive/';
export let cookie = '';

const shareTokenCache = {};
const saveDirName = 'CatVodOpen';
let saveDirId = null;

export async function initQuark(db, cfg) {
    if (cookie) return;
    localDb = db;
    cookie = cfg.cookie;
    ckey = CryptoJS.enc.Hex.stringify(CryptoJS.MD5(cfg.cookie)).toString();
    const localCfg = await db.getObjectDefault(`/quark`, {});
    if (localCfg[ckey]) {
        cookie = localCfg[ckey];
    }
}

/**
 * 字符串相似度匹配
 * @returns
 */
function lcs(str1, str2) {
    if (!str1 || !str2) {
        return {
            length: 0,
            sequence: '',
            offset: 0,
        };
    }

    var sequence = '';
    var str1Length = str1.length;
    var str2Length = str2.length;
    var num = new Array(str1Length);
    var maxlen = 0;
    var lastSubsBegin = 0;

    for (var i = 0; i < str1Length; i++) {
        var subArray = new Array(str2Length);
        for (var j = 0; j < str2Length; j++) {
            subArray[j] = 0;
        }
        num[i] = subArray;
    }
    var thisSubsBegin = null;
    for (i = 0; i < str1Length; i++) {
        for (j = 0; j < str2Length; j++) {
            if (str1[i] !== str2[j]) {
                num[i][j] = 0;
            } else {
                if (i === 0 || j === 0) {
                    num[i][j] = 1;
                } else {
                    num[i][j] = 1 + num[i - 1][j - 1];
                }

                if (num[i][j] > maxlen) {
                    maxlen = num[i][j];
                    thisSubsBegin = i - num[i][j] + 1;
                    if (lastSubsBegin === thisSubsBegin) {
                        // if the current LCS is the same as the last time this block ran
                        sequence += str1[i];
                    } else {
                        // this block resets the string builder if a different LCS is found
                        lastSubsBegin = thisSubsBegin;
                        sequence = ''; // clear it
                        sequence += str1.substr(lastSubsBegin, i + 1 - lastSubsBegin);
                    }
                }
            }
        }
    }
    return {
        length: maxlen,
        sequence: sequence,
        offset: thisSubsBegin,
    };
}

function findBestLCS(mainItem, targetItems) {
    const results = [];
    let bestMatchIndex = 0;

    for (let i = 0; i < targetItems.length; i++) {
        const currentLCS = lcs(mainItem.name, targetItems[i].name);
        results.push({ target: targetItems[i], lcs: currentLCS });
        if (currentLCS.length > results[bestMatchIndex].lcs.length) {
            bestMatchIndex = i;
        }
    }

    const bestMatch = results[bestMatchIndex];

    return { allLCS: results, bestMatch: bestMatch, bestMatchIndex: bestMatchIndex };
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function api(url, data, headers, method, retry) {
    headers = headers || {};
    Object.assign(headers, baseHeader);
    Object.assign(headers, {
        Cookie: cookie || '',
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
    if (resp.headers['set-cookie']) {
        const puus = resp.headers['set-cookie'].join(';;;').match(/__puus=([^;]+)/);
        if (puus) {
            if (cookie.match(/__puus=([^;]+)/)[1] != puus[1]) {
                cookie = cookie.replace(/__puus=[^;]+/, `__puus=${puus[1]}`);
                await localDb.push(`/quark/${ckey}`, cookie);
            }
        }
    }
    if (resp.status === 429 && leftRetry > 0) {
        await delay(1000);
        return await api(url, data, headers, method, leftRetry - 1);
    }
    return resp.data || {};
}

async function clearSaveDir() {
    const listData = await api(`file/sort?${pr}&pdir_fid=${saveDirId}&_page=1&_size=200&_sort=file_type:asc,updated_at:desc`, {}, {}, 'get');
    if (listData.data && listData.data.list && listData.data.list.length > 0) {
        const del = await api(`file/delete?${pr}`, {
            action_type: 2,
            filelist: listData.data.list.map((v) => v.fid),
            exclude_fids: [],
        });
        console.log(del);
    }
}

async function createSaveDir(clean) {
    if (saveDirId) {
        // 删除所有子文件
        if (clean) await clearSaveDir();
        return;
    }
    const listData = await api(`file/sort?${pr}&pdir_fid=0&_page=1&_size=200&_sort=file_type:asc,updated_at:desc`, {}, {}, 'get');
    if (listData.data && listData.data.list)
        for (const item of listData.data.list) {
            if (item.file_name === saveDirName) {
                saveDirId = item.fid;
                await clearSaveDir();
                break;
            }
        }
    if (!saveDirId) {
        const create = await api(`file?${pr}`, {
            pdir_fid: '0',
            file_name: saveDirName,
            dir_path: '',
            dir_init_lock: false,
        });
        console.log(create);
        if (create.data && create.data.fid) {
            saveDirId = create.data.fid;
        }
    }
}

async function getShareToken(shareData) {
    if (!shareTokenCache[shareData.shareId]) {
        delete shareTokenCache[shareData.shareId];
        const shareToken = await api(`share/sharepage/token?${pr}`, {
            pwd_id: shareData.shareId,
            passcode: shareData.sharePwd || '',
        });
        if (shareToken.data && shareToken.data.stoken) {
            shareTokenCache[shareData.shareId] = shareToken.data;
        }
    }
}

const subtitleExts = ['.srt', '.ass', '.scc', '.stl', '.ttml'];

export async function getFilesByShareUrl(shareInfo) {
    const shareData = typeof shareInfo === 'string' ? getShareData(shareInfo) : shareInfo;
    if (!shareData) return [];
    await getShareToken(shareData);
    if (!shareTokenCache[shareData.shareId]) return [];
    const videos = [];
    const subtitles = [];
    const listFile = async function (shareId, folderId, page) {
        const prePage = 200;
        page = page || 1;
        const listData = await api(`share/sharepage/detail?${pr}&pwd_id=${shareId}&stoken=${encodeURIComponent(shareTokenCache[shareId].stoken)}&pdir_fid=${folderId}&force=0&_page=${page}&_size=${prePage}&_sort=file_type:asc,file_name:asc`, {}, {}, 'get');
        if (!listData.data) return [];
        const items = listData.data.list;
        if (!items) return [];
        const subDir = [];

        for (const item of items) {
            if (item.dir === true) {
                subDir.push(item);
            } else if (item.file === true && item.obj_category === 'video') {
                if (item.size < 1024 * 1024 * 5) continue;
                item.stoken = shareTokenCache[shareData.shareId].stoken;
                videos.push(item);
            } else if (item.type === 'file' && subtitleExts.some((x) => item.file_name.endsWith(x))) {
                subtitles.push(item);
            }
        }

        if (page < Math.ceil(listData.metadata._total / prePage)) {
            const nextItems = await listFile(shareId, folderId, page + 1);
            for (const item of nextItems) {
                items.push(item);
            }
        }

        for (const dir of subDir) {
            const subItems = await listFile(shareId, dir.fid);
            for (const item of subItems) {
                items.push(item);
            }
        }

        return items;
    };
    await listFile(shareData.shareId, shareData.folderId);
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

const saveFileIdCaches = {};

async function save(shareId, stoken, fileId, fileToken, clean) {
    await createSaveDir(clean);
    if (clean) {
        const saves = Object.keys(saveFileIdCaches);
        for (const save of saves) {
            delete saveFileIdCaches[save];
        }
    }
    if (!saveDirId) return null;
    if (!stoken) {
        await getShareToken({
            shareId: shareId,
        });
        if (!shareTokenCache[shareId]) return null;
    }
    const saveResult = await api(`share/sharepage/save?${pr}`, {
        fid_list: [fileId],
        fid_token_list: [fileToken],
        to_pdir_fid: saveDirId,
        pwd_id: shareId,
        stoken: stoken || shareTokenCache[shareId].stoken,
        pdir_fid: '0',
        scene: 'link',
    });
    if (saveResult.data && saveResult.data.task_id) {
        let retry = 0;
        // wait task finish
        while (true) {
            const taskResult = await api(`task?${pr}&task_id=${saveResult.data.task_id}&retry_index=${retry}`, {}, {}, 'get');
            if (taskResult.data && taskResult.data.save_as && taskResult.data.save_as.save_as_top_fids && taskResult.data.save_as.save_as_top_fids.length > 0) {
                return taskResult.data.save_as.save_as_top_fids[0];
            }
            retry++;
            if (retry > 5) break;
            await delay(1000);
        }
    }
    return false;
}

export async function getLiveTranscoding(shareId, stoken, fileId, fileToken) {
    if (!saveFileIdCaches[fileId]) {
        const saveFileId = await save(shareId, stoken, fileId, fileToken, true);
        if (!saveFileId) return null;
        saveFileIdCaches[fileId] = saveFileId;
    }
    const transcoding = await api(`file/v2/play?${pr}`, {
        fid: saveFileIdCaches[fileId],
        resolutions: 'normal,low,high,super,2k,4k',
        supports: 'fmp4',
    });
    if (transcoding.data && transcoding.data.video_list) {
        return transcoding.data.video_list;
    }
    return null;
}

export async function getDownload(shareId, stoken, fileId, fileToken, clean) {
    if (!saveFileIdCaches[fileId]) {
        const saveFileId = await save(shareId, stoken, fileId, fileToken, clean);
        if (!saveFileId) return null;
        saveFileIdCaches[fileId] = saveFileId;
    }
    const down = await api(`file/download?${pr}`, {
        fids: [saveFileIdCaches[fileId]],
    });
    if (down.data) {
        return down.data[0];
    }
    return null;
}

async function testSupport(url, headers) {
    const resp = await req
        .get(url, {
            responseType: 'stream',
            headers: Object.assign(
                {
                    Range: 'bytes=0-0',
                },
                headers,
            ),
        })
        .catch((err) => {
            console.error(err);
            return err.response || { status: 500, data: {} };
        });
    if (resp && resp.status === 206) {
        const isAccept = resp.headers['accept-ranges'] === 'bytes';
        const contentRange = resp.headers['content-range'];
        const contentLength = parseInt(resp.headers['content-length']);
        const isSupport = isAccept || !!contentRange || contentLength === 1;
        const length = contentRange ? parseInt(contentRange.split('/')[1]) : contentLength;
        delete resp.headers['content-range'];
        delete resp.headers['content-length'];
        if (length) resp.headers['content-length'] = length.toString();
        return [isSupport, resp.headers];
    } else {
        return [false, null];
    }
}

const urlHeadCache = {};
let currentUrlKey = '';
const cacheRoot = (process.env['NODE_PATH'] || '.') + '/quark_cache';
const maxCache = 1024 * 1024 * 100;

function delAllCache(keepKey) {
    try {
        fs.readdir(cacheRoot, (_, files) => {
            if (files)
                for (const file of files) {
                    if (file === keepKey) continue;
                    const dir = join(cacheRoot, file);
                    fs.stat(dir, (_, stats) => {
                        if (stats && stats.isDirectory()) {
                            fs.readdir(dir, (_, subFiles) => {
                                if (subFiles)
                                    for (const subFile of subFiles) {
                                        if (!subFile.endsWith('.p')) {
                                            fs.rm(join(dir, subFile), { recursive: true }, () => {});
                                        }
                                    }
                            });
                        }
                    });
                }
        });
    } catch (error) {
        console.error(error);
    }
}

export async function chunkStream(inReq, outResp, url, urlKey, headers, option) {
    urlKey = urlKey || CryptoJS.enc.Hex.stringify(CryptoJS.MD5(url)).toString();
    if (currentUrlKey !== urlKey) {
        delAllCache(urlKey);
        currentUrlKey = urlKey;
    }
    if (!urlHeadCache[urlKey]) {
        const [isSupport, urlHeader] = await testSupport(url, headers);
        if (!isSupport || !urlHeader['content-length']) {
            outResp.redirect(url);
            return;
        }
        urlHeadCache[urlKey] = urlHeader;
    }
    let exist = true;
    await fs.promises.access(join(cacheRoot, urlKey)).catch((_) => (exist = false));
    if (!exist) {
        await fs.promises.mkdir(join(cacheRoot, urlKey), { recursive: true });
    }
    const contentLength = parseInt(urlHeadCache[urlKey]['content-length']);
    let byteStart = 0;
    let byteEnd = contentLength - 1;
    const streamHeader = {};
    if (inReq.headers.range) {
        // console.log(inReq.id, inReq.headers.range);
        const ranges = inReq.headers.range.trim().split(/=|-/);
        if (ranges.length > 2 && ranges[2]) {
            byteEnd = parseInt(ranges[2]);
        }
        byteStart = parseInt(ranges[1]);
        Object.assign(streamHeader, urlHeadCache[urlKey]);
        streamHeader['content-length'] = (byteEnd - byteStart + 1).toString();
        streamHeader['content-range'] = `bytes ${byteStart}-${byteEnd}/${contentLength}`;
        outResp.code(206);
    } else {
        Object.assign(streamHeader, urlHeadCache[urlKey]);
        outResp.code(200);
    }
    option = option || { chunkSize: 1024 * 256, poolSize: 5, timeout: 1000 * 10 };
    const chunkSize = option.chunkSize;
    const poolSize = option.poolSize;
    const timeout = option.timeout;
    let chunkCount = Math.ceil(contentLength / chunkSize);
    let chunkDownIdx = Math.floor(byteStart / chunkSize);
    let chunkReadIdx = chunkDownIdx;
    let stop = false;
    const dlFiles = {};
    for (let i = 0; i < poolSize && i < chunkCount; i++) {
        new Promise((resolve) => {
            (async function doDLTask(spChunkIdx) {
                if (stop || chunkDownIdx >= chunkCount) {
                    resolve();
                    return;
                }
                if (spChunkIdx === undefined && (chunkDownIdx - chunkReadIdx) * chunkSize >= maxCache) {
                    setTimeout(doDLTask, 5);
                    return;
                }
                const chunkIdx = spChunkIdx || chunkDownIdx++;
                const taskId = `${inReq.id}-${chunkIdx}`;
                try {
                    const dlFile = join(cacheRoot, urlKey, `${inReq.id}-${chunkIdx}.p`);
                    let exist = true;
                    await fs.promises.access(dlFile).catch((_) => (exist = false));
                    if (!exist) {
                        const start = chunkIdx * chunkSize;
                        const end = Math.min(contentLength - 1, (chunkIdx + 1) * chunkSize - 1);
                        console.log(inReq.id, chunkIdx);
                        const dlResp = await req.get(url, {
                            responseType: 'stream',
                            timeout: timeout,
                            headers: Object.assign(
                                {
                                    Range: `bytes=${start}-${end}`,
                                },
                                headers,
                            ),
                        });
                        const dlCache = join(cacheRoot, urlKey, `${inReq.id}-${chunkIdx}.dl`);
                        const writer = fs.createWriteStream(dlCache);
                        const readTimeout = setTimeout(() => {
                            writer.destroy(new Error(`${taskId} read timeout`));
                        }, timeout);
                        const downloaded = new Promise((resolve) => {
                            writer.on('finish', async () => {
                                if (stop) {
                                    await fs.promises.rm(dlCache).catch((e) => console.error(e));
                                } else {
                                    await fs.promises.rename(dlCache, dlFile).catch((e) => console.error(e));
                                    dlFiles[taskId] = dlFile;
                                }
                                resolve(true);
                            });
                            writer.on('error', async (e) => {
                                console.error(e);
                                await fs.promises.rm(dlCache).catch((e1) => console.error(e1));
                                resolve(false);
                            });
                        });
                        dlResp.data.pipe(writer);
                        const result = await downloaded;
                        clearTimeout(readTimeout);
                        if (!result) {
                            setTimeout(() => {
                                doDLTask(chunkIdx);
                            }, 15);
                            return;
                        }
                    }
                    setTimeout(doDLTask, 5);
                } catch (error) {
                    console.error(error);
                    setTimeout(() => {
                        doDLTask(chunkIdx);
                    }, 15);
                }
            })();
        });
    }

    outResp.headers(streamHeader);
    const stream = new PassThrough();
    new Promise((resolve) => {
        let writeMore = true;
        (async function waitReadFile() {
            try {
                if (chunkReadIdx >= chunkCount || stop) {
                    stream.end();
                    resolve();
                    return;
                }
                if (!writeMore) {
                    setTimeout(waitReadFile, 5);
                    return;
                }
                const taskId = `${inReq.id}-${chunkReadIdx}`;
                if (!dlFiles[taskId]) {
                    setTimeout(waitReadFile, 5);
                    return;
                }
                const chunkByteStart = chunkReadIdx * chunkSize;
                const chunkByteEnd = Math.min(contentLength - 1, (chunkReadIdx + 1) * chunkSize - 1);
                const readFileStart = Math.max(byteStart, chunkByteStart) - chunkByteStart;
                const dlFile = dlFiles[taskId];
                delete dlFiles[taskId];
                const fd = await fs.promises.open(dlFile, 'r');
                const buffer = Buffer.alloc(chunkByteEnd - chunkByteStart - readFileStart + 1);
                await fd.read(buffer, 0, chunkByteEnd - chunkByteStart - readFileStart + 1, readFileStart);
                await fd.close().catch((e) => console.error(e));
                await fs.promises.rm(dlFile).catch((e) => console.error(e));
                writeMore = stream.write(buffer);
                if (!writeMore) {
                    stream.once('drain', () => {
                        writeMore = true;
                    });
                }
                chunkReadIdx++;
                setTimeout(waitReadFile, 5);
            } catch (error) {
                setTimeout(waitReadFile, 5);
            }
        })();
    });
    stream.on('close', async () => {
        Object.keys(dlFiles).forEach((reqKey) => {
            if (reqKey.startsWith(inReq.id)) {
                fs.rm(dlFiles[reqKey], { recursive: true }, () => {});
                delete dlFiles[reqKey];
            }
        });
        stop = true;
    });
    return stream;
}
