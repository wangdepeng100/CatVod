import douban from './spider/video/douban.js';
import kkys from './spider/video/kkys.js';
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
import baipiaoys from './spider/video/baipiaoys.js';
import tudou from './spider/video/tudou.js';
import wobg from './spider/video/wobg.js';
import xzys from './spider/video/xzys.js';
import libvio from './spider/video/libvio.js';
import ttkx from './spider/video/ttkx.js';
import cm from './spider/video/cm.js';
import nongmin from './spider/video/nongmin.js';
import yunpanres from './spider/video/yunpanres.js';
import xiaoya from './spider/video/xiaoya.js';
import af from './spider/video/anfun.js';
import ysche from './spider/video/ysche.js';
import cntv from './spider/video/cntv.js';
import zxzj from './spider/video/zxzj.js';
import nangua from './spider/video/ng.js';
import nicoletv from './spider/video/nicoletv.js';
import coco from './spider/book/coco.js';
import fengche from './spider/book/fengche.js';
import xxpan from './spider/video/xxpan.js';
import bqr from './spider/video/bqr.js';
import yingso from './spider/video/yingso.js';
import pikaso from './spider/video/pikaso.js';
import ikanbot from './spider/video/ikanbot.js';
import upyun from './spider/video/upyun.js';
import pansearch from './spider/video/pansearch.js';
import yiso from './spider/video/yiso.js';
import czzy from './spider/video/czzy.js';
import ddys from './spider/video/ddys.js';
import rrys from './spider/video/rrys.js';
import live from './spider/video/live.js';
import huya from './spider/video/huya.js';
import bili from './spider/video/bili.js';
import ktv from './spider/video/ktv.js';
import xinshijue from './spider/video/xinshijue1.js';
import appys from './spider/video/appys.js';
import _360ba from './spider/video/_360ba.js';
import douyu from './spider/video/douyu.js';
import subaibai from './spider/video/subaibai.js';
import sharenice from './spider/video/sharenice.js';
import boo from './spider/video/boo.js';
import ttian from './spider/video/ttian.js';
import meijumi from './spider/video/meijumi.js';
import ys996 from './spider/video/ys996.js';
import tuxiaobei from './spider/video/tuxiaobei.js';
import ub from './spider/video/ub.js';
import wf from './spider/video/wf.js';
import nkvod from './spider/video/nkvod.js';
import klm from './spider/video/klm.js';
import saohuo from './spider/video/saohuo.js';
import jojo from './spider/video/jojo.js';
import mayiya from './spider/video/mayiya.js';
import kunyu77 from './spider/video/kunyu77.js';
import m3u8cj from './spider/video/m3u8cj.js';
import ly from './spider/video/ly.js';
import baseset from './spider/video/baseset.js';
import maoli from './spider/video/maoli.js';
import qupan from './spider/video/qupan.js';
import duanjuku from './spider/video/duanjuku.js';
import jihehe from './spider/video/jihehe.js';
import aipan from './spider/video/aipan.js';
import clicli from './spider/video/clicli.js';
import qkpanso from './spider/video/qkpanso.js';
import xzt from './spider/video/xzt.js';
import mipan from './spider/video/mipan.js';
import juzi from './spider/video/juzi.js';
import zhaozy from './spider/video/zhaozy.js';
import lbpp from './spider/video/lbpp.js';
import am from './spider/video/am.js';


















const spiders = [douban,live,am,wogg,wobg,tudou,lbpp,kkys,czzy,ikanbot,nangua,ttian,ttkx,meijumi,zxzj,xinshijue,ddys,nongmin,rrys,nkvod,xiaoya,yunpanres,xzys,klm,libvio,subaibai,kunyu77,nicoletv,clicli,boo,tuxiaobei,ub,cntv,huya,douyu,bili,_360ba,ktv,sharenice,mayiya,m3u8cj,appys,xzt,yingso,bqr,duanjuku,jihehe,upyun,pansearch,zhaozy,mipan,qupan,qkpanso,juzi,aipan,pikaso,xxpan,yiso, push, alist, _13bqg, laobaigs,ts230,bookan, copymanga,bg,fengche,baozimh,coco];
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
