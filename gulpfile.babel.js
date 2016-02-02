'use strict';

import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import config from './config.json';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const paths = config.paths;

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
        .pipe($.size({
            title: 'images'
        }))
        .pipe(gulp.dest(paths.images.dest));
});

// Copy all files at the root level
gulp.task('copy', () => {
    return gulp.src([
            paths.src + '*',
            '!' + paths.src + '*.ejs'
        ], {
            dot: true
        })
        .pipe($.size({
            title: 'copy'
        }))
        .pipe(gulp.dest(paths.dest));
});

// Compile Sass
gulp.task('sass', () => {
    return gulp.src(paths.styles.src + '**/*.scss')
        .pipe($.newer(paths.styles.tmp))
        //.pipe($.sourcemaps.init())
        .pipe($.sass({
            style: 'expanded',
            compass: true
        })).on('error', $.sass.logError)
        .pipe(gulp.dest(paths.styles.tmp));
});

// Optimize stylesheets
gulp.task('pleeease', () => {
    return gulp.src(paths.styles.tmp + '**/*.css')
        .pipe($.pleeease({
            autoprefixer: {
                browsers: ["last 4 versions"]
            },
            minifier: true,
            out: 'main.min.css'
        }))
        .pipe($.size({
            title: 'styles'
        }))
        //.pipe($.sourcemaps.write('./'))
        .pipe(gulp.dest(paths.styles.dest));
});

gulp.task('styles', () => {
    return runSequence(
        'sass', 'pleeease'
    );
});

// Transpile ES2015 code to ES5
gulp.task('babel', () => {
    return gulp.src(paths.scripts.src + '**/*.js')
        .pipe($.newer(paths.scripts.tmp))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest(paths.scripts.tmp));
});

gulp.task('uglify', () => {
    return gulp.src(paths.scripts.tmp + '**/*.js')
        .pipe($.concat('main.min.js'))
        .pipe($.uglify({
            preserveComments: 'some'
        }))
        .pipe($.size({
            title: 'scripts'
        }))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('scripts', () => {
    return runSequence(
        'babel', 'uglify'
    );
});

// Compile EJS
gulp.task('ejs', () => {
    return gulp.src([
            paths.views.src + '**/*.ejs',
            '!' + paths.views.src + '**/_*.ejs'
        ])
        .pipe($.newer(paths.scripts.tmp))
        .pipe($.ejs())
        .pipe($.rename({
            extname: '.html'
        }))
        .pipe(gulp.dest(paths.views.tmp));
});

// Optimize HTML
gulp.task('htmlmin', () => {
    return gulp.src(paths.views.tmp + '**/*.html')
        .pipe($.useref({searchPath: '{' + paths.tmp + ',' + paths.src + '}'}))
        .pipe($.if('*.html', $.htmlmin({
            removeComments: true,
            collapseWhitespace: true,
            collapseBooleanAttributes: true,
            removeAttributeQuotes: true,
            removeRedundantAttributes: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            removeOptionalTags: true
        })))
        .pipe($.size({
            title: 'views',
            showFiles: true
        }))
        .pipe(gulp.dest(paths.views.dest));
});

gulp.task('views', () => {
    return runSequence(
        'ejs', 'htmlmin'
    );
});

// Clean output directory
gulp.task('clean', () => {
    return del([
        paths.tmp,
        paths.dest,
        '!' + paths.dest + '.git'
    ], {
        dot: true
    });
});

// Watch files for changes & reload
gulp.task('serve', () => {
    browserSync({
        notify: false,
        //server: [paths.tmp, paths.src],
        server: paths.dest,
        port: 3000
    });

    gulp.watch([paths.views.src + '**/*.ejs'], ['views', reload]);
    gulp.watch([paths.styles.src + '**/*.{scss,css}'], ['styles', reload]);
    gulp.watch([paths.scripts.src + '**/*.js'], ['lint', 'scripts', reload]);
    gulp.watch([paths.images.src + '**/*'], reload);
});

// Build production files, the default task
gulp.task('default', ['clean'], callback => {
    return runSequence(
        'styles', 'lint', 'scripts', 'views', 'images', 'copy', 'serve', callback
    );
});