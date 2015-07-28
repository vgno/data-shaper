/* eslint no-console: 0 */
'use strict';

var gulp = require('gulp');
var eslint = require('gulp-eslint');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');

var codePath = 'lib/**/*.js';
var testPath = 'tests/**/*.js';
var lintCodePaths = [codePath, testPath, 'gulpfile.js'];

function getMochaStream() {
    return gulp
        .src(testPath)
        .pipe(mocha({ reporter: 'spec' }));
}

gulp.task('coverage:prepare', function() {
    return gulp.src(codePath)
        .pipe(istanbul())
        .pipe(istanbul.hookRequire());
});

gulp.task('coverage', ['coverage:prepare'], function() {
    return getMochaStream().pipe(istanbul.writeReports());
});

gulp.task('mocha', getMochaStream);

gulp.task('test', ['lint', 'coverage']);

// Lint project and test files
gulp.task('lint', function() {
    return gulp.src(lintCodePaths)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('default', ['test']);
