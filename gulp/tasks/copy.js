var gulp = require('gulp'),
    merge = require('merge-stream');

gulp.task('copy', function() {
  var publicStatic,
      baseStatic;

  publicStatic = gulp.src(['public/extras/**', 'public/fonts/**'], { base: 'public' })
    .pipe(gulp.dest('build'));

  baseStatic = gulp.src(['public/robots.txt'], { base: 'public' }).pipe(gulp.dest('build'));

  return merge(publicStatic, baseStatic);
});