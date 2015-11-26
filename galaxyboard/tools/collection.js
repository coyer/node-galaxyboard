module.exports = function(collection){

    this.hasChild = function(map) {
        var lastDimension = null;
        return map.every(function(currentValue){
            if(lastDimension === null) {
                if(typeof collection[currentValue] !== 'undefined') {
                    lastDimension = collection[currentValue];
                    return true;
                } else {
                    return false;
                }
            } else if(typeof lastDimension[currentValue] !== 'undefined') {
                lastDimension = lastDimension[currentValue];
                return true;
            } else {
                return false;
            }
        }, true);
    };

};