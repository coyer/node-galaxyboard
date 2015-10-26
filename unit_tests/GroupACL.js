var expect = require('chai').expect;
var GroupACL = require('../galaxyboard/GroupACL.js');
var flags = require('../galaxyboard/Flags.js');

function getSomeBFlags() {
    return flags.rights.board.basic.postAnnouncements
        | flags.rights.board.basic.useIcons
        | flags.rights.board.basic.seeBoard
        | flags.rights.board.basic.createTopic;
}

function getSomeEFlags() {
    return flags.rights.board.extended.deleteOwnPost
        | flags.rights.board.extended.editOwnPost
        | flags.rights.board.extended.reportPost;
}

function getSomeOtherBFlags() {
    return flags.rights.board.basic.seeBoard
        | flags.rights.board.basic.createTopic
        | flags.rights.board.basic.readBoard;
}

function getSomeOtherEFlags() {
    return flags.rights.board.extended.reportPost
        | flags.rights.board.extended.increaseCounter;
}

function getBasicRawACL() {
    return {
        1: {
            1: {
                bflags: getSomeBFlags(),
                eflags: getSomeEFlags()
            },
            2: {
                bflags: getSomeOtherBFlags(),
                eflags: getSomeOtherEFlags()
            }
        }
    };
}

describe('GroupACL', function(){
    describe('getFlags', function(){

        it('should return 0 if board not exists', function(){
            var groupACL = new GroupACL({});
            var flags = groupACL.getFlags(1, [1, 2, 3]);
            expect(flags.board).to.equal(0);
            expect(flags.extended).to.equal(0);
        });

        it('should return 0 if user not in board', function(){
            var groupACL = new GroupACL(getBasicRawACL());
            var flags = groupACL.getFlags(1, [3, 4]);
            expect(flags.board).to.equal(0);
            expect(flags.extended).to.equal(0);
        });

        it('should return correct flags if user in board group', function(){
            var groupACL = new GroupACL(getBasicRawACL());
            var flags = groupACL.getFlags(1, [1, 2, 3]);
            expect(flags.board).to.equal(getSomeBFlags() | getSomeOtherBFlags());
        });

    });
});