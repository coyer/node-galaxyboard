var expect = require('chai').expect;
var tools = require('../../galaxyboard/tools');

describe('tools.for.object(object)', function () {
    describe('hasAttribute(string)', function() {
        it('should return true if object has attribute', function() {
            var hasAttr = tools.for.object({
                attr1: 1,
                attr2: 2
            }).hasAttribute('attr1');
            expect(hasAttr).to.be.true;
        });
    });
    describe('hasAttribute(array)', function () {
        it('should return true if attribute exists', function () {
            var hasAttr = tools.for.object({
                attr1: 1,
                attr2: 2
            }).hasAttribute(['attr1', 'attr2']);
            expect(hasAttr).to.be.true;
        });
    });
});