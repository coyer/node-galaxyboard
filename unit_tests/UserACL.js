var expect = require('chai').expect;
var UserACL = require('../galaxyboard/UserACL.js');
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

describe('UserACL', function () {
    describe('getFlags', function () {
        it('should return all flags off if board does not exists in raw acl', function () {
            var userACL = new UserACL({});
            var flags = userACL.getFlags(1, 1);
            expect(flags.board).to.equal(0);
            expect(flags.extended).to.equal(0);
        });

        it('should return all flags off if user has no direct board access', function () {
            var userACL = new UserACL(getBasicRawACL());
            var flags = userACL.getFlags(1, 3);
            expect(flags.board).to.equal(0);
            expect(flags.board).to.equal(0);
        });

        it('should return the correct flags if user has board access', function(){
            var userACL = new UserACL(getBasicRawACL());
            var flags = userACL.getFlags(1, 1);
            expect(flags.board).to.equal(getSomeBFlags());
            expect(flags.extended).to.equal(getSomeEFlags());
        });
    });
});