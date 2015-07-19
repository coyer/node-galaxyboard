var express = require("express");
var app     = express();
var fs      = require("fs");
var zlib    = require('zlib');
var nodemailer = require('nodemailer');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');

var board   =   require("./galaxyboard")(
    {
        "board": {
            "pepper": "hItwrGnDOsiDtm02"    //  Passwords are salted & peppered. This is our pepper.
        },
        "mysql": {
            user:       "root",
            database:   "galaxyboard",
            host:       "localhost",
            connectionLimit: 10             //  MySQLDB DataPool
        }
    }
);

app.use(bodyParser());      //  parsing POST
app.use(cookieParser());    //  parse cookies
app.use(morgan('combined'));

//  Fehler per Mail senden
//  Generelle Fehler abfangen
process.on('uncaughtException', function(err) {
    console.log("uncaughtException");
    console.log(err.stack);

    nodemailer.SMTP = {
      host: 'localhost'
    }
    var mailoptions = {
        "sender": "board@galaxytrek.com",
        "to":     "dbogatz@web.de",
        "subject":"Board Exception",
        "text": JSON.stringify(err.stack)
    }
    nodemailer.send_mail(mailoptions,
        function(error, success){
            console.log("sendmail::error",error);
            console.log("sendmail::success",success);
            console.log('Message ' + (success ? 'sent' : 'failed'));
        }
    );
});

//  Serve "index.html" and process AJAX-Crawls for index-page
app.get('/', function(req, res){
    res.header('Content-Type', 'text/html; charset=UTF-8');
    res.sendfile(__dirname + '/htdocs/index.html');
});

//  Server css/gfx
app.get('/static/*', function(req, res){
    res.sendfile(__dirname + '/htdocs/static/' + req.params[0]);
});

//  Manage API-Calls
app.post('/api', function(req, res){
    //  Process board-commands:
    board.processCommands(req, res, function(amJSON){
        //  Set Content-Type
        res.header('Content-Type', 'text/json; charset=UTF-8');

        //  Check4Compression
        var acceptEncoding = req.headers['accept-encoding'] || '';

        // Note: this is not a conformant accept-encoding parser.
        // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.3
        if (acceptEncoding.match(/\bdeflate\b/)) {
            res.header('content-encoding', 'deflate');
            zlib.deflate(JSON.stringify(amJSON), function(err,result){
                res.send(result);
            })
        } else if (acceptEncoding.match(/\bgzip\b/)) {
            res.header('content-encoding', 'gzip');
            zlib.gzip(JSON.stringify(amJSON), function(err,result){
                res.send(result);
            })
        } else {
            res.send(amJSON);
        }

    });
});

app.listen(8002, "0.0.0.0");
