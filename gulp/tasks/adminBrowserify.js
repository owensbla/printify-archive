/* browserify task
   ---------------
   Bundle javascripty things with browserify!

   If the watch task is running, this uses watchify instead
   of browserify for faster bundling using caching.
*/

var browserify   = require('browserify');
var watchify     = require('watchify');
var bundleLogger = require('../util/bundleLogger');
var gulp         = require('gulp');
var handleErrors = require('../util/handleErrors');
var source       = require('vinyl-source-stream');
var uglify       = require('gulp-uglify');
var streamify    = require('gulp-streamify');

gulp.task('adminBrowserify', function() {

  var bundleMethod = global.isWatching ? watchify : browserify;

  var bundler = bundleMethod({
    // Specify the entry point of your app
    entries: ['./public/js/admin.js'],
    // Add file extentions to make optional in your requires
    extensions: ['.js', '.hbs']
  });

  var bundle = function() {
    // Log when bundling starts
    bundleLogger.start();

    if (global.isBuilding === true) {
      return bundler
        // Enable source maps!
        .bundle({debug: true})
        // Report compile errors
        .on('error', handleErrors)
        // Use vinyl-source-stream to make the
        // stream gulp compatible. Specifiy the
        // desired output filename here.
        .pipe(source('admin.js'))
        .pipe(streamify(uglify()))
        // Specify the output destination
        .pipe(gulp.dest('./build/static'))
        // Log when bundling completes!
        .on('end', bundleLogger.end);
    } else {
      return bundler
        // Enable source maps!
        .bundle({debug: true})
        // Report compile errors
        .on('error', handleErrors)
        // Use vinyl-source-stream to make the
        // stream gulp compatible. Specifiy the
        // desired output filename here.
        .pipe(source('admin.js'))
        // Specify the output destination
        .pipe(gulp.dest('./build/static'))
        // Log when bundling completes!
        .on('end', bundleLogger.end);
    }


  };

  if(global.isWatching) {
    // Rebundle with watchify on changes.
    bundler.on('update', bundle);
  }

  return bundle();
});