var expect = require('chai').expect;
var tools = require('../../galaxyboard/tools');

describe('for/variable.js', function(){
    describe('isInt()', function(){
        it('should return true on integer', function(){
            //expect(tools.Types.isInt(10)).to.be.true;
            expect(tools.for.variable(10).isInt()).to.be.true;
        });

        it('should return false on string', function(){
            //expect(tools.Types.isInt('some string')).to.be.false;
            expect(tools.for.variable('some string').isInt()).to.be.false;
        });

        it('should return false on float', function(){
            //expect(tools.Types.isInt(10.10)).to.be.false;
            expect(tools.for.variable(10.10).isInt()).to.be.false;
        });

        it('should return false on object', function(){
            //expect(tools.Types.isInt({bla: 10})).to.be.false;
            expect(tools.for.variable({foo: 10}).isInt()).to.be.false;
        });

        it('should return false on function', function(){
            //expect(tools.Types.isInt(function(){return 10;})).to.be.false;
            expect(tools.for.variable(function(){}).isInt()).to.be.false;
        });

        it('should return false on empty string', function(){
            //expect(tools.Types.isInt('')).to.be.false;
            expect(tools.for.variable('').isInt()).to.be.false;
        });

        it('should return true on integer stored as float', function(){
            //expect(tools.Types.isInt(1.0)).to.be.true;
            expect(tools.for.variable(1.0).isInt()).to.be.true;
        });
    });
});