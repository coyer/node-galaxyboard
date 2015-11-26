module.exports = function(mysqlPool) {
    this.acl = new (require('./acl.js'))(mysqlPool);
};