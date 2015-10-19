var objectWrapper = require('./object.js');
var variableWrapper = require('./variable.js');
var collectionWrapper = require('./collection.js')

exports.for = {
    object: function(object) {
        return new objectWrapper(object);
    },
    variable: function(variable) {
        return new variableWrapper(variable);
    },
    collection: function(collection) {
        return new collectionWrapper(collection);
    }
};