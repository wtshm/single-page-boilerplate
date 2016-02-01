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
gulp.task('lint', () =>
    gulp.src(paths.scripts.src + '**/*.js')
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failOnError()))
);

// Optimaze images
gulp.task('images', () =>
    gulp.src(paths.images.src + '**/*')
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe($.size({title: 'images'}))
        .pipe(gulp.dest(paths.images.dest))
);

// Copy all files at the root level
gulp.task('copy', () =>
    gulp.src([
            paths.src + '*',
            '!' + paths.src + '*.ejs'
        ], {
            dot: true
        })
        .pipe($.size({title: 'copy'}))
        .pipe(gulp.dest(paths.dest))
);

// Compile CSS
gulp.task('styles', () =>
    gulp.src([
            paths.styles.src + '**/*.scss',
            paths.styles.src + '**/*.css'
        ])
        .pipe($.newer(paths.styles.tmp))
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            style: 'expanded',
            compass: true
        })).on('error', $.sass.logError)
        .pipe(gulp.dest(paths.styles.tmp))
        .pipe($.pleeease({
            autoprefixer: {
                browsers: ["> 1%", "last 4 versions"],
                cascade: true
            },
            minifier: true
        }))
        .pipe($.rename({
            suffix: '.min',
            extname: '.css'
        }))
        .pipe($.size({title: 'styles'}))
        .pipe($.sourcemaps.write('./'))
        .pipe(gulp.dest(paths.styles.dest))
);

// Transpile JavaScript
gulp.task('scripts', () =>
    gulp.src([
            paths.scripts.src + '**/*.js'
        ])
        .pipe($.newer(paths.scripts.tmp))
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest(paths.scripts.tmp))
        .pipe($.concat('main.min.js'))
        .pipe($.uglify({preserveComments: 'some'}))
        .pipe($.size({title: 'scripts'}))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest(paths.scripts.dest))
);

// Compile HTML
gulp.task('templates', () =>
    gulp.src([
            paths.views.src + '**/*.ejs',
            '!' + paths.views.src + '**/_*.ejs'
        ])
        .pipe($.ejs())
        .pipe($.rename({
            extname: '.html'
        }))
        .pipe(gulp.dest(paths.views.tmp))
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
        .pipe($.size({title: 'templates', showFiles: true}))
        .pipe(gulp.dest(paths.views.dest))
);

// Clean output directory
gulp.task('clean', () =>
    del([
        paths.tmp,
        paths.dest + '*',
        '!' + paths.dest + '.git'
    ], {dot: true})
);

// Watch files for changes & reload
gulp.task('watch', () => {
    browserSync({
        notify: false,
        server: paths.dest,
        port: 3000
    });

    gulp.watch([paths.views.src + '**/*.ejs'], ['templates', reload]);
    gulp.watch([paths.styles.src + '**/*.{scss,css}'], ['styles', reload]);
    gulp.watch([paths.scripts.src + '**/*.js'], ['lint', 'scripts', reload]);
    gulp.watch([paths.images.src + '**/*'], reload);
});

// Build production files, the default task
gulp.task('default', ['clean'], callback =>
    runSequence(
        'styles', 'lint', 'templates', 'scripts', 'images', 'copy', 'watch', callback
    )
);