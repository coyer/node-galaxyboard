var fs = require('fs');

var isCloudControl = function() {
    return typeof process.env.CRED_FILE !== 'undefined';
};

var getCredentialFilePath = function() {
    return isCloudControl() ? process.env.CRED_FILE : __dirname + '/credentials.json';
};

exports.getCredentials = function() {
    return require(getCredentialFilePath())
};

exports.createDatabaseJson = function() {
    var credentials = exports.getCredentials();
    var dbType = typeof credentials.MYSQLS === 'undefined' ? 'MYSQLD' : 'MYSQLS';
    var obj = {
        host: credentials[dbType][dbType + '_HOSTNAME'],
        database: credentials[dbType][dbType + '_DATABASE'],
        user: credentials[dbType][dbType + '_USERNAME'],
        password: credentials[dbType][dbType + '_PASSWORD'],
        driver: "mysql",
        multipleStatements: true
    };
    var result = { dev: obj, other: obj };
    fs.writeFileSync(__dirname + '/database.json', JSON.stringify(result));
};