'use strict';

import gulp from 'gulp';
import del from 'del';
import runSequence from 'run-sequence';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import mainBowerFiles from 'main-bower-files';
import minimist from 'minimist';
import browserify from 'browserify';
import babelify from 'babelify';
import debowerify from 'debowerify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import fs from 'fs';
import config from './config.json';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;
const paths = config.paths;
const knownOptions = {string: 'env', default: {env: process.env.NODE_ENV || 'development'}};
const options = minimist(process.argv.slice(2), knownOptions);

// Optimize images
gulp.task('images', () =>
    gulp.src(paths.images.src + '**/*')
        .pipe($.cache($.imagemin({
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest(paths.images.dest))
);

// Copy static files
gulp.task('copy', () =>
    gulp.src([paths.bowerComponents + 'font-awesome/fonts/**.*'])
        .pipe(gulp.dest(paths.fonts.dest))
);

// Compile Sass
gulp.task('sass', () =>
    gulp.src(paths.styles.src + '**/*.scss')
        .pipe($.plumber({errorHandler: error => $.notify('sass', error)}))
        .pipe($.newer(paths.styles.dest))
        .pipe($.concat('main.css'))
        .pipe($.sass())
        .pipe($.plumber.stop())
        .pipe(gulp.dest(paths.styles.dest))
);

// Concatenate bower components
gulp.task('bower', () => {
    let bowerPaths = mainBowerFiles('**/*.css');
    bowerPaths.push(paths.styles.dest + '**/*.css');
    gulp.src(bowerPaths)
        .pipe($.concat('main.css'))
        .pipe(gulp.dest(paths.styles.dest));
});

// Optimize stylesheets
gulp.task('pleeease', () =>
    gulp.src(paths.styles.dest + '**/*.css')
        .pipe($.plumber({errorHandler: error => $.notify('pleeease', error)}))
        .pipe($.if(options.env === 'production', $.pleeease({
            autoprefixer: {
                browsers: ["> 1%", "last 4 versions"],
                cascade: true
            },
            minifier: {
                removeAllComments: true
            }
        })), $.pleeease({
            autoprefixer: {
                browsers: ["> 1%", "last 4 versions"],
                cascade: true
            },
            minifier: false
        }))
        .pipe($.plumber.stop())
        .pipe(gulp.dest(paths.styles.dest))
);


// Lint JavaScript
gulp.task('lint', () =>
    gulp.src(paths.scripts.src + '**/*.js')
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failOnError()))
);

// Transpile ES2015 to ES5
gulp.task('browserify', () =>
    browserify(paths.scripts.src + 'main.js')
        .transform(babelify, {presets: ['es2015']})
        .transform(debowerify)
        .bundle()
        .on('error', error => $.notify('babelify', error))
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe(gulp.dest(paths.scripts.dest))
);

// Compile EJS
gulp.task('ejs', () =>
    gulp.src([
            paths.templates.src + '*.ejs',
            '!' + paths.templates.src + '**/_*.ejs'
        ])
        .pipe($.plumber())
        .pipe($.newer(paths.templates.dest))
        .pipe($.ejs(JSON.parse(fs.readFileSync('./config.json'))))
        .pipe($.rename({extname: '.html'}))
        .pipe($.if(options.env === 'production', $.htmlmin({
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
        .pipe(gulp.dest(paths.templates.dest))
);

// Clean output directory
gulp.task('clean', () =>
    del([
        paths.dest,
        '!' + paths.dest + '.git'
    ], {dot: true})
);

// Watch files for changes & reload
gulp.task('watch', () => {
    browserSync({
        notify: false,
        server: paths.dest,
        port: 3000,
        open: false
    });

    gulp.watch([paths.templates.src + '**/*.ejs', './config.json'], () => runSequence('ejs', reload));
    gulp.watch([paths.styles.src + '**/*.{scss,css}'], () => runSequence('sass', 'pleeease', reload));
    gulp.watch([paths.scripts.src + '**/*.js'], () => runSequence('lint', 'browserify', reload));
    gulp.watch([paths.images.src + '**/*'], () => runSequence('images', reload));
});

// Build production files, the default task
gulp.task('default', ['clean'], callback =>
    runSequence(
        'sass', 'bower', 'pleeease', 'lint', 'browserify', 'ejs', 'images', 'copy', 'watch', callback
    )
);
