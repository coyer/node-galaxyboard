exports.InjectPromise = function(amount, callback){
    var x = 0;
    this.ready = function(params) {
        if(++x === amount) {
            callback(params);
        }
    };
};