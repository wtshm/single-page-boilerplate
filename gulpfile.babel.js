'use strict';

import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import mainBowerFiles from 'main-bower-files';
import minimist from 'minimist';
import config from './config.json';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const paths = config.paths;
const externals = config.externals;
const knownOptions = {
    string: 'env',
    default: {
        env: process.env.NODE_ENV || 'development'
    }
};
const options = minimist(process.argv.slice(2), knownOptions);

// Lint JavaScript
gulp.task('lint', () => {
    return gulp.src(paths.scripts.src + '**/*.js')
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failOnError()));
});

// Optimize images
gulp.task('images', () => {
    return gulp.src(paths.images.src + '**/*')
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(paths.images.tmp));
});

// Copy all files at the root level
gulp.task('copy', () => {
    return gulp.src([
            paths.tmp + '*',
            '!' + paths.tmp + '*.ejs'
        ], { dot: true })
        .pipe(gulp.dest(paths.dest));
});

// Compile Sass
gulp.task('sass', () => {
    return gulp.src(paths.styles.src + '**/*.scss')
        .pipe($.plumber())
        .pipe($.newer(paths.styles.tmp))
        .pipe($.sass())
        .pipe(gulp.dest(paths.styles.tmp));
});

// Optimize stylesheets
gulp.task('pleeease', () => {
    return gulp.src([paths.styles.tmp + '**/*.css'])
        .pipe($.pleeease({
            autoprefixer: {
                browsers: ["> 1%", "last 4 versions"],
                cascade: true
            },
            minifier: false
        }))
        .pipe(gulp.dest(paths.styles.tmp));
});

// Transpile ES2015 code to ES5
gulp.task('babel', () => {
    return gulp.src([paths.scripts.src + '**/*.js'])
        .pipe($.plumber())
        .pipe($.newer(paths.scripts.tmp))
        .pipe($.babel())
        .pipe(gulp.dest(paths.scripts.tmp));
});

// Compile EJS
gulp.task('ejs', () => {
    return gulp.src([
            paths.views.src + '**/*.ejs',
            '!' + paths.views.src + '**/_*.ejs'
        ])
        .pipe($.plumber())
        .pipe($.newer(paths.views.tmp))
        .pipe($.ejs())
        .pipe($.rename({ extname: '.html' }))
        .pipe(gulp.dest(paths.views.tmp));
});

// Optimize HTML & build
gulp.task('build', () => {
    return gulp.src([paths.views.tmp + '**/*.html'])
        .pipe($.usemin({
            css:        [$.if(options.env === 'production', $.pleeease({ minifier: true }), $.pleeease({ minifier: false }))],
            css_vendor: [$.if(options.env === 'production', $.pleeease({ minifier: true }), $.pleeease({ minifier: false }))],
            js:         [$.if(options.env === 'production', $.uglify())],
            js_vendor:  [$.if(options.env === 'production', $.uglify())]
        }))
        .pipe($.if(options.env === 'production', $.if('*.html', $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true
        }))))
        .pipe(gulp.dest(paths.views.dest));
});

// Inject vendor libraries
gulp.task('bower', () => {
    const vendors = gulp.src(mainBowerFiles(), { read: false });
    return gulp.src(paths.views.tmp + '**/*.html')
        .pipe($.inject(vendors, { relative: true }), { name: 'bower' })
        .pipe(gulp.dest(paths.views.tmp));
});

// Clean output directory
gulp.task('clean', () => {
    return del([
        paths.tmp,
        paths.dest,
        '!' + paths.dest + '.git'
    ], { dot: true });
});

// Watch files for changes & reload
gulp.task('watch', () => {
    browserSync({
        notify: false,
        server: paths.dest,
        port: 3000,
        stream: true
    });

    gulp.watch([paths.views.src + '**/*.ejs'], () => runSequence('ejs', 'bower', 'build', reload));
    gulp.watch([paths.styles.src + '**/*.{scss,css}'], () => runSequence('sass', 'pleeease', 'build', reload));
    gulp.watch([paths.scripts.src + '**/*.js'], () => runSequence('lint', 'babel', 'build', reload));
    gulp.watch([paths.images.src + '**/*'], reload);
});

// Build production files, the default task
gulp.task('default', ['clean'], callback => {
    return runSequence(
        'sass', 'pleeease', 'lint', 'babel', 'ejs', 'bower', 'images', 'copy', 'build', 'watch', callback
    );
});