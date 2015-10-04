var testBoardCrud = require('./test_board_crud.js');

var config = require(process.env.GALAXYBOARD_CONFIG);
var board = require("../galaxyboard")(
    {
        "board": {
            "pepper": "hItwrGnDOsiDtm02"    //  Passwords are salted & peppered. This is our pepper.
        },
        "mysql": config.db
    }
);

testBoardCrud.TestBoardCrud(board);