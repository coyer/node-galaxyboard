var installation = require('./installation.js');
installation.compileSCSS();
installation.createDatabaseJson();

process.on('uncaughtException', function(err) {
    console.log("uncaughtException");
    console.log(err.message);
    console.log(err.stack);
});