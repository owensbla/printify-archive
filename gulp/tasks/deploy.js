var gulp = require('gulp');

gulp.task('deploy', ['setBuild', 'build', 'compress']);