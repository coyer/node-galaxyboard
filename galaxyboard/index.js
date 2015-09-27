"use strict";

var GBFlags = require("./GBFlags");

var mysql = require("mysql");
var crypto = require("crypto");
var async = require("async");
var fs = require("fs");
var queryBuilder = require('squiggle');
var entities = require('./entities');
var injectPromise = require('./InjectPromise.js');

module.exports = function GalaxyBoard(config) {

    if (!(this instanceof GalaxyBoard)) {
        return new GalaxyBoard(config);
    }
    var self = this;
    var __COOKIENAME__ = config.mysql.database;
    var __SECRETPEPPER__ = config.board.pepper;

    //  PAB-Konfiguration
    var iPostsPerPage = 20;

    //  Create instance of MySQL
    var mysqlPool = mysql.createPool(config.mysql);

    //
    //  Board API
    //
    self.processCommands = function (req, res, onFinish, mockUser) {
        var aCmd = JSON.parse(req.body.cmd);
        var amJSON = [];
        var self = this;
        var mUser = null;   //  current User
        var mBoard = null;   //  current Boardstructure (suitable for current User)
        var iLTDate = 0;      //  newest postdate; if this is higher than that a user knows a new boardstruct will be send
        var mModlist = null;   //  Gecachte Moderatorenliste. Kann sp�ter global werden damit man sich SQLs spart.
        var mGrouplist = null;   //  Forenzugriffe

        //  Zun�chst muss das Userobjekt und Boardobjekt initialisiert werden.
        //  Danach werden die einzelnen API-Befehle ausgef�hrt.
        async.series([
                //  Initialize mUser (if userId==0 then try to use Id from Cookie)
                function (next) {
                    initUser(0, next);  //  Uses req + res from this scope
                },
                //  Initialize Board
                function (next) {
                    initBoard(next);    //  Uses req + res from this scope
                }],
            //  Process commands
            function () {
                async.forEach(aCmd,
                    function (command, next) {
                        if (!self[command.cmd]) {
                            console.log(command.cmd, "not found.");
                            return next();
                        }
                        console.log("executing command", command);
                        self[command.cmd](command, next);
                    },
                    function () {
                        onFinish(amJSON);
                    }
                );
            }
        );

        //  Bestimmt die Zugriffsrechte auf ein bestimmtes Board
        function ixCheckBoardAccess(iThreadID) {
            //  Pr�ft den Zugriff auf das Board. 
            var iBoardFlags = 0;   //  default keine Rechte
            var iExtendFlags = 0;

            //  Existiert eine Gruppe?
            if (mGrouplist[iThreadID]) {
                //  Dann diese Gruppe durchgehen und schauen ob wir als User bzw. als Gruppenmitglied enthalten sind:
                for (var groupid in mGrouplist[iThreadID]) {
                    if ((groupid < 0 && mUser["groups"].indexOf(parseInt(groupid)) != -1) || groupid == mUser["id"]) {
                        iBoardFlags |= mGrouplist[iThreadID][groupid]["bflags"];
                        iExtendFlags |= mGrouplist[iThreadID][groupid]["eflags"];
                    }
                }
            }
            return {"board": iBoardFlags, "extended": iExtendFlags}; //[iBoardFlags,iExtendFlags];
        }

        //  Bestimmt Zugriffsrechte f�r Moderatoren
        function ixGetModFlags(iThreadID, mCachedBoard) {
            //  Pr�ft den Zugriff auf das Board. 
            var iFlags = 0;   //  default keine Rechte
            if (!mCachedBoard)
                mCachedBoard = mBoard;

            if (!mCachedBoard) {
                console.log("ERROR: Board not available!");
                console.log(req.url);
                return 0;
            }

            if (!mCachedBoard[iThreadID])
                return 0;

            //  Rechteliste
            var aBoardPath = [mCachedBoard[iThreadID]];    //  Ausgangs-Board
            var iMaxDepth = 100;
            while (aBoardPath[aBoardPath.length - 1]["pid"] > 0) {   //  bis zum Rootknoten aufsteigen und "Eltern" eintragen
                aBoardPath.push(mCachedBoard[aBoardPath[aBoardPath.length - 1]["pid"]]);
                iMaxDepth--;
                if (!iMaxDepth)
                    break;
            }
            //  aBoardPath ist in aufsteigender Reihenfolge und ist auch gut so... ggf. wollen wir ein "Recht" einer Gruppe in einer Untergruppe beschr�nken
            aBoardPath.forEach(function (mBoard) {
                //  Existiert eine Gruppe?
                if (mModlist[mBoard["id"]]) {
                    //  Dann diese Gruppe durchgehen und schauen ob wir als User bzw. als Gruppenmitglied enthalten sind:
                    for (var groupid in mModlist[mBoard["id"]]) {
                        if (groupid == mUser["id"] || (groupid < 0 && mUser["groups"].indexOf(parseInt(groupid)) != -1)) {
                            iFlags |= mModlist[mBoard["id"]][groupid]["flags"];   //  Wir sind in der Gruppe!
                        }
                    }
                }
            });
            return iFlags;  //  XXX deal 64 bit; seems i am using only 32bit for modGBFlags.
        }

        function mxGetTopic(iTopicID, cb) {
            //"""Liefert Topic anhand topicID."""
            //#+---------+---------+------+-------+--------+------+---------+----------+----------+-------+------------+--------------+
            //#| topicid | boardid | hits | posts | voting | icon | userid  | username | headline | flags | lastpostid | lastpostdate |
            //#+---------+---------+------+-------+--------+------+---------+----------+----------+-------+------------+--------------+
            mysqlPool.query(
                "select * from topics where topicid=? limit 1", [iTopicID],
                function (err, results, fields) {
                    if (!results.length) cb(null);
                    var mTopic = results[0];

                    //  Rechte patchen:
                    var mPerms = {"modflags": 0, "topicflags": 0, "boardflags": 0, "extendflags": 0};
                    var iThreadID = mTopic["boardid"];

                    //  Rechte bestimmen
                    var flags = ixCheckBoardAccess(iThreadID);
                    mPerms["boardflags"] = flags.board;
                    mPerms["extendflags"] = flags.extended;
                    mPerms["modflags"] = ixGetModFlags(iThreadID);
                    mPerms["topicflags"] = mTopic["flags"];
                    mTopic["perms"] = mPerms;
                    cb(mTopic);
                }
            )
        }

        //  gets Userdata (always called)
        function initUser(iUserID, next) {
            //  User anhand cookie identifizieren und aus DB lesen
            //  Kein User = default Guest
            mUser = {
                "id": 0,
                "nick": "Guest",
                "flags": 0,
                "groups": [-1],
                "posts": 0,
                "titel": "",
                "created": 0,
                "messages": 0,
                "lastlogin": 0
            };   //  BasicInfo
            if (!iUserID) {
                if (!req.cookies[__COOKIENAME__]) {
                    //  no cookie, no user
                    amJSON.push({"event": "newUser", "data": mUser});
                    return next();
                }

                //  If a cookie is present, 1st Part is UserID
                var tmp = req.cookies[__COOKIENAME__].split(".");
                iUserID = parseInt(tmp[0], 10);

                //  Check if cookiehash matches calculated hash
                var hash = crypto.createHash("sha1").update(iUserID + '.' + __COOKIENAME__ + '.' + __SECRETPEPPER__).digest("hex");
                if (hash != tmp[1]) {
                    amJSON.push({"event": "showError", "data": "Invalid cookie."});
                    //  Delete cookie
                    res.clearCookie(__COOKIENAME__);
                    amJSON.push({"event": "newUser", "data": mUser});
                    return next();
                }
            }
            //  Do some SQL
            //  Check if User is banned
            mysqlPool.query(
                "select * from banlist where ban_userid=? and ban_end > unix_timestamp(now()) limit 1", [iUserID],
                function (err, results, fields) {
                    if (err) {
                        console.log(["initUser", err]);
                    }
                    if (results && results.length) {
                        mysqlPool.end();
                        amJSON.push({"event": "showError", "data": results[0]["ban_give_reason"]});
                        //  Delete cookie
                        res.clearCookie(__COOKIENAME__);
                        amJSON.push({"event": "newUser", "data": mUser});
                        return next();
                    }
                    //  User not banned; selecting data
                    mysqlPool.query(
                        "select  id, nick, country, city, email, unix_timestamp(created) as created, unix_timestamp(lastlogin) as lastlogin, posts, flags, titel, signature, language from users where id=?", [iUserID],
                        function (err, results, fields) {
                            if (err) {
                                console.log(err);
                                amJSON.push({"event": "newUser", "data": mUser});
                                return next()
                            }
                            //console.log(results);
                            if (results.length) {
                                //  Use result as UserData
                                mUser = results[0];
                                mUser["groups"] = [-1, -2];   //  User hat  Gast + Registriert Zugang
                                //  Gruppen + Rechte auslesen; GruppenID ist negativ!!!
                                mysqlPool.query(
                                    "select groupid from group_members where userid=?", [iUserID],
                                    function (err, results, fields) {
                                        if (!err && results.length) {
                                            for (var i = 0; i < results.length; i++)
                                                mUser["groups"].push(-results[i].groupid);
                                        }
                                        //  Last set Lastlogin
                                        var iLastLogin = new Date().getTime() / 1000;
                                        mUser["lastlogin"] = iLastLogin;
                                        mysqlPool.query(
                                            "update users set lastlogin=from_unixtime(?) where id=?", [iLastLogin, iUserID],
                                            function () {
                                                //  Offene Nachrichten ermitteln
                                                mysqlPool.query("select count(id) as messages from messages where userid=? and flag&1=0", [iUserID],
                                                    function (err, results) {
                                                        if (results && results.length) {
                                                            mUser["messages"] = results[0]["messages"];
                                                            amJSON.push({
                                                                "event": "newMessageCount",
                                                                "data": mUser["messages"]
                                                            })
                                                        }
                                                        amJSON.push({"event": "newUser", "data": mUser});
                                                        return next();
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            } else {
                                //  no data stored; keep user as guest.
                                amJSON.push({"event": "newUser", "data": mUser});
                                return next();
                            }
                        }
                    );
                }
            );
        }

        function initBoard(next) {
            //"""Liefert alle Threads zurueck; ggf gefiltert anhand Zugriffsrechten"""
            //#+---------+---------------+--------+------------+-----------+-------------+---------+-----------+------------+-----------+----------+-------------+---------+
            //#| boardid | parentboardid | sortid | topiccount | postcount | lasttopicid | boardid | prunedays | boardflags | boardrule | headline | description | prefixe |
            //#+---------+---------------+--------+------------+-----------+-------------+---------+-----------+------------+-----------+----------+-------------+---------+
            async.series([
                    //  Moderatorenliste:
                    //  --------------------------------------------------------------------------------------------------------------------------------------
                    function getModlist(cb) {
                        //  Modliste bereits initialisiert?
                        if (mModlist != null)
                            return cb();

                        //  Neue Modliste erstellen:
                        mModlist = {};
                        mysqlPool.query(
                            "select sql_cache a.boardid, a.userid,a.flags&0xffffffff as flags,b.nick as name from mods a left join users b on b.id=a.userid where a.userid>0",
                            function (err, results, fields) {
                                if (err) {
                                    console.log(["getModlist", err]);
                                    amJSON.push({"event": "showError", "data": err.message});
                                    cb();
                                } else {
                                    results.forEach(function (subset) {
                                        if (!mModlist[subset["boardid"]])
                                            mModlist[subset["boardid"]] = {};
                                        mModlist[subset["boardid"]][subset["userid"]] = subset;
                                    });
                                    //  Es gibt auch Gruppen welche als Moderatoren gehen wuerden:
                                    mysqlPool.query(
                                        "select sql_cache a.boardid, a.userid,a.flags&0xffffffff as flags,b.description as name from mods a left join groups b on b.groupid=-a.userid where a.userid<0",
                                        function (err, results, fields) {
                                            if (err) {
                                                console.log(["getModlist", err]);
                                            } else {
                                                results.forEach(function (subset) {
                                                    if (!mModlist[subset["boardid"]])
                                                        mModlist[subset["boardid"]] = {};
                                                    mModlist[subset["boardid"]][subset["userid"]] = subset;
                                                })
                                            }
                                            cb();
                                        }
                                    );
                                }
                            }
                        );
                    },
                    //  Forenzugriffe (Gruppen und User):
                    //  --------------------------------------------------------------------------------------------------------------------------------------
                    function getGrouplist(cb) {
                        //  Bereits eine Gruppenliste vorhanden?
                        if (mGrouplist != null)
                            return cb();    //  Skip

                        //  Neue Gruppenliste erstellen:
                        mGrouplist = {};
                        mysqlPool.query(
                            "select sql_cache a.boardid, a.accessid, a.bflags,a.eflags,b.nick as name from board_acl a left join users b on b.id = a.accessid where a.accessid>0",
                            function (err, results, fields) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    results.forEach(function (subset) {
                                        if (!mGrouplist[subset["boardid"]])
                                            mGrouplist[subset["boardid"]] = {};
                                        mGrouplist[subset["boardid"]][subset["accessid"]] = subset;
                                    });
                                }
                                //  Es gibt auch Gruppen welche als Moderatoren gehen wuerden:
                                mysqlPool.query(
                                    "select sql_cache a.boardid, a.accessid, a.bflags, a.eflags,b.description as name from board_acl a left join groups b on b.groupid = -a.accessid where a.accessid<0",
                                    function (err, results, fields) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            results.forEach(function (subset) {
                                                if (!mGrouplist[subset["boardid"]])
                                                    mGrouplist[subset["boardid"]] = {};
                                                mGrouplist[subset["boardid"]][subset["accessid"]] = subset;
                                            })
                                        }
                                        cb();
                                    }
                                )
                            }
                        )
                    },
                    //  Boardstruktur
                    //  --------------------------------------------------------------------------------------------------------------------------------------
                    function getBoard(cb) {
                        var mCachedBoard = {
                            0: {
                                "id": 0,
                                "pid": -1,
                                "headline": "Start",
                                "childs": [],
                                "perms": {"modflags": 0, "boardflags": 0, "extendflags": 0},
                                "reports": [],
                                "bIsMod": false,
                                "bManageBans": false
                            }
                        };
                        mysqlPool.query(
                            "select" +
                            " b.boardid as id, a.parentboardid as pid, a.sortid, ifnull(a.topiccount,0) as topiccount, ifnull(a.postcount,0) as postcount, ifnull(a.topiccount,0) as originaltopiccount, ifnull(a.postcount,0) as originalpostcount, a.lasttopicid," +
                            " b.headline,b.description, b.boardrule, ifnull(b.boardflags,0) as boardflags, b.prefixe," +
                            " ifnull(c.hits,0) as hits, ifnull(c.posts,0) as posts, ifnull(c.icon,0) as icon, c.headline as topic, c.flags as topicflags, ifnull(c.lastpostdate,0) as lastpostdate, c.topicid," +
                            " ifnull(c.lastpostid,0) as lastpostid, ifnull(d.username,'nobody') as username, ifnull(d.userid,0) as lastuserid" +
                            " from        boards a" +
                            " right join   board_config b on b.boardid=a.boardid" +
                            " left join   topics  c on c.topicid=a.lasttopicid" +
                            " left join   posts   d on d.postid =c.lastpostid",
                            function (err, results, fields) {
                                //  Step I  vorhandene Boards in dictionary wandeln:
                                if (err) {
                                    console.log(["getBoard", err]);
                                } else {
                                    results.forEach(function (subset) {
                                        if (subset["id"] != 0) {
                                            subset["childs"] = [];
                                            if (subset["id"] == subset["pid"])    //  In sich selbst geschachtelt!
                                                subset["pid"] = 0;              //  in root schieben!
                                            mCachedBoard[subset["id"]] = subset;
                                        }
                                    });
                                }
                                //  Zugriffsrechte bereinigen (childs bleiben stehen und zeigen ggf auf leeren key!)
                                mBoard = {0: mCachedBoard[0]};       //  Root-Struktur verwenden
                                for (var key in mCachedBoard) {
                                    //  Moderatoren patchen:
                                    mCachedBoard[key]["modlist"] = [];
                                    if (mModlist[key]) {
                                        for (var mMod in mModlist[key]) {
                                            mMod = mModlist[key][mMod];
                                            mCachedBoard[key]["modlist"].push({
                                                "id": mMod["userid"],
                                                "name": mMod["name"],
                                                "flags": mMod["flags"]
                                            });
                                        }
                                    }

                                    if (mGrouplist[key]) {
                                        //  Schnittmenge ermitteln von Werten welche in der eigenen Gruppe sowie in der Hgrouplist sind
                                        var arrMenge = [];
                                        for (var i = 0; i < mUser["groups"].length; i++) if (mGrouplist[key][mUser["groups"][i]]) arrMenge.push(mUser["groups"][i]);

                                        if (arrMenge.length || (mModlist[key] && mModlist[key][mUser["id"]])) {
                                            mBoard[key] = mCachedBoard[key];
                                            var iModFlags = ixGetModFlags(key, mCachedBoard);

                                            //  Rechte patchen:
                                            var flags = ixCheckBoardAccess(key);
                                            mBoard[key]["perms"] = {
                                                "modflags": iModFlags,
                                                "boardflags": flags.board,
                                                "extendflags": flags.extended
                                            };

                                            //  Neusten Beitrag finden:
                                            if (iLTDate < mBoard[key]["lastpostdate"])
                                                iLTDate = mBoard[key]["lastpostdate"];
                                        }
                                    }
                                }

                                //  Jetzt kann es noch vorkommen das Unterforen vorhanden sind ohne Parent welche rausgefiltert werden
                                //  Gleichzeitig eine Liste anlegen mit Foren in denen wir als Mod ggf Meldungen bearbeiten duerfen
                                var aiUnreportPosts = [];
                                for (var key in mBoard) {
                                    if (key != 0 && !mBoard[mBoard[key]["pid"]]) {
                                        delete(mBoard[key]);
                                    } else {
                                        if (mBoard[key]["perms"]["modflags"] != 0)
                                            mBoard[0]["bIsMod"] = true;
                                        if (mBoard[key]["perms"]["modflags"] & GBFlags.dfmod_closereports || mUser["flags"] & GBFlags.dfu_superadmin)
                                            aiUnreportPosts.push(key);
                                        if (mBoard[key]["perms"]["modflags"] & GBFlags.dfmod_managebans)
                                            mBoard[0]["bManageBans"] = true;
                                    }
                                }
                                //  Darf der User Meldungen bearbeiten?
                                if (aiUnreportPosts.length) {
                                    mysqlPool.query(
                                        "select count(*) as reports, a.boardid, p.*, b.content,t.headline,u.signature,u.posts,unix_timestamp(u.created) as created,u.titel from post_reports a left join posts p on p.postid=a.postid left join postbodies b on b.postid=a.postid left join topics t on t.topicid=p.topicid left join users u on u.id=p.userid where a.boardid in (" + aiUnreportPosts.join(",") + ") group by a.postid",
                                        function (err, results, fields) {
                                            if (err) {
                                                console.log(["getBoard", err]);
                                            } else {
                                                mBoard[0]["reports"] = results;
                                                cb();
                                            }
                                        }
                                    )
                                } else {
                                    cb();
                                }
                            }
                        )
                    },
                ],
                next);
        };

        //  Returns current Threads
        self.getThreads = function (params, next) {
            amJSON.push({"event": "newThreads", "data": mBoard});
            return next();
        };

        //  Serve main template
        self.getTemplates = function (params, next) {
            fs.readFile(__dirname + '/../htdocs/templates.html', "utf-8", function (err, data) {
                if (err) throw err;
                amJSON.push({"event": "newTemplates", "data": data});
                next();
            });
        };

        //  getUser
        self.getUser = function (params, next) {
            amJSON.push({"event": "newUser", "data": mUser});
            return next();
        };

        //  getTopics
        self.getTopics = function (params, next) {
            //"""Liefert alle Topics anhand eines Threads zurueck; gefiltert anhand Zugriffsrechten."""
            //#+---------+---------+------+-------+--------+------+---------+----------+----------+-------+------------+--------------+
            //#| topicid | boardid | hits | posts | voting | icon | userid  | username | headline | flags | lastpostid | lastpostdate |
            //#+---------+---------+------+-------+--------+------+---------+----------+----------+-------+------------+--------------+
            var iBoardID = parseInt(params.threadID, 10);
            mysqlPool.query(
                "select * from topics where boardid=? order by lastpostdate desc", [iBoardID],
                function (err, results, fields) {
                    if (err) {
                        console.log(["getTopics", err]);
                    } else {
                        var amTopics = [];
                        var iModFlags = ixGetModFlags(iBoardID);         //  Fuers gesamte Board identisch
                        results.forEach(function (mTopic) {
                            //  Rechte patchen:
                            var flags = ixCheckBoardAccess(iBoardID);
                            mTopic["perms"] = {
                                "modflags": iModFlags,
                                "topicflags": mTopic["flags"],
                                "boardflags": flags.board,
                                "extendflags": flags.extended
                            };
                            amTopics.push(mTopic);
                        });
                        amJSON.push({"event": "newTopics", "data": amTopics});
                    }
                    return next();
                }
            )
        };

        //  getPosts
        self.getPosts = function (params, next) {
            //"""Liefert alle Posts eines Topics zurueck; gefiltert anhand Zugriffsrechten. Kann Umfragen enthalten!"""
            //#+--------+---------+--------+-----------+------------+----------------+----------------+--------+----------+---------+
            //#| postid | topicid | userid | postflags | postdate   | username       | userip         | postid | lastedit | content |
            //#+--------+---------+--------+-----------+------------+----------------+----------------+--------+----------+---------+

            var iTopicID = params.topicID;
            var iPage = params.page || 1;
            var iPostID = params.postID || 0;
            //  Rechte pruefen:
            mxGetTopic(iTopicID, function (mTopic) {
                if (!mTopic) {
                    amJSON.push({"event": "showError", "data": "Topic not found!"});
                    amJSON.push({"event": "action", "action": "showThread", "threadID": 0});
                    return next();
                }

                if ((!(mTopic["perms"]["boardflags"] & GBFlags.dfbp_show) || !(mTopic["perms"]["boardflags"] & GBFlags.dfbp_readboard)) && // nicht anzeigbar und nicht lesbar
                    !(mModlist[mTopic["boardid"]] && mModlist[mTopic["boardid"]][mUser["id"]])) {   // und wir sind auch kein mod (fuer den die einschr�nkung nicht z�hlt)
                    amJSON.push({"event": "showError", "data": "Missing permissions"});
                    amJSON.push({"event": "action", "action": "showLogin"});
                    return next();
                }

                //  Anzahl Beitr�ge ermitteln:
                mysqlPool.query(
                    "select count(*) as anzahl from posts where topicid=?", [iTopicID],
                    function (err, results, fields) {
                        var iPostCount = results[0]["anzahl"];

                        //  Page ggf korrigieren:
                        iPage = Math.max(0, Math.min(iPage - 1, Math.ceil(iPostCount / (1.0 * iPostsPerPage))));

                        //  Beitr�ge auslesen:
                        function readPosts() {
                            mysqlPool.query(
                                "select" +
                                " a.postid, a.topicid, a.userid, a.postflags, a.postdate, a.userip," +
                                " b.lastedit, b.content," +
                                " ifnull(c.nick, a.username) as username, c.titel, ifnull(c.signature,'') as signature, unix_timestamp(c.created) as created, c.posts, c.flags" +
                                " from posts a" +
                                " left join postbodies b on b.postid=a.postid" +
                                " left join users c on c.id=a.userid" +
                                " where topicid=? order by postdate asc limit ?, ?", [iTopicID, iPage * iPostsPerPage, iPostsPerPage],
                                function (err, results, fields) {
                                    if (err) {
                                        console.log(["mxGetTopic", err]);
                                        return next()
                                    }
                                    var amPosts = results;
                                    //  Evtl. gibt es hier auch Votes
                                    mysqlPool.query(
                                        "select unix_timestamp(startdate) as pollstart, unix_timestamp(startdate+interval laufzeit day) as pollend, maxoptions from polls where pid=? limit 1", [iTopicID],
                                        function (err, results, fields) {
                                            if (results.length) {
                                                var mPoll = results.shift();
                                                //  Umfrageergebnis ermitteln
                                                mysqlPool.query(
                                                    "select count(*) as anzahl,vote from poll_votes where pid=? group by vote order by vote", [iTopicID],
                                                    function (err, results, fields) {
                                                        var mVotes = {};
                                                        var iVotes = 0;
                                                        results.forEach(function (subset) {
                                                            mVotes[subset["vote"]] = subset["anzahl"];
                                                        });
                                                        //  Umfrageoptionen
                                                        mysqlPool.query(
                                                            "select poption, value from poll_options where pid=? order by value", [iTopicID],
                                                            function (err, results, fields) {
                                                                mPoll["options"] = [];
                                                                results.forEach(function (subset) {
                                                                    if (mVotes[subset["value"]]) {
                                                                        subset["votes"] = mVotes[subset["value"]];
                                                                        iVotes += subset["votes"];
                                                                    } else {
                                                                        subset["votes"] = 0;
                                                                    }
                                                                    mPoll["options"].push(subset);
                                                                });
                                                                mPoll["votes"] = iVotes;
                                                                amJSON.push({
                                                                    "event": "newPosts",
                                                                    "data": {
                                                                        "topicID": iTopicID,
                                                                        "topic": mTopic,
                                                                        "posts": amPosts,
                                                                        "postcount": iPostCount,
                                                                        "page": iPage + 1,
                                                                        "poll": mPoll
                                                                    }
                                                                });
                                                                return next();
                                                            }
                                                        )
                                                    }
                                                )
                                            } else {
                                                amJSON.push({
                                                    "event": "newPosts",
                                                    "data": {
                                                        "topicID": iTopicID,
                                                        "topic": mTopic,
                                                        "posts": amPosts,
                                                        "postcount": iPostCount,
                                                        "page": iPage + 1,
                                                        "poll": null
                                                    }
                                                });
                                                return next();
                                            }
                                        }
                                    )
                                }
                            )
                        }

                        //  Falls bestimmter Post erwuenscht ist die Seitenzahl ermitteln:
                        if (iPostID) {
                            mysqlPool.query(
                                "select count(*) as anzahl from posts where topicid=? and postid<=?", [iTopicID, iPostID],
                                function (err, results, fields) {
                                    var iWantedPage = results.shift()["anzahl"];
                                    if (iWantedPage)
                                        iPage = Math.ceil(iWantedPage / (1.0 * iPostsPerPage)) - 1;
                                    readPosts();
                                }
                            )
                        } else {
                            readPosts();
                        }
                    }
                )
            })
        };

        //  Umfrage
        self.voteOption = function (params, next) {
            //"""Stimmabgabe bei Umfrage. Zu pruefen ob Stimme abgegeben werden darf."""
            var iTopicID = params.topicID;
            var aOptions = params.options;
            if (!aOptions.length) return next();

            //  Alte Stimme loeschen
            mysqlPool.query(
                "delete from poll_votes where pid=? and userid=?", [iTopicID, mUser["id"]],
                function (err, results) {
                    //  Neue Stimme(n) hinzufuegen
                    function insertPoll() {
                        var opt = aOptions.shift();
                        mysqlPool.query(
                            "insert into poll_votes (pid,userid,vote) values (?,?,?)", [iTopicID, mUser["id"], parseInt(opt)],
                            function () {
                                if (aOptions.length) {
                                    insertPoll();
                                } else {
                                    //  Feedback das Stimme gez�hlt
                                    amJSON.push({"event": "showInfo", "data": "@@@VOTECOUNTED@@@"});
                                    //  Nochmal alle Posts ausgeben
                                    self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                                }
                            }
                        )
                    }

                    insertPoll();
                }
            )
        };

        //
        //  Topics
        //
        self.moveTopic = function (params, next) {
            var iTopicID = params.topicID;
            var iThreadID = params.threadID;
            mxGetTopic(iTopicID, function (mTopic) {
                //  Pruefe Rechte
                if (!mTopic["perms"]["modflags"] & (GBFlags.dfmod_movethread)) {
                    amJSON.push({"event": "showError", "data": "Move Topic not allowed!"});
                    return next();
                }
                if (iThreadID == 0 || !mBoard[iThreadID]) {
                    amJSON.push({"event": "showError", "data": "Destination not allowed!"});
                    return next();
                }
                //  Topic verschieben
                mysqlPool.query(
                    "update topics set boardid=? where topicid=?", [iThreadID, iTopicID],
                    function () {
                        //  Nach dem Verschieben koennte Topic in einem gesperrten Bereich liegen!
                        initBoard(function () {
                            amJSON.push({"event": "newThreads", "data": mBoard});
                            amJSON.push({"event": "showInfo", "data": "Topic was moved!"});
                            self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                        });
                    }
                )
            });
        };

        self.deleteTopic = function (params, next) {
            var iTopicID = params.topicID;
            mxGetTopic(iTopicID, function (mTopic) {
                //  Pruefe Rechte
                if (!mTopic["perms"]["modflags"] & (GBFlags.dfmod_deletethread)) {
                    amJSON - push({"event": "showError", "data": "Delete Topic not allowed!"});
                    return next();
                }
                //  Umfragen loeschen
                mysqlPool.query("delete from poll_options where pid=?", [iTopicID]);
                mysqlPool.query("delete from polls where pid=?", [iTopicID]);
                mysqlPool.query("delete from poll_votes where pid=?", [iTopicID]);
                //  Topic loeschen
                mysqlPool.query(
                    "delete from topics where topicid=?", [iTopicID],
                    function () {
                        initBoard(function () {
                            amJSON.push({"event": "newThreads", "data": mBoard});
                            amJSON.push({"event": "showInfo", "data": "Topic was deleted!"});
                            self.getTopics({threadID: mTopic["boardid"]}, next); //  this will then call "next()"
                        });
                    }
                )
            })
        };

        self.closeTopicMod = function (params, next) {
            var iTopicID = params.topicID;
            mxGetTopic(iTopicID, function (mTopic) {
                //  Pruefe Rechte
                if ((!mTopic["perms"]["modflags"] & (GBFlags.dfmod_closethread)) && !(mTopic["perms"]["extendflags"] & GBFlags.dfbp_closeowntopic && mTopic["userid"] == mUser["id"])) {
                    amJSON.push({"event": "showError", "data": "Closing Topic not allowed!"});
                    return next();
                }
                //  Topic schliessen
                mysqlPool.query(
                    "update topics set flags=flags|? where topicid=?", [(GBFlags.dft_mod_closed | GBFlags.dft_closed), iTopicID],
                    function () {
                        initBoard(function () {
                            amJSON.push({"event": "newThreads", "data": mBoard});
                            amJSON.push({"event": "showInfo", "data": "Topic was closed!"});
                            self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                        });
                    }
                )
            })
        };

        self.closeTopicUser = function (params, next) {
            var iTopicID = params.topicID;
            mxGetTopic(iTopicID, function (mTopic) {
                //  Pruefe Rechte
                if ((!mTopic["perms"]["modflags"] & (GBFlags.dfmod_closethread)) && !(mTopic["perms"]["extendflags"] & GBFlags.dfbp_closeowntopic && mTopic["userid"] == mUser["id"])) {
                    amJSON - push({"event": "showError", "data": "Closing Topic not allowed!"});
                    return next();
                }
                //  Topic schliessen
                mysqlPool.query(
                    "update topics set flags=flags|? where topicid=?", [(GBFlags.dft_closed), iTopicID],
                    function () {
                        initBoard(function () {
                            amJSON.push({"event": "newThreads", "data": mBoard});
                            amJSON.push({"event": "showInfo", "data": "Topic was closed!"});
                            self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                        });
                    }
                )
            })
        };

        self.openTopicMod = function (params, next) {
            var iTopicID = params.topicID;
            mxGetTopic(iTopicID, function (mTopic) {
                //  Pruefe Rechte
                if (!mTopic["perms"]["modflags"] & (GBFlags.dfmod_closethread)) {
                    amJSON.push({"event": "showError", "data": "Opening Topic not allowed!"});
                    return next();
                }

                //  Topic oeffnen
                mysqlPool.query(
                    "update topics set flags=flags&~? where topicid=?", [(GBFlags.dft_mod_closed | GBFlags.dft_closed), iTopicID],
                    function () {
                        initBoard(function () {
                            amJSON.push({"event": "newThreads", "data": mBoard});
                            amJSON.push({"event": "showInfo", "data": "Topic was opened!"});
                            self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                        });
                    }
                )
            })
        };

        self.createTopic = function (params, next) {
            console.log("createTopic", params);
            var iThreadID = params.threadID;
            var szHeadline = params.headline || "";
            var iIcon = params.icon || 0;
            var szContent = params.content || "";
            //  Polloptionen optional
            var iPollChoosable = ~~params.pollchoosable;
            var iPollRuntime = ~~params.pollruntime;
            var aszPollOptions = params.polloptions;

            if (iThreadID == 0 || !mBoard[iThreadID]) {
                amJSON.push({"event": "showError", "data": "Destination not allowed!"});
                return next();
            }

            //  Recht im Board pruefen:
            var flags = ixCheckBoardAccess(iThreadID);
            var iModFlags = ixGetModFlags(iThreadID);
            var iBoardFlags = flags.board;
            var iExtendFlags = flags.extended;

            if (iBoardFlags & GBFlags.dfbp_show &&
                iBoardFlags & GBFlags.dfbp_readboard &&
                (iBoardFlags & GBFlags.dfbp_createtopic || iModFlags & GBFlags.dfmod_createtopic)) {

                //  Topic einfuegen
                mysqlPool.query(
                    "insert into topics (topicid,boardid,hits,posts,voting,icon,userid,username,headline,flags,lastpostid,lastpostdate) values (0,?,0,0,0,?,?,?,?,0,0,0)",
                    [iThreadID, iIcon, mUser["id"], mUser["nick"], szHeadline],
                    function (err, info) {
                        var iTopicID = info.insertId;
                        //  Post einfuegen:
                        mysqlPool.query(
                            "insert into posts (postid,topicid,userid,postflags,postdate,username) values (0,?,?,0,unix_timestamp(now()),?)",
                            [iTopicID, mUser["id"], mUser["nick"]],
                            function (err, info) {
                                var iPostID = info.insertId;
                                //  PostBody
                                mysqlPool.query(
                                    "insert into postbodies (postid,lastedit,content) values (?,0,?)",
                                    [iPostID, szContent],
                                    function (err, info) {
                                        //  Topic updaten:
                                        mysqlPool.query(
                                            "update topics set lastpostid=?,lastpostdate=unix_timestamp(now()) where topicid=?", [iPostID, iTopicID],
                                            function (err, info) {
                                                //  TopicID im Parent updaten
                                                mysqlPool.query(
                                                    "update boards set lasttopicid=? where boardid=? and lasttopicid<?", [iTopicID, iThreadID, iTopicID],
                                                    function (err, info) {
                                                        initBoard(function () {
                                                            amJSON.push({"event": "newThreads", "data": mBoard});
                                                            amJSON.push({
                                                                "event": "showInfo",
                                                                "data": "Topic was created!"
                                                            });
                                                            //  NextAction setzen:  XXX sollte nach den POSTS kommen!
                                                            amJSON.push({
                                                                "event": "action",
                                                                "action": "showTopic",
                                                                "postID": iPostID,
                                                                "topicID": iTopicID,
                                                                "page": 1
                                                            });

                                                            //  Umfragen dabei?
                                                            if (!iIcon == 100 || aszPollOptions.length < 2)
                                                                return self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                                                            //  Umfragen noch hinzufuegen:
                                                            mysqlPool.query("insert into polls (id, pid, laufzeit, maxoptions, startdate) values (0,?,?,?,now())", [iTopicID, iPollRuntime, iPollChoosable], function (err, info) {
                                                                //  Optionen einfuegen:
                                                                var iOptCount = 1;
                                                                async.forEach(aszPollOptions, function (item, next) {
                                                                        mysqlPool.query("insert into poll_options (pid, `value`, poption) values (?,?,?)", [iTopicID, iOptCount++, item], function (err, info) {
                                                                            if (err) console.log(err);
                                                                            next();
                                                                        });
                                                                    },
                                                                    function () {
                                                                        return self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                                                                    }
                                                                );
                                                            });
                                                        });
                                                    }
                                                )
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                )
            } else {
                amJSON.push({"event": "showError", "data": "Board not available!"});
                next();
            }
        };

        self.editTopic = function (params, next) {
            var iTopicID = params.topicID;
            var szHeadline = params.headline || "";
            var iIcon = params.icon || 0;
            var iFlags = params.flags || 0;

            mxGetTopic(iTopicID, function (mTopic) {
                //  Pruefe Rechte
                if (!mTopic["perms"]["modflags"] & (GBFlags.dfmod_editthread) &&
                    (!mTopic["perms"]["extendflags"] & GBFlags.dfbp_editownpost || mTopic["userid"] != mUser["id"])) {
                    amJSON.push({"event": "showError", "data": "Edit not allowed!"});
                    return next();
                }

                //  Topic updaten
                mysqlPool.query(
                    "update topics set headline=?, icon=?, flags=(flags&~?)|? where topicid=?", [szHeadline, iIcon, GBFlags.dft_pinned, iFlags & GBFlags.dft_pinned, iTopicID],
                    function (err, info) {
                        initBoard(function () {
                            amJSON.push({"event": "newThreads", "data": mBoard});
                            amJSON.push({"event": "showInfo", "data": "Topic was updated!"});
                            self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                        });
                    }
                )
            })
        };

        self.addPost = function (params, next) {
            //  Rechte pruefen:
            var iTopicID = params.topicID;
            var szContent = params.data;
            mxGetTopic(iTopicID, function (mTopic) {
                //  Darf antworten (und zitieren) - ausser thema wurde geschlossen und/oder ausgeblendet:
                if (!(mTopic["perms"]["topicflags"] & (GBFlags.dft_closed | GBFlags.dft_mod_closed) == 0) &&
                    !mTopic["perms"]["modflags"] & (GBFlags.dfmod_replypost)) {
                    amJSON.push({"event": "showError", "data": "Topic closed!"});
                    return next();
                }
                if (!mTopic["perms"]["boardflags"] & GBFlags.dfbp_reply &&
                    !mTopic["perms"]["modflags"] & (GBFlags.dfmod_replypost)) {
                    amJSON.push({"event": "showError", "data": "Reply not allowed!"});
                    return next();
                }
                //  Daten zum Posten
                //iUserID     =   conn.mUser["id"]
                //szUsername  =   conn.mUser["nick"]
                //szIP        =   req.connection.remoteAddress;

                mysqlPool.query(
                    "insert into posts (postid, topicid, userid, postflags, postdate, username, userip) values" +
                    " (0,?,?,?,unix_timestamp(current_timestamp),?,?)", [iTopicID, mUser["id"], 0, mUser["nick"], req.connection.remoteAddress],
                    function (err, info) {
                        if (err) {
                            console.log(["addPost", err]);
                            return next();
                        }

                        var iPostID = info.insertId;
                        mysqlPool.query(
                            "insert into postbodies (postid, lastedit, content) values (?,0,?)", [iPostID, szContent],
                            function (err, info) {
                                //  Topic updaten:
                                mysqlPool.query(
                                    "update topics set lastpostid=?,lastpostdate=unix_timestamp(now()) where topicid=?", [iPostID, iTopicID],
                                    function (err, info) {
                                        //  TopicID im Parent updaten
                                        mysqlPool.query(
                                            "update boards set lasttopicid=? where boardid=?", [iTopicID, mTopic["boardid"]],   //  REMX: darf nur geupdated werden wenn beitrag wirklich neuer ist
                                            function (err, info) {
                                                //  Postcounter erhoehen
                                                if (mTopic["perms"]["extendflags"] & GBFlags.dfbp_incpostcounter) {
                                                    mysqlPool.query("update users set posts=posts+1 where id=?", [mUser["id"]]);
                                                }
                                                //  Ermitteln welche Seite der Post ist um direkt dorthin zu springen
                                                mysqlPool.query(
                                                    "select count(*) as anzahl from posts where topicid=? and postid<=?", [iTopicID, iPostID],
                                                    function (err, results) {
                                                        var iPostCount = results.shift()["anzahl"];
                                                        var iPage = Math.ceil(iPostCount / (1.0 * iPostsPerPage));
                                                        //  Postcounter im Topic anpassen
                                                        mysqlPool.query("update topics set posts=? where topicid=?", [iPostCount - 1, iTopicID]);
                                                        //  NextAction setzen:  XXX sollte nach den neuen POSTS kommen!
                                                        amJSON.push({
                                                            "event": "action",
                                                            "action": "showTopic",
                                                            "postID": iPostID,
                                                            "topicID": iTopicID,
                                                            "page": iPage
                                                        })
                                                        //  Neue Beitr�ge ausliefern
                                                        self.getPosts({topicID: iTopicID, page: iPage}, next); //  this will then call "next()"
                                                    }
                                                )
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    }
                )
            })
        };

        self.editPost = function (params, next) {

            var iPostID = params.postID;
            var szContent = params.data;

            //  Post auslesen welcher editiert werden soll:
            mysqlPool.query(
                "select * from posts where postid=? limit 1", [iPostID],
                function (err, results) {
                    if (!results.length) {
                        amJSON.push({"event": "showError", "data": "Post not found!"});
                        return next();
                    }
                    var mPost = results.shift();
                    var iTopicID = mPost["topicid"];

                    //  Rechte pruefen:
                    mxGetTopic(iTopicID, function (mTopic) {
                        //  thema wurde geschlossen und/oder ausgeblendet:
                        if (!(mTopic["perms"]["topicflags"] & (GBFlags.dft_closed | GBFlags.dft_mod_closed) == 0) &&
                            !mTopic["perms"]["modflags"] & (GBFlags.dfmod_editpost)) {
                            amJSON.push({"event": "showError", "data": "Topic closed!"});
                            return next();
                        }

                        //  Pruefe Rechte
                        if (!mTopic["perms"]["modflags"] & (GBFlags.dfmod_editpost) &&
                            (!mTopic["perms"]["extendflags"] & GBFlags.dfbp_editownpost || mPost["userid"] != mUser["id"] || mPost["postflags"] & dfpost_reported)) {
                            amJSON.push({"event": "showError", "data": "Edit not allowed!"});
                            return next();
                        }

                        //  Daten zum Posten
                        mysqlPool.query(
                            "update postbodies set lastedit=unix_timestamp(now()), content=? where postid=?", [szContent, iPostID],
                            function (err, info) {
                                //  Ermitteln welche Seite der Post ist um direkt dorthin zu springen
                                mysqlPool.query(
                                    "select count(*) as anzahl from posts where topicid=? and postid<=?", [iTopicID, iPostID],
                                    function (err, results) {
                                        var iPostCount = results.shift();
                                        var iPage = Math.ceil(iPostCount / (1.0 * iPostsPerPage));
                                        //  NextAction setzen:  XXX sollte nach posts sein
                                        amJSON.push({
                                            "event": "action",
                                            "action": "showTopic",
                                            "postID": iPostID,
                                            "topicID": iTopicID,
                                            "page": iPage
                                        });
                                        //  Neue Beitr�ge ausliefern
                                        self.getPosts({topicID: iTopicID, page: iPage}, next); //  this will then call "next()"
                                    }
                                )
                            }
                        )
                    })
                }
            )
        };

        self.delPost = function (params, next) {
            var iPostID = params.postID;
            //  Post auslesen welcher editiert werden soll:
            mysqlPool.query(
                "select * from posts where postid=? limit 1", [iPostID],
                function (err, results) {
                    if (!results.length) {
                        amJSON.push({"event": "showError", "data": "Post not found!"});
                        return next();
                    }
                    var mPost = results.shift();
                    var iTopicID = mPost["topicid"];

                    //  Rechte pruefen:
                    mxGetTopic(iTopicID, function (mTopic) {
                        //  thema wurde geschlossen und/oder ausgeblendet:
                        if (!(mTopic["perms"]["topicflags"] & (GBFlags.dft_closed | GBFlags.dft_mod_closed) == 0) &&
                            !mTopic["perms"]["modflags"] & (GBFlags.dfmod_deletepost)) {
                            amJSON.push({"event": "showError", "data": "Topic closed!"});
                            return next();
                        }

                        //  Pruefe Rechte - REMX: Modertorenrechte beachten!
                        if (!mTopic["perms"]["modflags"] & (GBFlags.dfmod_editpost) &&
                            (!mTopic["perms"]["extendflags"] & GBFlags.dfbp_deleteownpost || mPost["userid"] != mUser["id"] || mPost["postflags"] & dfpost_reported)) {
                            amJSON.push({"event": "showError", "data": "Delete not allowed!"});
                            return next();
                        }

                        //  Ermitteln welche Seite der Post ist um direkt dorthin zu springen
                        mysqlPool.query(
                            "select count(*) as anzahl from posts where topicid=? and postid<=?", [iTopicID, iPostID],
                            function (err, results) {
                                var iPostCount = results.shift()["anzahl"];

                                //  Post loeschen
                                mysqlPool.query("delete from postbodies where postid=?", [iPostID]);
                                mysqlPool.query("delete from posts      where postid=?", [iPostID],
                                    function (err, info) {
                                        //  Wieviele Posts sind noch vorhanden?
                                        mysqlPool.query("select count(*) as anzahl from posts where topicid=?", [iTopicID], function (err, results) {

                                            //  Keine Posts mehr vorhanden? Dann Topic loeschen!
                                            if (!results || results[0].anzahl == 0) {
                                                console.log("No Posts. Deleting Topic", iTopicID);
                                                mysqlPool.query(
                                                    "delete from topics where topicid=?", [iTopicID],
                                                    function (err, info) {
                                                        amJSON.push({
                                                            "event": "action",
                                                            "action": "showThread",
                                                            "threadID": mTopic["boardid"]
                                                        });
                                                        next();
                                                    }
                                                );
                                            } else {
                                                //  Postcounter verringern und Topic neu anzeigen.
                                                mysqlPool.query("update topics set posts=? where topicid=?", [results[0].anzahl - 1, iTopicID]);
                                                var iPage = Math.ceil((iPostCount - 1) / (1.0 * iPostsPerPage));
                                                self.getPosts({topicID: iTopicID, page: iPage}, function () {
                                                    amJSON.push({
                                                        "event": "action",
                                                        "action": "showTopic",
                                                        "postID": 0,
                                                        "topicID": iTopicID,
                                                        "page": iPage
                                                    });
                                                    next();
                                                });
                                            }
                                        });
                                    }
                                )
                            }
                        )
                    })
                }
            )
        };

        self.reportPost = function (params, next) {
            var iPostID = parseInt(params.postID, 10);

            //  Post auslesen welcher editiert werden soll:
            mysqlPool.query(
                "select * from posts where postid=? limit 1", [iPostID],
                function (err, results) {

                    if (!results.length) {
                        amJSON.push({"event": "showError", "data": "Post not found!"});
                        return next();
                    }
                    var mPost = results.shift();
                    var iTopicID = mPost["topicid"];

                    //  Rechte pruefen:
                    mxGetTopic(iTopicID, function (mTopic) {
                        if (!mTopic["perms"]["boardflags"] & GBFlags.dfbp_reportpost) {
                            amJSON.push({"event": "showError", "data": "No permissions to do that!"});
                            return next();
                        }

                        var iReportFlags = dfpost_reported;
                        if (!mTopic["perms"]["modflags"] & GBFlags.dfmod_hidepost) {   //  Mods koennen ggf durch meldung sofort beitrag verstecken
                            iReportFlags = iReportFlags | dfpost_hide;
                        }

                        var iThreadID = mTopic["boardid"];

                        //  Post markieren das gemeldet wurde:
                        mysqlPool.query(
                            "update posts set postflags=postflags|? where postid=?", [iReportFlags, iPostID],
                            function (err, info) {
                                //  Eintragen in Report-Liste zur Abarbeitung durch Moderatoren
                                mysqlPool.query(
                                    "insert ignore into post_reports (postid,reporterid,boardid) values (?,?,?)", [iPostID, mUser["id"], iThreadID],
                                    function (err, info) {
                                        //  Eine gute Idee waere es wenn ein Beitrag 10x gemeldet wurde diesen auszublenden
                                        amJSON.push({"event": "showInfo", "data": "POST REPORTED"});

                                        mysqlPool.query(
                                            "select ifnull(count(*),0) as anzahl from post_reports where postid=?", [iPostID],
                                            function (err, results) {
                                                var iAnzahl = results.shift()["anzahl"];
                                                if (iAnzahl >= 10) {
                                                    //  Beitrag verstecken
                                                    mysqlPool.query("update posts set postflags=postflags|? where postid=?", [dfpost_hide, iPostID],
                                                        function (err, info) {
                                                            initBoard(function () {
                                                                amJSON.push({"event": "newThreads", "data": mBoard});
                                                                self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                                                            });
                                                        }
                                                    )
                                                } else {
                                                    initBoard(function () {
                                                        amJSON.push({"event": "newThreads", "data": mBoard});
                                                        self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                                                    });
                                                }
                                            }
                                        )
                                    }
                                )
                            }
                        )
                    })
                }
            )
        };

        self.reportPostUndo = function (params, next) {
            var iPostID = parseInt(params.postID);
            //  Post auslesen welcher editiert werden soll:
            mysqlPool.query(
                "select * from posts where postid=?", [iPostID],
                function (err, results) {

                    if (!results.length) {
                        amJSON.push({"event": "showError", "data": "Post not found!"});
                        return next();
                    }
                    var mPost = results.shift();
                    var iTopicID = mPost["topicid"];

                    //  Rechte pruefen:
                    mxGetTopic(iTopicID, function (mTopic) {
                        if (!mTopic["perms"]["modflags"] & GBFlags.dfmod_closereports) {
                            amJSON.push({"event": "showError", "data": "No permissions to do that!"});
                            return next();
                        }

                        var iThreadID = mTopic["boardid"];

                        //  Post markieren das gemeldet wurde:
                        mysqlPool.query(
                            "update posts set postflags=postflags&~? where postid=?", [(dfpost_reported | dfpost_hide), iPostID],
                            function (err, info) {
                                //  Eintragen in Report-Liste zur Abarbeitung durch Moderatoren
                                mysqlPool.query(
                                    "delete from post_reports  where postid=?", [iPostID],
                                    function (err, info) {
                                        amJSON.push({"event": "showInfo", "data": "POST freed."});
                                        initBoard(function () {
                                            amJSON.push({"event": "newThreads", "data": mBoard});
                                            self.getPosts({topicID: iTopicID}, next); //  this will then call "next()"
                                        });
                                    }
                                )
                            }
                        )
                    })
                }
            )
        };

        self.loginUser = function (params, next) {

            //  Test ob User schon bekannt durch "ban":
            if (mUser["banreason"]) {
                amJSON.push({"event": "showError", "data": conn.mUser["banreason"]});
                return next();
            }

            //  Test lokaler User (i.d.R. Mods/Admins)
            var szLogin = params.login;
            var szPasswd = params.passwd;
            if (!szLogin) {
                amJSON.push({"event": "showError", "data": "Logindata missing"});
                return next();
            }

            mysqlPool.query(
                "select id, nick, country, city, email, created, lastlogin, posts, flags, titel, signature, language from users " +
                " where nick=? and snp_hash=unhex(sha1(concat(?,'-',created,'-',?))) limit 1", [szLogin, szPasswd, __SECRETPEPPER__],
                function (err, results) {
                    console.log(results);
                    if (err) {
                        amJSON.push({"event": "showError", "data": err.message});
                        console.log(err);
                        return next();
                    }
                    if (results.length) {
                        var mResult = results.shift();
                        //  Hash erstellen
                        var szCookie = mResult.id + "." + crypto.createHash("sha1").update(mResult.id + '.' + __COOKIENAME__ + '.' + __SECRETPEPPER__).digest("hex");
                        res.cookie(__COOKIENAME__, szCookie, {maxAge: 1000 * 60 * 60 * 24 * 7});
                        //  Userdaten setzen:
                        initUser(mResult.id, function () {
                            amJSON.push({"event": "newUser", "data": mUser});
                            initBoard(function () {
                                amJSON.push({"event": "newThreads", "data": mBoard});
                                return next();
                            });
                        });
                    } else {
                        amJSON.push({"event": "showError", "data": "No account found."});
                        return next();
                    }
                }
            )
        };

        self.logoutUser = function (params, next) {
            //  Cookie loeschen
            res.clearCookie(__COOKIENAME__);
            amJSON.push({"event": "showInfo", "data": "USER LOGGED OUT"});

            //  default user setzen (gast)
            mUser = {
                "id": 0,
                "nick": "Guest",
                "flags": 0,
                "groups": [-1],
                "posts": 0,
                "titel": "",
                "created": 0,
                "messages": 0,
                "lastlogin": 0
            };  //  BasicInfo
            amJSON.push({"event": "newUser", "data": mUser});

            //  Neue Boardstruktur schicken
            initBoard(function () {
                amJSON.push({"event": "newThreads", "data": mBoard});
                next();
            });
        };

        self.banUser = function (params, next) {
            var iPostID = params.postID;
            var userID = params.userID;
            var iDuration = params.banduration;
            var szReason1 = params.banreason1;
            var szReason2 = params.banreason2;
            //  Board ermitteln des Posts um zu schauen ob Rechte vorhanden sind
            mysqlPool.query(
                "select t.boardid from posts a left join topics t on t.topicid=a.topicid where a.postid=? and a.userid=? limit 1", [iPostID, userID],
                function (err, results) {
                    if (!results.length) {
                        amJSON.push({"event": "showError", "data": "No rights to ban user"});
                        return next();
                    } else {
                        var mTmp = results.shift();
                        var modflags = ixGetModFlags(mTmp["boardid"]);
                        if (!modflags & GBFlags.dfmod_createbans) {
                            amJSON.push({"event": "showError", "data": "No rights to ban user"});
                            return next();
                        } else {
                            //  ban_id | ban_fromid | ban_userid | ban_ip | ban_email | ban_start | ban_end | ban_exclude | ban_reason | ban_give_reason
                            mysqlPool.query(
                                "insert into banlist values (0,?,?,'','',unix_timestamp(now()),unix_timestamp(now()+interval ? hour),0,?,?)",
                                [mUser["id"], userID, iDuration, szReason2, szReason1],
                                function (err, info) {
                                    amJSON.push({"event": "showInfo", "data": "User banned"});
                                    return next();
                                }
                            )
                        }
                    }
                }
            )
        };

        self.writePM = function (params, next) {
            //#+-----------+-------------+------+-----+-------------------+----------------+
            //#| Field     | Type        | Null | Key | Default           | Extra          |
            //#+-----------+-------------+------+-----+-------------------+----------------+
            //#| id        | int(11)     | NO   | PRI | NULL              | auto_increment |
            //#| empfangen | timestamp   | NO   | MUL | CURRENT_TIMESTAMP |                |
            //#| flag      | tinyint(4)  | NO   |     | 0                 |                |
            //#| userid    | int(11)     | NO   | MUL | 0                 |                |
            //#| fromid    | int(11)     | NO   |     | 0                 |                |
            //#| subject   | varchar(64) | NO   |     |                   |                |
            //#| message   | text        | NO   |     | NULL              |                |
            //#+-----------+-------------+------+-----+-------------------+----------------+
            var uid = params.userID;
            var subject = params.subject;
            var message = params.message;
            var refID = params.refID;

            //  REMX: Nachricht sollte wie ingame mit refdata versehen werden. flag |= 8 wenn json gespeichert wurde.
            //  Messageobject:
            var msg = {
                "username": mUser["nick"],
                "titel": mUser["titel"],
                "userid": mUser["id"],
                "posts": mUser["posts"],
                "created": mUser["created"],
                "content": message,
                "subject": subject
            };

            //  RefData ermitteln:
            var amRefMessage = [];

            function sendMSG() {
                //  max. 4 Nachrichten drinlassen:
                amRefMessage = amRefMessage.slice(0, 4);
                //  Neue Nachricht an Anfang
                amRefMessage.unshift(msg);

                mysqlPool.query(
                    "insert into messages (id,empfangen,flag,userid,fromid,subject,message) values (0,current_timestamp,?,?,?,?,?)",
                    [dfmsg_jsondata, uid, mUser["id"], subject, JSON.stringify(amRefMessage)],
                    function (err, info) {
                        amJSON.push({"event": "showInfo", "data": "@@@MESSAGESENT@@@"});
                        next();
                    }
                )
            }

            if (refID) {
                mysqlPool.query(
                    "update messages set empfangen=empfangen, flag=flag|? where userid=? and id=?", [dfmsg_replied, mUser["id"], refID],
                    function (err, info) {
                        mysqlPool.query(
                            "select * from messages where userid=? and id=? limit 1", [mUser["id"], refID],
                            function (err, results) {
                                if (results.length && results[0]["flag"] & 8) {
                                    amRefMessage = JSON.parse(results[0]["message"]);
                                }
                                sendMSG(); // calls next()
                            }
                        )
                    }
                )
            } else {
                sendMSG();  //  calls next()
            }
        };

        self.getMessage = function (params, next) {
            //#print "Message",refID
            //#+-----------+-------------+------+-----+-------------------+----------------+
            //#| Field     | Type        | Null | Key | Default           | Extra          |
            //#+-----------+-------------+------+-----+-------------------+----------------+
            //#| id        | int(11)     | NO   | PRI | NULL              | auto_increment |
            //#| empfangen | timestamp   | NO   | MUL | CURRENT_TIMESTAMP |                |
            //#| flag      | tinyint(4)  | NO   |     | 0                 |                |
            //#| userid    | int(11)     | NO   | MUL | 0                 |                |
            //#| fromid    | int(11)     | NO   |     | 0                 |                |
            //#| subject   | varchar(64) | NO   |     |                   |                |
            //#| message   | text        | NO   |     | NULL              |                |
            //#+-----------+-------------+------+-----+-------------------+----------------+
            var refID = params.refID;
            mysqlPool.query(
                "update messages set empfangen=empfangen, flag=flag|? where userid=? and id=?", [dfmsg_read, mUser["id"], refID],
                function (err, info) {
                    mysqlPool.query(
                        "select flag, message, subject, fromid from messages where userid=? and id=? limit 1", [mUser["id"], refID],
                        function (err, results) {

                            if (!results.length) {
                                amJSON.push({"event": "showError", "data": "Message not found!"});
                                return next();
                            }
                            //  Neues PM-Format?
                            var result = results.shift();
                            if (result["flag"] & dfmsg_jsondata) {
                                amJSON.push({
                                    "event": "action",
                                    "action": "showMessage",
                                    "data": JSON.parse(result["message"])
                                });
                                next()
                            } else {
                                //  Plaintext muss gewandelt werden:
                                mysqlPool.query(
                                    "select nick,titel,id,posts,unix_timestamp(created) as created from users where id=? limit 1", [result["fromid"]],
                                    function (err, results) {
                                        if (results.length) {
                                            mTmp = results.shift();
                                            msg = {
                                                "username": mTmp["nick"],
                                                "titel": mTmp["titel"],
                                                "userid": mTmp["id"],
                                                "posts": mTmp["posts"],
                                                "created": mTmp["created"],
                                                "content": result["message"],
                                                "subject": result["subject"]
                                            }
                                        } else {
                                            msg = {
                                                "username": "-unknown-",
                                                "titel": "",
                                                "userid": 0,
                                                "posts": 0,
                                                "created": 0,
                                                "content": result["message"],
                                                "subject": result["subject"]
                                            }
                                        }
                                        amJSON.push({"event": "action", "action": "showMessage", "data": [msg]});
                                        next();
                                    }
                                )
                            }
                        }
                    )
                }
            )
        };

        self.getMessageList = function (params, next) {
            mysqlPool.query(
                "select a.id,unix_timestamp(a.empfangen) as received, a.flag, a.fromid, a.subject, ifnull(b.nick,'-unknown-') as sender from messages a left join users b on b.id=a.fromid where userid=? order by received desc", [mUser["id"]],
                function (err, results) {
                    amJSON.push({"event": "newMessageList", "data": results});
                    next();
                }
            )
        };

        //  Profil eines Users updaten (nick, email und titel nur durch superuser zu setzen)
        self.saveProfile = function (params, next) {
            var userID = parseInt(params.userID, 10);
            var szSignature = params.signature || "";
            var iFlags = params.flags || 0;
            var szNick = params.nick;
            var szTitle = params.titel || "";
            var szEMail = params.email;
            var iMask;

            //  Selbst editiert?
            if (userID == mUser["id"] && !(mUser["flags"] & GBFlags.dfu_superadmin)) {
                iFlags = iFlags & (GBFlags.dfu_no_pn | GBFlags.dfu_no_sigs | GBFlags.dfu_membermail | GBFlags.dfu_openpm);
                iMask = GBFlags.dfu_unapproved | GBFlags.dfu_invalid | GBFlags.dfu_ownavatar | GBFlags.dfu_premium | GBFlags.dfu_superadmin;
                mysqlPool.query("update users set flags=(flags&?)|?, signature=? where id=?", [iMask, iFlags, szSignature, userID],
                    function (err, info) {
                        if (err) {
                            var szDupe = err.message.match("Duplicate entry '(.*)'");
                            if (szDupe) {
                                amJSON.push({"event": "showError", "data": szDupe[1] + " @@@ERR_DUPEPARAM@@@"});
                            } else {
                                amJSON.push({"event": "showError", "data": err.message});
                            }
                        } else {
                            amJSON.push({"event": "showInfo", "data": "@@@PROFILE_UPDATED@@@"});
                            amJSON.push({"event": "action", "action": "OK"});
                        }
                        return initUser(mUser.id, self.getUser);
                    }
                );

            }
            //  Superadmin? Darf alles!
            if (mUser["flags"] & GBFlags.dfu_superadmin) {
                iFlags = iFlags & (GBFlags.dfu_no_pn | GBFlags.dfu_no_sigs | GBFlags.dfu_membermail | GBFlags.dfu_openpm | GBFlags.dfu_superadmin | GBFlags.dfu_ownavatar);
                iMask = GBFlags.dfu_unapproved | GBFlags.dfu_invalid | GBFlags.dfu_premium;

                mysqlPool.query("update users set flags=((flags&?)|?)&0xffffffff, signature=?, nick=?, titel=?, email=? where id=?", [iMask, iFlags, szSignature, szNick, szTitle, szEMail, userID],
                    function (err, info) {
                        if (err) {
                            var szDupe = err.message.match("Duplicate entry '(.*)'");
                            if (szDupe) {
                                amJSON.push({"event": "showError", "data": szDupe[1] + " @@@ERR_DUPEPARAM@@@"});
                            } else {
                                amJSON.push({"event": "showError", "data": err.message});
                            }
                        } else {
                            amJSON.push({"event": "showInfo", "data": "@@@PROFILE_UPDATED@@@"});
                            amJSON.push({"event": "action", "action": "OK"});
                        }
                        return initUser(mUser.id, self.getUser);
                    }
                );
            }
        };

        //  Other
        self.getBans = function (params, next) {
            //  Darf ich Liste einsehen?
            if (!mBoard[0]["bManageBans"])
                return next();
            mysqlPool.query("delete from banlist where ban_end<unix_timestamp(now())", function () {
                mysqlPool.query("select a.*, b.nick, c.nick as admin from banlist a left join users b on b.id=a.ban_userid left join users c on c.id=a.ban_fromid order by ban_end", function (err, results) {
                    if (results.length)
                        amJSON.push({"event": "action", "action": "banList", "data": results})
                    next();
                })
            })
        };

        self.delBan = function (params, next) {
            var iBanID = params.id;
            //  Darf ich Liste einsehen?
            if (!mBoard[0]["bManageBans"])
                return next();
            mysqlPool.query("delete from banlist where ban_id=?", [parseInt(iBanID, 10)], self.getBans);
        };

        self.deleteMessages = function (params, next) {
            if (!params.messageList || params.messageList.length == 0) return next();
            mysqlPool.query("delete from messages where id in (?) and userid=?", [params.messageList, mUser.id], function (err, info) {
                return self.getMessageList(null, next);
            });
        };

        self.getSearch = function (params, next) {
            var szSearch = params.search;
            var iSortType = 0;
            var szNameSearch = "";
            var iNameType = 1;
            var bTopicStarter = false;
            var iLastHours = 0;

            if (szNameSearch) {
                switch (iNameType) {
                    case 2:
                        szNameSearch = "and soundex(b.username) = soundex(" + mysqlPool.escape(szNameSearch) + ")";
                        break;
                    case 3:
                        szNameSearch = mysqlPool.escape(szNameSearch);
                        szNameSearch = "and b.username like '%" + szNameSearch.substr(1, szNameSearch.length - 2) + "%'";
                        break;
                    default:
                        szNameSearch = "and b.username = " + mysqlPool.escape(szNameSearch) + "";
                }
            }

            //  Nur Themenstarter?
            if (bTopicStarter)
                szNameSearch += " and c.userid=b.userid";

            //  Datum einschraenken?
            if (iLastHours)
                szNameSearch += " and b.postdate>" + parseInt(new Date().getTime() / 1000 - (iLastHours * 60 * 60));

            //  Sortierung
            var szResultOrder = "order by relevance desc";
            if (iSortType == 1)    //  autor
                szResultOrder = "order by b.username, b.postdate desc";
            if (iSortType == 2)    //  zeit
                szResultOrder = "order by b.postdate desc";

            //  ggf. Suche ohne Suchmuster?
            if (!szSearch) {
                var szMatch1 = "b.postdate as relevance,";
                var szMatch2 = "1";
            } else {
                var szMatch1 = "MATCH (content) AGAINST (" + mysqlPool.escape(szSearch) + ") AS relevance,";
                var szMatch2 = "MATCH (content) AGAINST (" + mysqlPool.escape(szSearch) + " IN BOOLEAN MODE)";
            }
            var szSQL = "SELECT" +
                " a.content,a.postid, " +
                " " + szMatch1 +
                " b.username, b.postdate," +
                " c.headline, c.topicid, c.boardid, c.userid" +
                " from postbodies a" +
                " left join posts b on b.postid=a.postid" +
                " left join topics c on c.topicid=b.topicid" +
                " where" +
                " " + szMatch2 +
                " " + szNameSearch +
                " " + szResultOrder +
                " limit 100";

            mysqlPool.query(szSQL,
                function (err, results) {
                    if (err) console.log(err);
                    //  Ergebnisse muessen gefiltert werden da die Suche ggf auch versteckte Beitraege liefert!
                    if (results) {
                        var amResults = [];
                        results.forEach(function (subset) {
                            var flags = ixCheckBoardAccess(subset["boardid"]);
                            var iBoardFlags = flags.board, iExtendFlags = flags.extended;
                            if (iBoardFlags & GBFlags.dfbp_show && iBoardFlags & GBFlags.dfbp_readboard)
                                amResults.push(subset);
                        });
                        amJSON.push({"event": "action", "action": "showSearch", "data": amResults});
                    }
                    next();
                }
            )
        };

        //  ------------------------------------------------------------
        self.saveThread = function (params, next) {
            if (!self.isAdmin()) return next();
            var szDescription = params.description[0];
            //  ToDo: die Flags sind als Parameterin params. Besser waere es diese als Flags direkt zu uebergeben und hier mit einer Maske zu arbeiten!
            var iBoardFlags = (params["dfbf_closed"] ? GBFlags.dfbf_closed : 0) | (params["dfbf_hideboard"] ? GBFlags.dfbf_hideboard : 0) | (params["dfbf_showsubboards"] ? GBFlags.dfbf_showsubboards : 0);
            var iBoardID = params.id[0];
            var szName = params.name[0];
            var iParentID = params.pid[0];
            var aModlist = params.modlist; //  contains array of "<userid|-groupid>~<flags>"

            //board_config
            //+---------+-----------+------------+-----------+------------+--------------+---------+
            //| boardid | prunedays | boardflags | boardrule | headline   | description  | prefixe |
            //+---------+-----------+------------+-----------+------------+--------------+---------+
            mysqlPool.query("update board_config set headline=?, boardflags=?, description=? where boardid=?", [szName, iBoardFlags, szDescription, iBoardID],
                function (err, info) {
                    if (err) {
                        amJSON.push({"event": "showError", "data": err.message});
                        console.log(err);
                        return next()
                    }
                    //boards
                    //+---------+---------------+--------+------------+-----------+-------------+
                    //| boardid | parentboardid | sortid | topiccount | postcount | lasttopicid |
                    //+---------+---------------+--------+------------+-----------+-------------+
                    //  Boardparent neu setzen und darauf achten das die neue Verschachtelung keine verwaisten oder falsch geschachtelten Eintraege hinterlassen!
                    if (iParentID == iBoardID) {
                        amJSON.push({
                            "event": "showError",
                            "data": "Nested Error - Board and parent cannot be the same."
                        });
                        return initBoard(function () {
                            self.getThreads(null, next)
                        });
                    }
                    //  Pruefen ob neuer Parent ein Kindelement darstellt
                    var iTest = iParentID;
                    var bNested = false;
                    var iMaxLoop = 100;
                    while (1) {
                        if (iTest == -1 || iMaxLoop-- < 0) break;
                        if (iTest == iBoardID) {
                            bNested = true;
                            break;
                        }
                        //console.log(["test",iTest,mBoard[iTest].headline]);
                        iTest = mBoard[iTest].pid;
                    }
                    if (bNested) {
                        amJSON.push({
                            "event": "showError",
                            "data": "Nested Error - Board cannot be a child of its own."
                        });
                        return initBoard(function () {
                            self.getThreads(null, next)
                        });
                    }

                    mysqlPool.query("update boards set parentboardid=? where boardid=?", [iParentID, iBoardID],
                        function (err, info) {
                            if (err) {
                                amJSON.push({"event": "showError", "data": err.message});
                                console.log(err);
                                return next()
                            }
                            amJSON.push({"event": "action", "action": "OK"});

                            //  Modliste updaten bis keine Eintraege mehr; Zuerst alle vorhandenen Mods loeschen
                            mysqlPool.query("delete from mods where boardid=?", [iBoardID],
                                function (err, info) {
                                    function saveMod() {
                                        if (aModlist.length) {
                                            var mod = aModlist.pop().split("~");
                                            mysqlPool.query("insert into mods (boardid, userid,flags) values (?,?,?)", [iBoardID, parseInt(mod[0], 10), parseInt(mod[1], 10)],
                                                function (err, info) {
                                                    if (err) console.log(err);
                                                    saveMod();
                                                }
                                            );

                                        } else {
                                            mModlist = null;    //  reset modlist
                                            initBoard(function () {
                                                self.getThreads(null, next)
                                            });
                                        }
                                    }

                                    saveMod();
                                }
                            );
                        }
                    );
                }
            );
        };

        self.getGroups = function (params, next) {
            mysqlPool.query("select a.*,c.id,c.nick,unix_timestamp(c.created) as created,c.titel,c.posts from groups a left join group_members b on b.groupid=a.groupid left join users c on c.id=b.userid",
                function (err, results) {
                    var mGroups = {};
                    for (var i = 0; i < results.length; i++) {
                        var obj = results[i];
                        if (!mGroups[obj.groupid])
                            mGroups[obj.groupid] = {"id": obj.groupid, "name": obj.description, "members": []};
                        if (obj.id)
                            mGroups[obj.groupid].members.push({
                                "id": obj.id,
                                "nick": obj.nick,
                                "titel": obj.titel,
                                "posts": obj.posts,
                                "created": obj.created
                            });
                    }
                    amJSON.push({"event": "newGroups", "data": mGroups})
                    next();
                }
            )
        };

        self.isAdmin = function () {
            return mUser.flags & GBFlags.dfu_superadmin;
        };


        self.insertAccessRule = function (rule, callback) {
            var query = queryBuilder.Query("\
                INSERT INTO board_acl (boardid, accessid, bflags, eflags)\
                VALUES (?boardId, ?accessId, ?bFlags, ?eFlags)\
            ").query(rule);
            mysqlPool.query(query.sql, query.params, function (err, result) {
                callback();
            });
        };

        self.insertACL = function (board, injectPromise) {
            async.each(board.acl, self.insertAccessRule, function (err) {
                // TODO error handling
            }, function (err) {
                // TODO error handling
                injectPromise.ready();
            });
        };

        self.insertBoardConfig = function (board, injectPromise) {
            var query = queryBuilder.Query("\
                INSERT INTO board_config (boardid, prunedays, boardflags, boardrule, headline, description, prefixe)\
                VALUES (?boardId, ?prunedays, ?boardflags, ?boardrule, ?headline, ?description, ?prefixe)\
            ").query(board);
            mysqlPool.query(query.sql, query.params, injectPromise.ready);
        };

        self.insertBoard = function (board, ready) {
            var query = queryBuilder.Query("\
                INSERT INTO boards (parentboardid, sortid)\
                VALUES (?parentBoardId, ?sortId)\
            ").query(board);
            mysqlPool.query(query.sql, query.params, function () {
                var injectPromise = new injectPromise.InjectPromise(2, function () {
                    ready();
                });
                self.insertACL(board, injectPromise);
                self.insertBoardConfig(board, injectPromise);
            });
        };

        self.updateBoard = function (board) {

        };

        self.setBoard = function (params, next) {
            if (!self.isAdmin()) {
                console.log("Non-Admin user trying to set board");
                return next();
            }

            var inputErrors = entities.Board.getInputErrors(params);
            if (inputErrors.hasError()) {
                // TODO handle invalid object
            } else {
                if (board.boardid === null) {
                    self.insertBoard(params, function () {
                        amJSON.push({event: 'addedBoard'});
                        return next();
                    });
                } else {
                    self.updateBoard(params, function () {
                        amJSON.push({event: 'updatedBoard'});
                        return next();
                    });
                }
            }
        };
    }
}
 

