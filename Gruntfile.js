module.exports = function(grunt) {
    grunt.initConfig({
        bower_concat: {
            all: {
                dest: 'htdocs/static/bower.js'
            }
        }
    });

    // Call these here instead, where the variable grunt is defined.
    require('load-grunt-tasks')(grunt);

    grunt.registerTask('default', [
        'bower_concat'
    ]);
};