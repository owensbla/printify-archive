var gulp = require('gulp');

gulp.task('build', ['browserify', 'adminBrowserify', 'compass', 'adminCompass', 'images', 'copy']);