var eh = require('../ErrorHandling.js');
var tools = require('../tools');

exports.getInputErrors = function(board) {
    var inputErrorCollection = new eh.InputErrorCollection();
    if(board.parentBoardId < 0 || !tools.for.variable(board.parentBoardId).isInt()) {
        inputErrorCollection.add(new eh.InputError(eh.TYPE_ERROR, eh.ERRORS.BASIC_VALIDATION_ERROR));
    }

    if(board.acl.length === 0) {
        inputErrorCollection.add(new eh.InputError(eh.TYPE_ERROR, eh.ERRORS.MISSING_ACL));
    }

    return inputErrorCollection;
};