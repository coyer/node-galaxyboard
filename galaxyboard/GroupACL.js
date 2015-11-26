var tools = require('./tools');

module.exports = function (rawGroupACL) {
    this.getFlags = function (boardId, groups) {
        var iBoardFlags = 0;
        var iExtendFlags = 0;
        if (rawGroupACL[boardId]) {
            for (var groupId in rawGroupACL[boardId]) {
                if(groups.indexOf(parseInt(groupId)) !== -1) {
                    iBoardFlags |= rawGroupACL[boardId][groupId]["bflags"];
                    iExtendFlags |= rawGroupACL[boardId][groupId]["eflags"];
                }
            }
        }
        return {"board": iBoardFlags, "extended": iExtendFlags};
    };

    this.hasBoardGroup = function(boardId, groupsOfUser) {
        if(rawGroupACL[boardId]) {
            return tools.for.object(rawGroupACL[boardId]).hasAttribute(groupsOfUser);
        } else {
            return false;
        }
    };
};