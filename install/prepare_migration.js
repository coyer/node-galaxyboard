var fs = require('fs');
var config = require(process.env.GALAXYBOARD_CONFIG);


// create database.json for migration library
var obj = config.db;
obj.multipleStatements = true;
obj.driver = 'mysql';
var result = { dev: obj, other: obj };
fs.writeFileSync(__dirname + '/../database.json', JSON.stringify(result));