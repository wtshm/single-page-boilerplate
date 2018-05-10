var gulp = require('gulp');
var prettify = require('gulp-html-prettify');

gulp.task('html-prettify', function() {
    gulp.src('dist/**/*.html')
        .pipe(prettify({
            indent_size: 2,
            max_char: 0,
            unformatted: []
        }))
        .pipe(gulp.dest('dist/'))
});