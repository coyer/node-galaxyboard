exports.isInt = function(val) {
    if(isNaN(parseInt(val)) || val % 1 !== 0) {
        return false;
    }
    return true;
};