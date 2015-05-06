var gulp = require('gulp');

gulp.task('watch', ['setWatch', 'browserSync'], function() {
  gulp.watch('public/scss/**', ['compass', 'adminCompass']);
  gulp.watch('public/images/**', ['images']);
  gulp.watch('public/fonts/**', ['copy']);
  gulp.watch('public/extras/**', ['copy']);
  gulp.watch('lib/templates/**', ['build']);
  // Note: The browserify task handles js recompiling with watchify
});