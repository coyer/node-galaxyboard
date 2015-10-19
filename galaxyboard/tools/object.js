function hasAttributeWithArray(obj, arr) {
    var len = arr.length;
    for(var x = 0; x < len; x++) {
        if(obj[arr[x]]) {
            return true;
        }
    }
    return false;
}

module.exports = function(object) {
    this.hasAttribute = function(filter) {
        if(typeof filter === 'string') {
            return object[filter] ? true : false;
        } else {
            return hasAttributeWithArray(object, filter);
        }
    };
};