var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish'),    
    eslint = require('gulp-eslint'),
	gulpSequence = require('gulp-sequence'),
    beautify = require('gulp-jsbeautifier'),
    shell = require('gulp-shell');

var srcDir = 'src';
var destDir = 'dist';
var docDir = 'doc';
var destFilename = 'coreleo.js';
var destMinFilename = 'coreleo.min.js';
var jsFiles = [ srcDir + '/**/*.js' ];


gulp.task('jshint', function() {
	  return gulp.src(jsFiles)
	    .pipe(jshint({"expr": "true"}))
	    .pipe(jshint.reporter(stylish))
	    .pipe(jshint.reporter('fail'));
});


gulp.task('eslint', function() {
  return gulp.src(jsFiles)
	    .pipe(eslint({
	    	fix: true
	    }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});


gulp.task('beautify', function() {
	  gulp.src(jsFiles)
	    .pipe(beautify())
	    .pipe(gulp.dest(srcDir))
});

/**
 * I couldn't find a gulp tool for requirejs optimizer so instead 
 * i'm using gulp shell to execute the optimizer via nodejs.
 * 
 */
gulp.task('requirejs-optimizer', shell.task([
    'node node_modules/requirejs/bin/r.js -o build_scripts/build.js optimize=none out=' + destDir + '/' + destFilename,
    'node node_modules/requirejs/bin/r.js -o build_scripts/build.js preserveLicenseComments=false out=' + destDir + '/' + destMinFilename,
]));


gulp.task('jsdoc', shell.task([
    'node node_modules/jsdoc/jsdoc.js --readme ./README.md ' + srcDir + ' -r -c jsdoc-conf.json -d ' +   docDir
]));


gulp.task('build', function(cb) {
	gulpSequence('jshint', 'eslint', 'beautify', 'requirejs-optimizer', 'jsdoc')(cb);
});


gulp.task('default', ['build'] );