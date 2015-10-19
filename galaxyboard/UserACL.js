var tools = require('./tools');
module.exports = function(rawUserACL) {
    this.getFlags = function(boardId, userId) {
        if(tools.for.collection(rawUserACL).hasChild([boardId, userId])) {
            var item = rawUserACL[boardId][userId];
            return {
                board: item['bflags'],
                extended: item['eflags']
            }
        } else {
            return {board: 0, extended: 0};
        }
    };

    this.hasBoardUser = function(boardId, userId) {
        return tools.for.collection(rawUserACL).hasChild([boardId, userId]);
    };

};