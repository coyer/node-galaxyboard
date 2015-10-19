var expect = require('chai').expect;
var UserACL = require('../galaxyboard/UserACL.js');
var flags = require('../galaxyboard/GBFlags.js');

function getSomeBFlags() {
    return flags.dfbp_postanounce
    | flags.dfbp_useicons
    | flags.dfbp_show
    | flags.dfbp_createtopic;
}

function getSomeEFlags() {
    return flags.dfbp_deleteownpost
    | flags.dfbp_editownpost
    | flags.dfbp_reportpost;
}

function getSomeOtherBFlags() {
    return flags.dfbp_show
    | flags.dfbp_createtopic
    | flags.dfbp_readboard;
}

function getSomeOtherEFlags() {
    return flags.dfbp_reportpost
    | flags.dfbp_incpostcounter;
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