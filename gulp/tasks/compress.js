var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css');

gulp.task('compress', function() {
  gulp.src('./build/static/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('./build/static'));

  gulp.src('./build/static/*.css')
    .pipe(minifyCSS({keepBreaks:false}))
    .pipe(gulp.dest('./build/static'));
});