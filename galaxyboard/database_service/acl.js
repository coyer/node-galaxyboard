module.exports = function(mysqlPool) {

    this.getUserAcl = function(cb) {
        var sql = "\
            SELECT a.boardid, a.userid, a.bflags, a.eflags, b.nick AS name \
            FROM board_user_acl a \
            LEFT JOIN users b ON b.id = a.userid";
        mysqlPool.query(sql, function (err, results, fields) {
            if (err) {
                console.log(err);
            } else {
                var acl = {};
                results.forEach(function (subset) {
                    if (!acl[subset["boardid"]]) {
                        acl[subset["boardid"]] = {};
                    }
                    acl[subset["boardid"]][subset["userid"]] = subset;
                });
                cb(acl);
            }
        });
    };

    this.getGroupACL = function(cb) {
        var sql = "\
            SELECT a.boardid, a.groupid, a.bflags, a.eflags, b.description AS name\
            FROM board_group_acl a\
            LEFT JOIN groups b ON b.groupid = a.groupid";

        mysqlPool.query(sql, function(err, results, fields){
            var acl = {};
            results.forEach(function(subset){
                if (!acl[subset["boardid"]]) {
                    acl[subset["boardid"]] = {};
                }
                acl[subset["boardid"]][subset["groupid"]] = subset;
            });
            cb(acl);
        });
    };
};
