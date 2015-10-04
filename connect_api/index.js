var mysql = require('mysql');

module.exports = function(app, config){
    var self = this;
    var mysqlPool = mysql.createPool(config.db);

    function createSystem(req, res) {
        //var sql = "INSERT INTO "
    }

    function updateSystem(req, res) {

    }

    function deleteSystem(req, res) {

    }

    function upsertUser(req, res) {

    }

    function deleteUser(req, res) {

    }

    function createSession(req, res) {

    }

    app.post('/connect_api/system', createSystem);
    app.put('/connect_api/system/:systemId', updateSystem);
    app.delete('/connect_api/system/:systemId', deleteSystem);

    app.put('/connect_api/system/:systemId/user/:userId', upsertUser);
    app.delete('/connect_api/system/:systemId/user/:userId', deleteUser);

    app.post('/connect_api/system/:systemId/user/:userId/session', createSession);
};