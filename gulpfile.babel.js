const gulp = require('gulp');
const babel = require('gulp-babel');
const less = require('gulp-less');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');

gulp.task('styles', () =>
    gulp.src('styles/styles.less')
        .pipe(less())
        .pipe(cleanCSS())
        .pipe(gulp.dest('public/css'))
);

gulp.task('scripts', () =>
    gulp.src('scripts/*.js')
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest('public/js'))
);

gulp.task('watch', () => {
    gulp.watch('styles/styles.less', gulp.series('styles'));
    gulp.watch('scripts/*.js', gulp.series('scripts'));
});

gulp.task('default', gulp.parallel('styles', 'scripts', 'watch'));
