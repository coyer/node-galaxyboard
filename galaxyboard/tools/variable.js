module.exports = function(variable) {
    this.isInt = function() {
        if(isNaN(parseInt(variable)) || variable % 1 !== 0) {
            return false;
        }
        return true;
    };
};