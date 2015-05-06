var compass      = require('gulp-compass');
var gulp         = require('gulp');
var notify       = require('gulp-notify');
var handleErrors = require('../util/handleErrors');

gulp.task('adminCompass', function() {
  return gulp.src('./public/scss/admin.scss')
    .pipe(compass({
      config_file: 'compass.rb',
      css: 'build/static',
      sass: 'public/scss'
    }))
    .on('error', handleErrors);
});