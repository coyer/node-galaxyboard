var expect = require('chai').expect;
var entities = require('../../galaxyboard/entities');
var flags = require('../../galaxyboard/Flags.js');
var eh = require('../../galaxyboard/ErrorHandling.js');

var defaultBoardFlags =
    flags.board.allowBBCode
    + flags.board.allowSmilies
    + flags.board.allowLinks
    + flags.board.allowBBCodeInBoardRule
    + flags.board.allowSmiliesInBoardRule
    + flags.board.allowLinksInBoardRule
    + flags.board.showSubBoards
    + flags.board.dynamicMenus;

function getBasicBoard() {
    return {
        sortId: 10,
        pruneDays: 10,
        boardFlags: defaultBoardFlags,
        boarRule: '',
        headLine: 'an empty board',
        description: 'this is an empty testboard',
        parentBoardId: 1,
        acl: [
            {
                accessId: 1,
                basicFlags: 0,
                extendedFlags1: 0
            }
        ]
    };
}

describe('tools', function(){
    describe('board', function(){
        describe('getInputErrors()', function(){

            it('should add error if parentBoardId is less than 0', function(){
                var board = getBasicBoard();
                board.parentBoardId = -1;
                var result = entities.Board.getInputErrors(board);
                expect(result.hasError(eh.ERRORS.BASIC_VALIDATION_ERROR)).to.be.true;
            });

            it('should add error if parentBoardId is not an integer', function(){
                var board = getBasicBoard();
                board.parentBoardId = 0.1;
                var result = entities.Board.getInputErrors(board);
                expect(result.hasError(eh.ERRORS.BASIC_VALIDATION_ERROR)).to.be.true;
            });

            it('should not add error if valid board object', function(){
                var board = getBasicBoard();
                var errorInfo = entities.Board.getInputErrors(board);
                expect(errorInfo.hasError()).to.be.false;
            });

            it('should add error on empty acl', function(){
                var board = getBasicBoard();
                board.acl = [];
                var errorInfo = entities.Board.getInputErrors(board);
                expect(errorInfo.hasError(eh.ERRORS.MISSING_ACL)).to.be.true;
            });

        });
    });
});