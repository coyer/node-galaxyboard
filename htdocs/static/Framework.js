/*
 * @copyright Denys Bogatz, 2009-2011
 * @author denys bogatz
 *
 * Purpose:
 * Javscript/Ajax-Framework for games.
 */

//  ---------------------------------------------------
//  Prototypen Hilfsfunktionen:

$.fn.windowPosition = function() {
    var offset = this.offset();
    return {
        left: offset.left - this.scrollLeft(),
        top: offset.top - this.scrollTop()
    };
};


function floatval(t) {
    var z = parseFloat(t, 10);
    if (isNaN(z)) {
        z = 0.0;
    }
    return z;
}
function intval(t) {
    var z = parseInt(t, 10);
    if (isNaN(z)) {
        z = 0;
    }
    return z;
}

String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, "");
};
String.prototype.ltrim = function () {
    return this.replace(/^\s+/, "");
};
String.prototype.rtrim = function () {
    return this.replace(/\s+$/, "");
};
String.prototype.pad = function (l) {
    if (typeof(l) == "undefined")l = "0";
    return ( l.substr(0, (l.length - this.length)) + this );
};
String.prototype.escape = function () {
    return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
String.prototype.jsstring = function () {
    return this.replace(/\'/g, "\\'");
};
String.prototype.startswith = function (search) {
    return (this.substr(0, search.length) == search) ? true : false;
};
String.prototype.endswith = function (search) {
    return (this.substr(this.length - search.length) == search) ? true : false;
};

function getElementPosition(elem) {
    var xPosition = 0;
    var yPosition = 0;

    while (elem) {
        xPosition += (elem.offsetLeft - elem.scrollLeft + elem.clientLeft);
        yPosition += (elem.offsetTop - elem.scrollTop + elem.clientTop);
        elem = elem.offsetParent;
    }
    return {left: xPosition, top: yPosition};
};

function szxToLocaleDate(t, bWithTime) {
    var d = new Date(t);
    var H = d.getHours();
    var M = d.getMinutes();
    var S = d.getSeconds();
    if (H < 10)H = "0" + H;
    if (M < 10)M = "0" + M;
    if (S < 10)S = "0" + S;
    var r = d.toLocaleString().split(H + ":" + M + ":" + S);
    return ((r.length > 1) ? r[0] : r) + (bWithTime ? (H + ":" + M + ":" + S) : '');
}

function eatEvent(event) {
    if (event.preventDefault) {
        event.preventDefault();
    }
    event.returnValue = false;
    if (event.stopPropagation) {
        event.stopPropagation();
    } else {
        event.cancelBubble = true;
    }
    return false;
}

function tween(callback, duration) {
    var start = new Date().getTime();
    var hTimer = setInterval(function () {
        var percent = Math.min(duration, new Date().getTime() - start) / duration;
        if (percent < 1) return callback(percent);
        clearInterval(hTimer);
        callback(1);
    }, 20);
    return hTimer;
};

function feedback(txt, szClass) {
    if (typeof(szClass) == "undefined")
        szClass = "feedback-done";
    var handle = Math.ceil(Math.random() * 10000);
    var fbox = document.createElement("div");
    fbox.style.position = "fixed";
    fbox.className = szClass;
    fbox.innerHTML = system.translate(txt.replace("\n", "<br>"));
    fbox.style.visibilty = 'hidden';
    fbox.style.whiteSpace = 'nowrap';
    fbox.style.zIndex = '20000';
    fbox.style.opacity = '0';
    var iTime = (szClass == "feedback-error") ? 4000 : 1000;
    var b = document.getElementsByTagName("body")[0];
    b.appendChild(fbox);
    fbox.style.visibilty = '';
    tween(function (pz) {
        fbox.style.opacity = pz;
        //  bubblen
        if (pz == 1) window.setTimeout(function () {
            tween(function (pz) {
                fbox.style.opacity = 1 - pz;
                if (pz == 1)
                    fbox.parentNode.removeChild(fbox);
            }, 1000);
        }, iTime);
    }, 500);
}

var hCurrentOverlay = null;
function vxOpenOverlay(template, onReady) {
    var overlayBox = $('#overlay-box');
    var overlayBoxContent = $('#js_overlay-box-content', overlayBox);
    if (hCurrentOverlay) clearInterval(hCurrentOverlay);
    if (overlayBox.css('display') != 'none') {
        return vxResizeOverlay((template || overlayBoxContent.html()).trim(), onReady);
    }
    if (typeof(template) == "string") {
        overlayBoxContent.html(template.trim());
    }

    // display background; display overlay with visibility: hidden
    $("#dark-bg").css('display', '');
    var body = $('body');
    overlayBox.css('visibility', 'hidden').css('display', '');
    overlayBoxContent.css('overflow', 'visible').css('visibility', 'hidden');
    var iWidth = overlayBoxContent.outerWidth();
    var iHeight = overlayBoxContent.outerHeight();
    var bodyHeight = body.outerHeight();

    //  set max height of overlay:
    if (iHeight > (bodyHeight * 0.9)) {
        iHeight = (bodyHeight * 0.9);
        overlayBoxContent
            .css('overflow', 'auto')
            .css('overflow-y', 'auto')
            .css('overflow-x', 'hidden')
            .css('margin-right', '-20px');
    } else {
        overlayBoxContent
            .css('overflow', 'visible')
            .css('overflow-y', 'visible')
            .css('overflow-x', 'visible')
            .css('margin-right', '0px');
    }

    hCurrentOverlay = tween(function (w) {
        var e = Math.sin(Math.PI / 2 * w);
        overlayBox
            .width(iWidth * e)
            .height(iHeight * e)
            .css('margin-top', -(iHeight * e / 2) - 10 + "px")
            .css('margin-left', -(iWidth * e / 2) - 10 + "px")
            .css('visibility', '')
            .css('opacity', w);

        if (w == 1) {
            overlayBoxContent
                .css('opacity', '0')
                .css('visibility', '');
            hCurrentOverlay = tween(function (w) {
                overlayBoxContent.css('opacity', w);
                if (w == 1 && onReady)onReady();
            }, 200);
        }
    }, 300);
}

function vxCloseOverlay() {
    if ($("#overlay-box").css('display') == "none") return; // muss nix geschlossen werden
    var overlayBox = $('#overlay-box');
    var overlayBoxContent = $('#js_overlay-box-content', overlayBox);
    var iWidth = overlayBoxContent.outerWidth();
    var iHeight = overlayBoxContent.outerHeight;
    var b = document.getElementsByTagName("body")[0];
    $("#dark-bg").get(0).onmousedown = null;
    hCurrentOverlay = tween(function (w) {
        overlayBoxContent.css('opacity', 1 - w);
        if (w == 1) {
            overlayBoxContent.css('visibility', 'hidden');
            hCurrentOverlay = tween(function (w) {
                var e = Math.cos(Math.PI / 2 * w);
                overlayBox
                    .width(iWidth * e)
                    .height(iHeight * e)
                    .css('margin-top', -(iHeight * e / 2) - 10 + "px")
                    .css('margin-left', -(iWidth * e / 2) - 10 + "px");
                if (w == 1) {
                    overlayBox
                        .css('visibility', 'hidden')
                        .css('display', 'none')
                        .css('width', 'auto')
                        .css('height', 'auto');
                    $('#dark-bg').css('display', 'none');
                    overlayBoxContent.html('');
                }
            }, 200);
        }
    }, 200);
}

function vxResizeOverlay(template, onReady) {
    //var pC = $("js_overlay-box-content");
    //var pO = $("overlay-box");
    var overlayBox = $('#overlay-box');
    var overlayBoxContent = $('#js_overlay-box-content');
    var iOldWidth = overlayBoxContent.outerWidth();
    var iOldHeight = overlayBoxContent.outerHeight();
    var b = $('body');
    //  hide:
    hCurrentOverlay = tween(function (pz) {
        pC.style.opacity = 1 - pz;
        overlayBoxContent.css('opacity', pz);
        if (pz == 1) {
            //  put in new template:
            if (typeof(template) == "string") {
                overlayBoxContent.html(template.trim());
            } else if (typeof(template) == "object") {
                overlayBoxContent.html('').appendChild(template);
            } else if (typeof(template) == "function") {
                template();
            }

            //  increase size
            var originalOverflowBehavior = overlayBoxContent.css('overflow');
            var originalVisibilitySetting = overlayBoxContent.css('visibility');
            overlayBoxContent
                .css('overflow', 'visible')
                .css('visibility', 'hidden')
                .css('width', 'auto')
                .css('height', 'auto');
            overlayBox.css('width', 'auto').css('height', 'auto');
            var iWidth = overlayBoxContent.outerWidth();
            var iHeight = overlayBoxContent.outerHeight();
            overlayBoxContent
                .css('overflow', originalOverflowBehavior)
                .css('visibility', originalVisibilitySetting);

            //  max. hoehe overlay festlegen:
            if (iHeight > (b.offsetHeight * 0.9)) {
                iHeight = (b.offsetHeight * 0.9);
                overlayBoxContent
                    .css('overflow', 'auto')
                    .css('overflow-y', 'auto')
                    .css('overflow-x', 'auto')
                    .css('margin-right', '-20px');
            } else {
                overlayBoxContent
                    .css('overflow', 'visible')
                    .css('overflow-y', 'visible')
                    .css('overflow-x', 'visible')
                    .css('margin-right', '0px');
            }
            hCurrentOverlay = tween(function (pz) {
                var e = Math.sin(Math.PI / 2 * pz);
                var w = iOldWidth + (iWidth - iOldWidth) * e;
                var h = iOldHeight + (iHeight - iOldHeight) * e;
                overlayBox
                    .width(w)
                    .height(h)
                    .css('margin-top', -(h / 2) - 10 + "px")
                    .css('margin-left', -(w / 2) - 10 + "px");
                if (pz == 1) hCurrentOverlay = tween(function (pz) {
                    overlayBoxContent.css('opacity', pz);
                    if (pz == 1 && onReady)onReady();
                }, 200);
            }, 300);
        }
    }, 150);
}

// Definition interne Framework-Klasse
function CGalaxyboard() {
    var self = this;
    var mThreads = {};
    var mTopics = {};
    var mPosts = {"topicID": 0, "posts": []};    //  Int.Speicher fuer aktuelle Postings *eines* Topics
    var mUser = {id: -1};
    var mGroups = {};
    var aNews = [];     //  enthaelt sortierte neuste themen
    var iCurrentThread = 0;
    var iCurrentTopic = 0;
    var iCurrentPage = 0;
    var amMessageList = [];
    var mReadTopics = {};
    var iLastMessages = 0;

    self.oldHash = null;
    self.templates = null;
    self.mModifiers = {};
    self.bTemplates = false;
    self.iPostsPerPage = 20;
    self.iCurrentMessage = 0;  //  aktuell geoeffnete PM
    self.ltd = 0;   //  Timestamp neuster Beitrag

    self.vxShowDiv = function (pNode, szNames, szActive, aInactives) {
        var tmp = document.getElementsByName(szNames);
        for (var i = 0; i < tmp.length; i++) {
            tmp[i].className = (tmp[i] == pNode) ? "active" : "";
        }
        for (var i = 0; i < aInactives.length; i++) {
            var display = aInactives[i] == szActive ? "block" : "none";
            $('#' + aInactives[i]).css('display', display);
        }
    };

    self.createTabs = function(selector) {
        $('test');
    };

    //  3 Setters for nodejs
    self.vxSetThreads = function (m) {
        mThreads = m
    };
    self.vxSetTopic = function (id, t) {
        mTopics[id] = t
    };
    self.vxSetPosts = function (p) {
        mPosts = p
    };

    self.mxGetUser = function () {
        return mUser;
    };
    self.amxGetTopics = function (iThreadID) {
        return mTopics[iThreadID] || [];
    };
    self.mxGetTopic = function (iTopicID) {
        if (mPosts["topicID"] == iTopicID) {
            return mPosts["topic"];
        } else {
            return {};
        }
    };
    self.mxGetFormData = function (p) {
        if (!p) {
            return "";
        }

        // formular auswerten
        var mParams = {};
        for (var i = 0; i <= p.elements.length; i++) {
            if (p.elements[i]) {
                // Achtung - checkboxen / radio nur wenn auch aktiv!
                if (p.elements[i].type == "checkbox" && p.elements[i].checked == false)  continue;
                if (p.elements[i].type == "radio" && p.elements[i].checked == false)  continue;
                if (!p.elements[i].name)   continue;
                if (!mParams[p.elements[i].name])
                    mParams[p.elements[i].name] = [];

                if (p.elements[i].type == "select-multiple") {
                    for (var o = 0; o < p.elements[i].length; o++)
                        if (p.elements[i][o].selected)
                            mParams[p.elements[i].name].push(p.elements[i][o].value);
                } else {
                    mParams[p.elements[i].name].push(p.elements[i].value);
                }
            }
        }
        return mParams;
    };

    self.szxGetNavigation = function (iThreadID) {
        var szNav = "";
        var iCur = iThreadID;
        var aNav = [];

        while (iCur >= 0) {
            aNav.push(mThreads[iCur]);
            if (iCur == mThreads[iCur]["pid"])
                break;
            if(iCur != 0) {
                iCur = mThreads[iCur]["pid"];
            } else {
                break;
            }
        }
        for (var i = aNav.length - 1; i >= 0; i--)
            szNav += '<a href="#!showThread~' + aNav[i]["id"] + '">' + aNav[i]["headline"].escape() + '</a>' + ((i > 0) ? ' &raquo; ' : '');
        return szNav;
    };
    self.vxReply = function (iPostID) {
        //  show post container and scroll to it
        $("#js_postreply1").css('display', '');
        $("#js_postreply2").css('display', '');
        window.scrollTo(0, $("#js_postreply1").windowPosition().top);
        //  Reply-Cite?
        if (iPostID) {
            mCite = null;
            for (var i = 0; i < mPosts["posts"].length; i++)
                if (mPosts["posts"][i]["postid"] == iPostID)
                    mCite = mPosts["posts"][i];
            if (mCite)
                $("#obj_bb_content0").val('[quote=' + mCite["username"] + ']' + mCite["content"] + '[/quote]');
        }
    };
    //  Antwort posten
    self.vxPostReply = function (iTopic, txt) {
        self.call([{"cmd": "addPost", "topicID": iTopic, "data": txt}], function (mAction) {
            if (mAction.action == "showTopic") {
                location.hash = "!showTopic~" + mAction.topicID + "~" + mAction.page + "~" + mAction.postID;
            }
        });
    };

    //  Einen Beitrag melden
    self.vxReport = function (iTopicID, iPostID) {
        self.call([{"cmd": "reportPost", "postID": iPostID}], function () {
            self["oldHash"] = null;
            self.loadFromHash();
        });
    };
    //  Einen Beitrag freigeben
    self.vxReportUndo = function (iTopicID, iPostID, cb) {
        self.call([{"cmd": "reportPostUndo", "postID": iPostID}], function () {
            if (!cb) {
                self["oldHash"] = null;
                self.loadFromHash();
            } else cb();
        });
    };
    //  Vote abgeben
    self.vxVote = function (pForm, iTopicID) {
        var arr = pForm.elements;
        var opt = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].checked) opt.push(arr[i].value);
        }
        if (opt.length) {
            self.call([{"cmd": "voteOption", "topicID": iTopicID, "options": opt}], function () {
                $("#js_content").html(self.szxBuildPosts(mPosts));
                self.vxCheckMod();
            });
        }
    };
    //  Einen Post loeschen (letzter Post loescht auch Topic)
    self.vxDeletePost = function (iPostID, bConfirmed) {
        if (bConfirmed) {
            vxCloseOverlay();
            self.call([{"cmd": "delPost", "postID": iPostID}], function (mAction) {
                if (mAction.action == "showTopic")
                    location.hash = "!showTopic~" + mAction.topicID + "~" + mAction.page;
                if (mAction.action == "showThread")
                    location.hash = "!showThread~" + mAction.threadID;
            });
        } else {
            //  Hinweis einblenden
            vxOpenOverlay(self.szxConfirmDeletePostBox(iPostID));
        }
    };
    //  Einen Beitrag editieren
    self.vxEditPost = function (iPostID) {
        $("#postID" + iPostID).html(self.szxBBEditor(iPostID));
        mCite = null;
        for (var i = 0; i < mPosts["posts"].length; i++)
            if (mPosts["posts"][i]["postid"] == iPostID)
                mCite = mPosts["posts"][i];
        if (mCite)
            $("#obj_bb_content" + iPostID).val(mCite["content"]);
        //  Buttons einblenden
        $("#postID" + iPostID + "_buttons").css('display', 'none');
        $("#postID" + iPostID + "_buttons_edit").css('display', '');
    };
    //  Editierten Post senden
    self.vxPostEdit = function (iPostID, txt) {
        self.call([{"cmd": "editPost", "postID": iPostID, "data": txt}], function (mAction) {
            if (mAction.action == "showTopic") {
                self["oldHash"] = null;
                location.hash = "!showTopic~" + mAction.topicID + "~" + mAction.page + "~" + mAction.postID;   //  REMX: hashchange greift ggf nicht
                self.loadFromHash();
            }
        });
    };
    self.vxMoveTopic = function (iTopicID, bConfirmed) {
        if (bConfirmed) {
            vxCloseOverlay();
            self.call([{
                "cmd": "moveTopic",
                "topicID": iTopicID,
                "threadID": iThreadSelectedFromTree
            }], function (mAction) {
                self["oldHash"] = null;
                location.hash = "!showTopic~" + iTopicID + "~1";
                self.loadFromHash();
            });
        } else {
            //  Hinweis einblenden
            vxOpenOverlay(self.szxMoveTopicBox(mThreads, self.mxGetTopic(iTopicID), iTopicID), function () {
                self.vxSelectTree(0)
            });
        }
    };
    self.vxManageThreads = function (iSelected) {
        //  Threadliste einblenden zum Editieren; Vorher Gruppen auslesen.
        self.call([{"cmd": "getGroups"}], function () {
            vxOpenOverlay(self.szxManageThreadsBox(mThreads, mGroups, iSelected));
        });
    };

    self.editCurrentBoard = function() {
        self.vxManageThreads(iCurrentThread);
    };

    self.hasCurrentBoard = function() {
        return iCurrentThread ? true : false;
    };

    //  Shows a resultset for editing mods
    self.vxShowGroupResult = function (groupid) {
        if (!groupid) {
            $("#js_searchresult").css('display', 'none');
            $("#js_btaddgroup").css('display', 'none');
        } else {
            $("#js_searchresult").css('display', 'none');
            $("#js_searchresult").html(self.szxListNames(mGroups[groupid].members));
            $("#js_btaddgroup").css('display', 'block');
        }
    }

    //  Adds a group to modlist
    self.vxAddGroup = function (groupid) {
        //  Close Layer
        $("#js_searchmod").css('display', 'none');
        var modlist = $("#js_editthreads_form").get(0).modlist;
        modlist.options[modlist.length] = new Option(mGroups[groupid].name, -groupid + "~0");
        modlist.options[modlist.length - 1].selected = true;
        modlist.onchange();
    };

    self.vxSaveNewThread = function (pForm) {
        //  Alle eingetragenen Moderatoren selektieren
        var modlist = $("#js_editthreads_form").get(0).modlist;
        modlist.multiple = true;
        for (var i = 0; i < modlist.length; i++) {
            modlist[i].selected = true;
        }

        var mData = self.mxGetFormData(pForm);
        mData["cmd"] = "saveThread";
        self.call([mData], function (mAction) {
            if (mAction.action == "OK") {
                vxCloseOverlay();
                self["oldHash"] = null;
                self.loadFromHash();
            }
        });

    };
    self.vxBanUser = function (iPostID, pForm) {
        if (typeof pForm == "undefined") {
            for (var i = 0; i < mPosts["posts"].length; i++)
                if (mPosts["posts"][i]["postid"] == iPostID)
                    return vxOpenOverlay(self.szxBanUser(mPosts["posts"][i]));
        } else {
            if (!pForm.banreason1.value)
                feedback(self.translate("@@@ERR_BANREASON@@@"), "feedback-error");
            else if (!pForm.banduration.value)
                feedback(self.translate("@@@ERR_BANDURATION@@@"), "feedback-error");
            else
                self.call([{
                    "cmd": "banUser",
                    "postID": iPostID,
                    "userID": pForm.userid.value,
                    "banreason1": pForm.banreason1.value,
                    "banreason2": pForm.banreason2.value,
                    "banduration": pForm.banduration.value
                }], function (mAction) {
                    vxCloseOverlay();
                });
        }
    };
    self.vxShowReports = function () {
        $('#js_content').html(self.szxBuildReports(mThreads, mThreads[0].reports));
        self.vxCheckMod();
    };
    self.vxCheckMod = function () {
        //  Rechte fuer den Thread:
        var adminBox = $('#js_adminbox');
        var content = $('#js_content');
        if (mThreads[0].bIsMod) {
            adminBox
                .html(self.szxBuildAdminBox(mThreads, (mPosts && mPosts.topicID == iCurrentTopic) ? mPosts.topic : null))
                .css('display', 'block');
            content
                .css('margin', '0 auto 0 200px');
        } else {
            adminBox.css('display', 'none');
            content.css('margin', '0 auto');
        }
    };
    self.vxDeleteTopic = function (iTopicID, bConfirmed) {
        if (bConfirmed) {
            vxCloseOverlay();
            self.call([{"cmd": "deleteTopic", "topicID": iTopicID}], function (mAction) {
                self["oldHash"] = null;
                location.hash = "!showThread~" + iCurrentThread;
                self.loadFromHash();
            });
        } else {
            //  Hinweis einblenden
            vxOpenOverlay(self.szxConfirmDeleteTopicBox(iTopicID));
        }
    };
    self.vxCloseTopicMod = function (iTopicID) {
        self.call([{"cmd": "closeTopicMod", "topicID": iTopicID}], function (mAction) {
            self["oldHash"] = null;
            location.hash = "!showTopic~" + iTopicID + "~" + iCurrentPage;
            self.loadFromHash();
        });
    };
    self.vxCloseTopicUser = function (iTopicID) {
        self.call([{"cmd": "closeTopicUser", "topicID": iTopicID}], function (mAction) {
            self["oldHash"] = null;
            location.hash = "!showTopic~" + iTopicID + "~" + iCurrentPage;
            self.loadFromHash();
        });
    };
    self.vxOpenTopicMod = function (iTopicID) {
        self.call([{"cmd": "openTopicMod", "topicID": iTopicID}], function (mAction) {
            self["oldHash"] = null;
            location.hash = "!showTopic~" + iTopicID + "~" + iCurrentPage;
            self.loadFromHash();
        });
    };
    //  Topic Headline + Icons setzen
    self.vxEditTopic = function (iTopicID, bConfirmed, szHeadline, pIcon) {
        if (bConfirmed) {
            var iIcon = 0;
            for (var i = 0; i < pIcon.length; i++) if (pIcon[i].checked) iIcon = pIcon[i].value;
            vxCloseOverlay();
            self.call([{
                "cmd": "editTopic",
                "topicID": iTopicID,
                "headline": szHeadline,
                "icon": iIcon,
                "flags": $("#js_tmp_pinned").is(':checked') ? flags.topic.pinned : 0 // TODO check if .is(':checked') is correct. I do not have internet currently
            }], function (mAction) {
                self["oldHash"] = null;
                location.hash = "!showTopic~" + iTopicID + "~" + iCurrentPage;
                self.loadFromHash();
            });
        } else {
            //  Hinweis einblenden
            var mTopic = self.mxGetTopic(iTopicID);
            vxOpenOverlay(self.szxEditTopicBox(iTopicID), function () {
                var subject = $('#js_tmp_subject');
                subject.val(mTopic.headline);
                $('#js_tmp_icon' + mTopic.icon).prop('checked', true);
                $('#js_tmp_pinned').prop('checked', (mTopic.flags & flags.topic.pinned) ? true : false);
                subject.focus();
            });
        }
    };
    self.vxEditBans = function () {
        self.call([{"cmd": "getBans"}], function (mAction) {
            if (mAction.action == "banList")
                vxOpenOverlay(self.szxEditBans(mAction.data));
        });
    };
    self.vxDeleteBan = function (id) {
        self.call([{"cmd": "delBan", "id": id}], function (mAction) {
            if (mAction.action == "banList")
                vxOpenOverlay(self.szxEditBans(mAction.data));
        });
    };

    self.iThreadSelectedFromTree = 0;
    self.vxToggleTree = function (id) {
        var ul = $('#js_tmp_ul' + id);
        if (ul && mThreads[id].childs.length) {
            mThreads[id].treeopen = mThreads[id].treeopen ? false : true;
            ul.css('display', mThreads[id].treeopen ? 'block' : 'none');
            $('#js_tmp_em' + id).get(0).className = mThreads[id].treeopen ? 'open' : 'close';
        }
    };
    self.vxSelectTree = function (id) {
        iThreadSelectedFromTree = id;
        var arr = document.getElementsByName("js_tmp_tree");
        for (var i = 0; i < arr.length; i++) {
            arr[i].className = "";
        }
        $("#js_tmp_a" + id).get(0).className = "active";
    };
    self.szxGetThreadAsTree = function (id) {
        if (!mThreads[id]) return "";
        var szTpl = '';
        szTpl += '<li><em id="js_tmp_em' + id + '" class="' + (mThreads[id].childs.length ? ((mThreads[id].treeopen == true) ? 'open' : 'close') : '') + '" onclick="system.vxToggleTree(' + id + ')"></em><span class="' + (mThreads[id].childs ? 'folder' : 'folder-empty') + '"></span><a id="js_tmp_a' + id + '" name="js_tmp_tree" href="javascript:void(1)" ondblclick="system.vxToggleTree(' + id + ')" onclick="system.vxSelectTree(' + id + ');" >';
        szTpl += mThreads[id].headline.escape();
        szTpl += '</a>';
        if (mThreads[id].childs.length) {
            szTpl += '<ul class="thread-tree" id="js_tmp_ul' + id + '" style="display:' + ((mThreads[id].treeopen == true) ? 'block' : 'none') + ';">';
            for (var x = 0; x < mThreads[id].childs.length; x++) {
                szTpl += self.szxGetThreadAsTree(mThreads[id].childs[x]);
            }
            szTpl += '</ul>';
        }
        szTpl += '</li>';
        return szTpl;
    };

    self.getBoardsSorted = function() {
        var result = {};
        function iterateBoards(board, path) {
            board.path = path + '/' + board.headline;
            result[board.id] = board;
            if(board.childs) {
                board.childs.forEach(function(child){
                    iterateBoards(mThreads[child], board.path);
                });
            }
        };
        iterateBoards(mThreads[0], '');
        return result;
    };

    function getXHR(a) {
        for (a = 0; a < 4; a++)try {
            return a ? new ActiveXObject([, "Msxml2", "Msxml3", "Microsoft"][a] + ".XMLHTTP") : new XMLHttpRequest
        } catch (e) {
        }
    }

    //  AJAX-Request
    self.call = function (aList, cb) {
        if (!aList || !aList.length) return;
        var szPostdata = "cmd=" + encodeURIComponent(JSON.stringify(aList));
        var url = "./api" + "?ltd=" + self.ltd;
        var xhr = getXHR();

        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                var mAction = self.vxDispatchData(JSON.parse(this.responseText));
                if (cb) cb(mAction);
            }
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(szPostdata);
    };
    //  Thread anzeigen
    self.vxShowThreads = function (iThreadID) {
        var content = $('#js_content');
        if (mThreads && mThreads[iThreadID]) {
            content.html(self.szxBuildThreads(mThreads, iThreadID));
            iCurrentThread = iThreadID;
        } else {
            feedback("Thread not accessible.", "feedback-error");
            iCurrentThread = 0;
            if (mThreads && mThreads[0])
                content.html(self.szxBuildThreads(mThreads, 0));
        }
        self.vxCheckMod();
    };

    //  Neuen Topic erstellen:
    self.vxCreateTopic = function (iThreadID, pForm) {
        var form = $('#js_createtopic_form');
        var rawForm = form.get(0);
        //  Formular pruefen:
        if (!pForm.topic.value.trim()) return feedback("@@@NEEDTOPICHEADLINE@@@", "feedback-error");
        //  Icon pruefen
        var iIcon = 0;
        for (var i = 0; i < pForm.icon.length; i++) if (pForm.icon[i].checked) iIcon = pForm.icon[i].value;
        //  Topic selbst pruefen
        if (!pForm.obj_bb_content0.value.trim()) return feedback("@@@NEEDMESSAGE@@@", "feedback-error");
        //  Falls icon==100 dann Umfrage pruefen:
        if (iIcon == 100) {
            if (rawForm.uoptions.length < 2) return feedback("@@@NEEDPOLLOPTIONS@@@", "feedback-error");
            var iPollOptions = ~~rawForm.auswahl.value;
            var iPollRuntime = ~~rawForm.laufzeit.value;
            var aPollOptions = [];
            for (var i = 0; i <= rawForm.uoptions.options.length - 1; i++)
                aPollOptions.push(rawForm.uoptions.options[i].value);
        } else {
            var iPollOptions = 0;
            var iPollRuntime = 0;
            var aPollOptions = [];
        }


        //  Beitrag abschicken
        self.call([{
            "cmd": "createTopic",
            "threadID": iThreadID,
            "headline": pForm.topic.value,
            "icon": iIcon,
            "content": pForm.obj_bb_content0.value,
            "pollchoosable": iPollOptions,
            "pollruntime": iPollRuntime,
            "polloptions": aPollOptions
        }], function (mAction) {
            if (mAction.action == "showTopic")
                location.hash = "!showTopic~" + mAction.topicID + "~" + mAction.page + "~" + mAction.postID;
        });
    };

    //  EventDispatcher
    self.vxDispatchData = function (amJSON) {
        var mAction = {};   //  sollte nur eine action geben
        for (var x = 0; x < amJSON.length; x++) {
            var evnt = amJSON[x]["event"];
            var data = amJSON[x]["data"];
            switch (evnt) {
                case "action":
                    mAction = amJSON[x];
                    break;
                case "newTemplates":
                    CTemplate.parseTemplate(self.translate(data)).process({"_MODIFIERS": self.mModifiers});
                    break;
                case "newThreads":
                    //  Forum schachteln und dabei News herausfischen
                    for (var key in data) {
                        if (typeof data[key].pid !== 'undefined' && data[key].pid !== null) {
                            data[data[key].pid].childs.push(key);
                        }
                    }
                    //  Forum sortieren
                    for (var key in data) data[key].childs.sort(function (a, b) {
                        return data[a].sortid - data[b].sortid;
                    });
                    //  Neuste Posts "bubblen"
                    aNews = [];
                    for (var key in data) if (data[key].lastpostdate && data[key].topic && (data[key].boardflags & flags.board.noNews) == 0) aNews.push(data[key]);
                    aNews.sort(function (a, b) {
                        return b.lastpostdate - a.lastpostdate
                    });
                    //  5 News aufbauen:
                    var szNews = "";
                    for (var i = 0; i < Math.min(4, aNews.length); i++) {
                        var d = new Date(aNews[i].lastpostdate * 1000);
                        szNews += '<a href="#!showTopic~' + aNews[i].topicid + '~' + Math.ceil(aNews[i].posts / self.iPostsPerPage) + '~' + aNews[i].lastpostid + '" title="' + (aNews[i].username.escape()) + ': ' + aNews[i].topic.escape() + '">' + (String(d.getHours()).pad("00") + ":" + String(d.getMinutes()).pad("00") + " " + aNews[i].topic.escape()) + '</a>';
                    }
                    $("#newscontent").html(szNews);
                    mThreads = data;
                    //  Den "neusten" Beitrag merken:
                    if (aNews.length && aNews[0].lastpostdate > self.ltd)
                        self.ltd = aNews[0].lastpostdate;
                    break;
                case "newTopics":
                    if (data.length) {
                        mTopics[data[0]["boardid"]] = data;
                    }
                    break;
                case "newPosts":
                    mPosts = data || {};
                    break;
                case "newMessageList":
                    amMessageList = data || [];
                    if (location.hash.indexOf("showMessages"))
                        $("#js_content").html(self.szxBuildMessagelist(amMessageList));
                    break;
                case "newMessageCount":
                    mUser["messages"] = data || 0;
                    $("#messagesbtn").html(self.translate("@@@MESSAGES@@@ (" + mUser["messages"] + ")"));
                    //  Falls User ein Popup moechte, dieses nun oeffnen.
                    if (mUser["flags"] & flags.user.automaticallyOpenPM && mUser["messages"] > iLastMessages)
                        self.vxAlertNewMessages();
                    iLastMessages = mUser["messages"];
                    break;
                case "newGroups":
                    mGroups = data;
                    break;
                case "newUser":
                    var iCurrentUser = mUser.id;
                    mUser = data;
                    $("#userinfo").html(data.nick.escape());
                    var userButtons = $("#logoutbtn, #profilebtn, #messagesbtn");
                    var loginButton = $('#loginbtn');
                    if (data.id == 0) {
                        loginButton.css('display', '');
                        userButtons.css('display', 'none')
                    } else {
                        //  Angemeldet
                        loginButton.css('display', 'none');
                        userButtons.css('display', '');
                        $("#messagesbtn").html(self.translate("@@@MESSAGES@@@ (" + mUser["messages"] + ")"));
                    }
                    if (mUser["flags"] & flags.user.automaticallyOpenPM && mUser["messages"] > 0)
                        self.vxAlertNewMessages();
                    //  Falls User veraendert, Seite neu laden:
                    if (iCurrentUser != mUser.id) {
                        vxCloseOverlay(); // egal was offen ist - schlissen!
                        //  Page Reload
                        self["oldHash"] = null;
                        self.loadFromHash();    //  reload der seite
                    }
                    break;
                case "showInfo":
                    feedback(self.translate(data), "feedback-done");
                    break;
                case "showError":
                    feedback(self.translate(data), "feedback-error");
                    break;
            }
        }
        return mAction;
    };
    self.vxAlertNewMessages = function () {
        var h = open('', '_newmessages', 'width=320,height=120,location=no,menubar=no,resizable=no,scrollbars=no,toolbar=no');
        with (h.document) {
            open();
            write(self.translate(self.szxNewMails(mUser["messages"])));
            close();
        }
        h.focus();
    };

    self.Integer = function (n, t, c, b) {
        if (!t || typeof t == 'undefined') t = '.';
        if (typeof b == 'undefined') b = true;
        sn = Math.abs(intval(n)) + "";
        if (sn.length > 3) {
            bg = sn;
            sn = "";
            for (j = 3; j < bg.length; j += 3) {
                ex = bg.slice(bg.length - j, bg.length - j + 3);
                sn = t + ex + sn + "";
            }
            sf = bg.substr(0, (bg.length % 3 == 0) ? 3 : (bg.length % 3));
            sn = sf + sn;
        }
        if (n < 0) var retval = "-" + sn;
        else    var retval = sn;
        if (typeof(c) != "undefined" && Number(c) != Number.NaN && c != n) {
            if (Number(n) < Number(c))
                retval = '<font color="' + (b ? "red" : "green") + '">' + retval + '</font>';
            else
                retval = '<font color="' + (b ? "green" : "red") + '">' + retval + '</font>';
        }
        return retval;
    };
    self.mModifiers.Integer = self.Integer;

    //  Navigation funktioniert ausschliesslich ueber hash
    self.loadFromHash = function (event) {
        if (self["oldHash"] != location.hash) {
            self["oldHash"] = location.hash;

//  Nach oben scrollen
            window.scrollTo(0, 0);

            //  Hash bestimmt was zu laden ist
            var hash = location.hash.substr(1);
            if (hash && hash[0] == "!") hash = hash.substr(1);
            var param = hash.split("~");

            if (param[0] != "showTopic")
                mPosts = null; // gecachte posts loeschen

            switch (param[0]) {
                case "showThread":
                    self.call([{"cmd": "getTopics", "threadID": intval(param[1])}], function () {
                        self.vxShowThreads(intval(param[1]));
                    });
                    break;
                case "createTopic":
                    if (mThreads && mThreads[intval(param[1])])
                        $("#js_content").html(self.szxCreateTopic(intval(param[1]), mThreads[intval(param[1])]));
                    else
                        feedback("ERROR: Parent not available", "feedback-error");
                    break;
                case "showTopic":
                    if (!mPosts || mPosts["topicID"] != intval(param[1]) || iCurrentPage != intval(param[2])) {
                        self.call([{
                            "cmd": "getPosts",
                            "page": intval(param[2]),
                            "topicID": intval(param[1]),
                            "postID": intval(param[3])
                        }], function (mAction) {
                            if (mAction && mAction.action == "showLogin") {
                                $("#js_content").html("");
                                self.vxCheckMod();
                                return self.vxLogin();
                            }
                            if (mPosts && mPosts["topicID"] == intval(param[1])) {
                                iCurrentTopic = intval(param[1]);
                                iCurrentPage = intval(param[2]);
                                $("#js_content").html(self.szxBuildPosts(mPosts));
                                if(param[3]) {
                                    var topicToShow = $('#postID' + param[3]);
                                    if(topicToShow) {
                                        topicToShow.get(0).scrollIntoView();
                                    }
                                }
                                self.vxCheckMod();
                                //  Merken das wir dieses Topic kennen
                                var t = self.mxGetTopic(iCurrentTopic);
                                mReadTopics[iCurrentTopic] = t.lastpostdate;
                            }
                        });
                        break;
                    } else {    //  Posts vorhanden?
                        $("#js_content").html(self.szxBuildPosts(mPosts));
                        if(param[3]) {
                            var topicToShow = $('#postID' + param[3]);
                            if(topicToShow) {
                                topicToShow.get(0).scrollIntoView();
                            }
                        }
                        self.vxCheckMod();
                    }
                    break;
                case "showMessages":
                    self.call([{"cmd": "getMessageList"}]);
                    break;
                case "sid":
                    //  Hash loeschen:
                    self["oldHash"] = ""
                    location.hash = "";
                    self.call([{"cmd": "loginUser", "login": param[1], "passwd": ""}]);
                    break;
                default:
                    location.hash = "!showThread~0";
            }
        }
    };
    self.szxBB = function (txt) {
        var bbreg = new RegExp('\\[([\\w|\\*/]+)=?((\\[[^\\]]*\\])?[^\\]]*)\\]?', 'ig');
        var tags = {};
        tags["b"] = ['<b>', '</b>'];
        tags["u"] = ['<u>', '</u>'];
        tags["s"] = ['<s>', '</s>'];
        tags["i"] = ['<i>', '</i>'];
        tags["color"] = ['<div style="display:inline;color:$1;">', '</div>'];
        tags["bgcolor"] = ['<div style="display:inline;background-color:$1;">', '</div>'];
        tags["font"] = ['<div style="display:inline;font-family:$1;">', '</div>'];
        tags["size"] = ['<div style="display:inline;font-size:$1;line-height:$1;">', '</div>'];
        tags["align"] = ['<div style="display:block; text-align:$1;">', '</div>'];
        tags["code"] = ['<div style="display:block;" class="bb_code"><code>', '</code></div>'];
        tags["quote"] = ['<div style="display:block;" class="bb_quote"><div class="headline">$1</div><code>', '</code></div>'];
        tags["img"] = ['<img align="top" src="', '" />'];
        tags["url"] = ['<a href="$1" target="_blank" class="ext-link">', '</a>'];
        tags["list"] = ['<ul class="bblist$1 bblist">', '</ul>'];
        tags["*"] = ['<li>', '</li>'];
        //  Listen patchen:
        txt = txt.replace(/\[\*\]([^\[\*\]]*)/g, '[*]$1[/*]')
        var stack = [];

        function bb(txt) {
            txt = txt.replace(bbreg,
                function (tag, b, c) {
                    tag = tag.toLowerCase();
                    if (b.substr(0, 1) == "/") {   //  closetag. wird etwas geschlossen das nicht offen war?
                        if (stack[stack.length - 1] != b.substr(1))
                            return "[" + b + "]";   //  Tag zurueckliefern
                        else {
                            stack.pop();
                            return tags[b.substr(1)][1];
                        }
                    } else {
                        if (tags[b]) {
                            stack.push(b);
                            return tags[b][0].replace(/\$1/g, c.escape());
                        } else {
                            return "[" + b + "]";   //  Tag zurueckliefern
                        }
                    }
                });
            //  Geoeffnete TAGs schliessen
            var b = null;
            while (b = stack.pop()) txt += tags[b][1];
            return txt;
        }

        return bb(txt).trim();
    };
    self.mModifiers.BB = self.szxBB;

    self.szxEMOT = function (txt) {
        //  List of emoteicons to be replaces with image.
        var mEmots = [[/\|\|\*\(/gm, 21], [/:-\{\}/gm, 15], [/:-\*/gm, 22], [/\(:-D/gm, 18], [/:-x/gm, 15], [/:-\[/gm, 14], [/:-\//gm, 20], [/:-,/gm, 26], [/:-#/gm, 3], [/:-C/gm, 11], [/8-O/gm, 11], [/:-o/gm, 12], [/8-\)/gm, 13], [/:-1/gm, 4], [/:-\(\*\)/gm, 17], [/:-P/gm, 28], [/:P/gm, 28], [/\}:-&gt;/gm, 19], [/;\)/gm, 7], [/\:\-&gt;/gm, 14], [/;-\)/gm, 7], [/:-\)\)/gm, 10], [/:-\)/gm, 8], [/:\)\)/gm, 10], [/:\)/gm, 8], [/:\(\(/gm, 2], [/:-\(\(/gm, 2], [/:\(/gm, 23], [/:-\(/gm, 23], [/:-c/gm, 1], [/\|-o/gm, 24], [/:-\|/gm, 25], [/\(:-&amp;/gm, 19], [/:\/\)/gm, 9], [/:-D/gm, 6], [/:D/gm, 6], [/:-\$/gm, 17], [/:-/gm, 16], [/\|-0/gm, 24], [/\$-\)/gm, 5], [/\?\)/gm, 27]];
        for (var i = 0; i < mEmots.length; i++) {
            txt = txt.replace(mEmots[i][0], '<img src="/static/emoticons/' + mEmots[i][1] + '.gif" width="24">');
        }
        return txt;
    };
    self.mModifiers.EMOT = self.szxEMOT;

    self.vxLogin = function () {
        vxOpenOverlay(self.szxLoginBox(), function () {
            $("#js_tmp_login").get(0).focus()
        });
    };
    self.vxProcessLogin = function (p) {
        self.call([{"cmd": "loginUser", "login": p.login.value, "passwd": p.passwd.value}]);
    };
    self.vxLogout = function () {
        mPosts = {};
        self.call([{"cmd": "logoutUser"}]);
    };
    self.vxProfile = function () {
        vxOpenOverlay(self.szxProfileBox(mUser), function () {
        });
    };
    self.vxSaveProfile = function (pForm) {
        var signature = pForm.canUseSignature.value;
        var flags = 0;
        if (pForm.dfu_no_pn.checked)     flags |= flags.user.noPn;
        if (pForm.dfu_no_sigs.checked)   flags |= flags.user.noSigs;
        if (pForm.dfu_membermail.checked)flags |= flags.user.allowUserMail;
        if (pForm.dfu_openpm.checked)    flags |= flags.user.automaticallyOpenPM;
        if (mUser.flags & flags.user.superAdmin) {
            var nick = pForm.nick.value;
            var titel = pForm.titel.value;
            var email = pForm.email.value;
            if (pForm.dfu_superadmin.checked)flags |= flags.user.superAdmin;
            if (pForm.dfu_ownavatar.checked) flags |= flags.user.hasAvatar;
        } else {
            var nick = null;
            var titel = null;
            var email = null;
        }
        self.call([{
            "cmd": "saveProfile",
            "userID": pForm.uid.value,
            "signature": signature,
            "flags": flags,
            "nick": nick,
            "titel": titel,
            "email": email
        }], function (mAction) {
            if (mAction.action == "OK") {
                vxCloseOverlay();
            }
        });
    };
    self.translate = function (txt) {
        if (mTranslation) txt = txt.replace(new RegExp('@@@(\\w+)@@@', 'ig'),
            function (a, b) {
                if (mTranslation[b]) return mTranslation[b];
                else return "@@@" + b + "@@@";
            });
        return txt;
    };
    self.lang = function(key) {
        return mTranslation[key] ? mTranslation[key] : "#" + key + "#";
    };
    self.vxSendMessage = function (pForm, cb) {
        try {
            var refid = intval(pForm.refid.value);
        } catch (e) {
            var refid = 0;
        }
        var subject = pForm.subject.value;
        var userid = pForm.userid.value;
        var message = pForm.message.value;
        if (!subject)
            feedback(self.translate("@@@PMNEEDSUBJECT@@@"), "feedback-error");
        else if (!message)
            feedback(self.translate("@@@PMNEEDMESSAGE@@@"), "feedback-error");
        else {
            //  Absenden:
            self.call([{
                "cmd": "writePM",
                "userID": userid,
                "subject": subject,
                "message": message,
                "refID": refid
            }], cb);
        }
    };
    self.vxDeleteMessages = function (arr) {
        if (arr && arr.length)   self.call([{"cmd": "deleteMessages", "messageList": arr}]);
    };
    self.vxShowMessage = function (refid) {
        //  eventually close again ?

        if (self.iCurrentMessage && self.iCurrentMessage == refid) {
            var currentMessage = $("js_msg_" + self.iCurrentMessage);
            if(currentMessage) {
                currentMessage.css('height', 0);
                self.iCurrentMessage = 0;
            }
            return;
        }

        self.call([{"cmd": "getMessage", "refID": intval(refid)}], function (mAction) {
            if(self.iCurrentMessage) {
                var currentMessage = $('#js_msg_' + self.iCurrentMessage);
                if(currentMessage) {
                    currentMessage.css('height', 0);
                }
            }
            if (mAction.action == "showMessage") {
                var newMessage = $('#js_msg_' + refid);
                newMessage.html(self.szxShowMessage(refid, mAction.data));
                newMessage.height(Math.min($("#js_msg_table_" + refid).outerHeight() + 32, 400));
                self.iCurrentMessage = refid;
            }
        });
    };
    self.bIsUnreadTopic = function (iTopicID, iLastPostDate) {
        if (iLastPostDate > mUser["lastlogin"] && iLastPostDate > intval(mReadTopics[iTopicID])) return true;
    };
    self.vxSearch = function (search) {
        self.oldHash = '#!showSearch';
        location.hash = '#!showSearch';
        self.call([{"cmd": "getSearch", "search": search}], function (mAction) {
            if (mAction.action == "showSearch") {
                $("#js_content").html(self.szxShowSearch(mAction.data));
            }
        });
    };
    self.vxShowModOptions = function (value) {
        var btnDeleteMod = $('#js_bt_deletemod');
        var modContainer = $('#js_modcontainer');
        if (value) {
            value = value.split("~");
            var iUserID = value[0];
            var iFlags = value[1];
            var f = $("#js_editthreads_form").get(0);
            // TODO this need to be changed, cause of the modified flag structure
            var o = "dfmod_approvepost,dfmod_setauthor,dfmod_deletepost,dfmod_editpost,dfmod_closereports,dfmod_hidepost,dfmod_replypost,dfmod_managebans,dfmod_postdetails,dfmod_createbans,dfmod_closethread,dfmod_movethread,dfmod_deletethread,dfmod_editthread".split(",")
            //  Flags durchtesten
            for (var i = 0; i < o.length; i++) {
                f.elements[o[i]].checked = (iFlags & window[o[i]]) ? true : false;
            }
            btnDeleteMod.get(0).className = "small-button";
            btnDeleteMod.get(0).onclick = function () {
                //  ueber Moderatoren iterieren und Eintrag loeschen
                for (var i = 0; i < f.modlist.length; i++) {
                    if (f.modlist[i].value.split("~")[0] == iUserID) {
                        f.modlist[i] = null;
                        return self.vxShowModOptions();
                    }
                }
            };
            //  Aenderungen an Flags erfassen:
            modContainer.css('display', 'block');
            modContainer.get(0).onclick = function () {
                //  Flags durchtesten
                var iFlags = 0;
                for (var i = 0; i < o.length; i++) {
                    iFlags |= (f.elements[o[i]].checked) ? window[o[i]] : 0;
                }
                //  Ueber Moderatoren iterieren und Eintrag loeschen
                for (var i = 0; i < f.modlist.length; i++) {
                    if (f.modlist[i].value.split("~")[0] == iUserID) {
                        f.modlist[i].value = iUserID + "~" + iFlags;
                        break;
                    }
                }
            }
        } else {
            modContainer.css('display', 'none').get(0).onclick = null;
            btnDeleteMod.get(0).className = 'small-button inactive';
            btnDeleteMod.get(0).onclick = null;
        }
    };

    //  POLL Funktionen
    self.vxPollAddOption = function () {
        $("#js_createtopic_form").get(0).uoptions.options[$("js_createtopic_form").uoptions.options.length] = new Option($("js_createtopic_form").uoption.value, $("js_createtopic_form").uoption.value, false, true);
        $("#js_createtopic_form").get(0).uoption.value = "";
        self.vxPollSelOptions();
    };
    self.vxPollDelOption = function () {
        for (var i = $("#js_createtopic_form").get(0).uoptions.options.length - 1; i >= 0; i--) {
            if ($("#js_createtopic_form").get(0).uoptions.options[i].selected)
                $("#js_createtopic_form").get(0).uoptions.options[i] = null;
        }
    };
    self.vxPollSelOptions = function () {
        for (var i = $("#js_createtopic_form").get(0).uoptions.options.length - 1; i >= 0; i--)
            $("#js_createtopic_form").get(0).uoptions.options[i].selected = true;
    };
    self.vxShowPollEditor = function (bShow) {
        $("#js_polleditor").css('display', bShow ? "table-row" : "none");
    };




    // BOARD CRUD

    self.openPopupCreateBoard = function() {
        vxOpenOverlay(self.createBoardTemplate(system.getBoardsSorted()));
    };



    // Events
    $(document).on('click', '#btnPostReply', function(){
        system.vxPostReply($(this).attr('data-topic-id'), $('#obj_bb_content0').val());
    });

}
var system = new CGalaxyboard();


