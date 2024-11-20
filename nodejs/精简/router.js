import douban from './spider/video/douban.js';
import kunyu77 from './spider/video/kunyu77.js';
import kkys from './spider/video/kkys.js';
import push from './spider/video/push.js';
import alist from './spider/pan/alist.js';
import _13bqg from './spider/book/13bqg.js';
import copymanga from './spider/book/copymanga.js';
import bg from './spider/book/bengou.js';
import baozimh from './spider/book/baozimh.js';
import laobaigs from './spider/book/laobaigs.js';
import bookan from './spider/book/bookan.js';
import nm from './spider/video/nm.js';
import yunpanres from './spider/video/yunpanres.js';
import af from './spider/video/anfun.js';
import nangua from './spider/video/ng.js';
import nicoletv from './spider/video/nicoletv.js';
import coco from './spider/book/coco.js';
import fengche from './spider/book/fengche.js';
import xxpan from './spider/video/xxpan.js';
import bqr from './spider/video/bqr.js';
import yingso from './spider/video/yingso.js';
import ikanbot from './spider/video/ikanbot.js';
import upyun from './spider/video/upyun.js';
import pansearch from './spider/video/pansearch.js';
import yiso from './spider/video/yiso.js';
import czzy from './spider/video/czzy.js';
import ddys from './spider/video/ddys.js';
import meijumi from './spider/video/meijumi.js';
import ttian from './spider/video/ttian.js';
import live from './spider/video/live.js';
import ttkx from './spider/video/ttkx.js';







const spiders = [douban,live,wogg,wobg,tudou,kkys,czzy,ikanbot,kunyu77,nangua,ddys,nm,ttian,ttkx,baipiaoys,meijumi,af,nicoletv,yingso,bqr,xxpan,upyun,pansearch,yiso, push, alist, _13bqg, laobaigs,bookan, copymanga,bg,fengche,baozimh,coco];
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
