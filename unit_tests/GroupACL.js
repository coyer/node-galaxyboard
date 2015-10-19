var expect = require('chai').expect;
var GroupACL = require('../galaxyboard/GroupACL.js');
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