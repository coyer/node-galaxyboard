exports.TYPE_WARNING = 1;
exports.TYPE_ERROR = 2;

exports.ERRORS = {
    BASIC_VALIDATION_ERROR: 1000,
    MISSING_ACL: 1100
};

exports.InputError = function (errorType, errorCode) {

    if (typeof errorType !== 'number') {
        throw "errorType has to be an integer";
    }

    if (typeof errorCode !== 'number' && typeof errorCode !== 'string') {
        throw "errorCode must be an integer or string";
    }

    this.errorType = errorType;
    this.errorCode = errorCode;

};

exports.InputErrorCollection = function (errors) {
    var messages = errors ? errors : [];

    this.hasError = function (errorCode) {
        for(key in messages) {
            if(
                (errorCode && messages[key].errorCode === errorCode)
                || messages[key].errorType === exports.TYPE_ERROR
            ) {
                return true;
            }
        }
        return false;
    };

    this.add = function(inputError) {
        messages.push(inputError);
    };
};