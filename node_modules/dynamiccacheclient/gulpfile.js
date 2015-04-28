'use strict';

var gulp = require('gulp');
var webserver = require('gulp-webserver');
var jshint = require('gulp-jshint');
var watch = require('gulp-watch');

var packageName = require('./package.json').name;

gulp.task('webserver', function() {
  gulp.src('.')
      .pipe(webserver({
        livereload: true,
        directoryListing: true,
        open: true
      }));
});

gulp.task('watch', function() {
  gulp.watch('./lib/*', ['lint']);
});

gulp.task('lint', function() {
  return gulp.src(['./lib/*.js', './index.js'])
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
});

gulp.task('default', ['lint']);
