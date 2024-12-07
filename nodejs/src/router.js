import douban from './spider/video/douban.js';
import push from './spider/video/push.js';
import alist from './spider/pan/alist.js';
import _13bqg from './spider/book/13bqg.js';
import copymanga from './spider/book/copymanga.js';
import bg from './spider/book/bengou.js';
import baozimh from './spider/book/baozimh.js';
import laobaigs from './spider/book/laobaigs.js';
import ts230 from './spider/book/230ts.js';
import bookan from './spider/book/bookan.js';
import vcm3u8 from './spider/video/vcm3u8.js';
import wogg from './spider/video/wogg.js';
import xzys from './spider/video/xzys.js';
import nongmin from './spider/video/nongmin.js';
import yunpanres from './spider/video/yunpanres.js';
import xiaoya from './spider/video/xiaoya.js';
import af from './spider/video/anfun.js';
import ysche from './spider/video/ysche.js';
import cntv from './spider/video/cntv.js';
import zxzj from './spider/video/zxzj.js';
import nangua from './spider/video/ng.js';
import coco from './spider/book/coco.js';
import fengche from './spider/book/fengche.js';
import ikanbot from './spider/video/ikanbot.js';
import czzy from './spider/video/czzy.js';
import hezi from './spider/video/hezi.js';
import ddys from './spider/video/ddys.js';
import rrys from './spider/video/rrys.js';
import live from './spider/video/live.js';
import huya from './spider/video/huya.js';
import bili from './spider/video/bili.js';
import appys from './spider/video/appys.js';
import _360ba from './spider/video/_360ba.js';
import douyu from './spider/video/douyu.js';
import subaibai from './spider/video/subaibai.js';
import ttian from './spider/video/ttian.js';
import meijumi from './spider/video/meijumi.js';
import klm from './spider/video/klm.js';
import m3u8cj from './spider/video/m3u8cj.js';
import baseset from './spider/video/baseset.js';
import clicli from './spider/video/clicli.js';
import xzt from './spider/video/xzt.js';
import lbpp from './spider/video/lbpp.js';
import am from './spider/video/am.js';


const spiders = [douban,live,am,wogg,wobg,tudou,lbpp,xiaoya,yunpanres,xzys,meijumi,kkys,czzy,hezi,ikanbot,nangua,ttian,zxzj,ddys,nongmin,rrys,klm,subaibai,cntv,huya,douyu,bili,clicli,_360ba,m3u8cj,appys, push, baseset, alist, _13bqg, laobaigs,ts230,bookan, copymanga,bg,fengche,baozimh,coco];
const spiderPrefix = '/spider';

/**
 * A function to initialize the router.
 *
 * @param {Object} fastify - The Fastify instance
 * @return {Promise<void>} - A Promise that resolves when the router is initialized
 */
export default async function router(fastify) {
    // register all spider router
    spiders.forEach((spider) => {
        const path = spiderPrefix + '/' + spider.meta.key + '/' + spider.meta.type;
        fastify.register(spider.api, { prefix: path });
        console.log('Register spider: ' + path);
    });
    /**
     * @api {get} /check 检查
     */
    fastify.register(
        /**
         *
         * @param {import('fastify').FastifyInstance} fastify
         */
        async (fastify) => {
            fastify.get(
                '/check',
                /**
                 * check api alive or not
                 * @param {import('fastify').FastifyRequest} _request
                 * @param {import('fastify').FastifyReply} reply
                 */
                async function (_request, reply) {
                    reply.send({ run: !fastify.stop });
                }
            );
            fastify.get(
                '/config',
                /**
                 * get catopen format config
                 * @param {import('fastify').FastifyRequest} _request
                 * @param {import('fastify').FastifyReply} reply
                 */
                async function (_request, reply) {
                    const config = {
                        video: {
                            sites: [],
                        },
                        read: {
                            sites: [],
                        },
                        comic: {
                            sites: [],
                        },
                        music: {
                            sites: [],
                        },
                        pan: {
                            sites: [],
                        },
                        color: fastify.config.color || [],
                    };
                    spiders.forEach((spider) => {
                        let meta = Object.assign({}, spider.meta);
                        meta.api = spiderPrefix + '/' + meta.key + '/' + meta.type;
                        meta.key = 'nodejs_' + meta.key;
                        const stype = spider.meta.type;
                        if (stype < 10) {
                            config.video.sites.push(meta);
                        } else if (stype >= 10 && stype < 20) {
                            config.read.sites.push(meta);
                        } else if (stype >= 20 && stype < 30) {
                            config.comic.sites.push(meta);
                        } else if (stype >= 30 && stype < 40) {
                            config.music.sites.push(meta);
                        } else if (stype >= 40 && stype < 50) {
                            config.pan.sites.push(meta);
                        }
                    });
                    reply.send(config);
                }
            );
        }
    );
}
