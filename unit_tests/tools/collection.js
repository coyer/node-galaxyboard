var expect = require('chai').expect;
var tools = require('../../galaxyboard/tools');

describe('tools.for.collection(collection).has([indexes])', function(){
    it('should return true if index in one dimensional array exists', function(){
        var array = ['test1', 'test2', 'test3'];
        var has = tools.for.collection(array).hasChild([1]);
        expect(has).to.be.true;
    });

    it('should return true if indexes in multidimensional array exists', function(){
        var array = [[1, 2, 3], [1, 2, 3], [1, 2, 3]];
        var has = tools.for.collection(array).hasChild([1, 2]);
        expect(has).to.be.true;
    });

    it('should return true if index in object', function(){
        var object = {
            attr1: 'Foo',
            attr2: 'Bar'
        };
        var has = tools.for.collection(object).hasChild(['attr1']);
        expect(has).to.be.true;
    });

    it('should return true if indexes in multidimensional object exists', function(){
        var object = {
            attr1: {
                Foo: true,
                Bar: false
            },
            attr2: {
                Foo: true,
                Bar: false
            }
        };
        var has = tools.for.collection(object).hasChild(['attr1', 'Foo']);
        expect(has).to.be.true;
    });

    it('should return true if indexes in mixed multidimensional collection', function(){
        var collection = {
            Foo: [1, 2, {Foo: true, Bar: false}],
            Bar: {Foo: true, Bar: false}
        };

        var has = tools.for.collection(collection).hasChild(['Foo', 2, ['Bar']]);
        expect(has).to.be.true;
    });

    it('should return false if index missing in array', function(){
        var collection = [1, 2];
        var has = tools.for.collection(collection).hasChild([2]);
        expect(has).to.be.false;
    });

    it('should return false if index missing in multidimensional array', function(){
        var collection = [[1, 2], [1]];
        var has = tools.for.collection(collection).hasChild([1, 1]);
        expect(has).to.be.false;
    });

    it('should return false if index missing in multidimensional object', function(){
        var collection = {
            Foo: {Foo: true, Bar: false},
            Bar: {Foo: true, Bar: false}
        };
        var has = tools.for.collection(collection).hasChild(['Foo', 'False']);
        expect(has).to.be.false;
        has = tools.for.collection(collection).hasChild(['False', 'Foo']);
        expect(has).to.be.false;
    });

    it('should return false if index missing in mixed multidimensional collection', function(){
        var collection = {
            Foo: [1, 2, {Foo: true, Bar: false}],
            Bar: {Foo: true, Bar: false}
        };
        var has = tools.for.collection(collection).hasChild(['Test', 'Foo']);
        expect(has).to.be.false;
    });
});