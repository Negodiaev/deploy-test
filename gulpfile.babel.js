'use strict';

require("babel-register")({ignore: false});

import gulp             from 'gulp';
import pug              from 'gulp-pug';
import scss             from 'gulp-sass';
import csslint          from 'gulp-csslint';
import uncss            from 'gulp-uncss';
import postcss          from 'gulp-postcss';
import autoprefixer     from 'autoprefixer';
import cssnext          from 'cssnext';
import csso             from 'gulp-csso';
import eslint           from 'gulp-eslint';
import babel            from 'gulp-babel';
import uglify           from 'gulp-uglify';
import sourcemaps       from 'gulp-sourcemaps';
import pump             from 'pump';
import imagemin         from 'gulp-imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminOptipng  from 'imagemin-optipng';
import imageminSvgo     from 'imagemin-svgo';
import watch            from 'gulp-watch';
import rimraf           from 'rimraf';
import browserSync      from 'browser-sync';

const dirs = {
  src: 'src',
  build: 'docs'
}

const path = {
	build: {
    html:        `${dirs.build}/`,
		js:          `${dirs.build}/js/`,
		css:         `${dirs.build}/css/`,
		img:         `${dirs.build}/images/`,
		otherImages: `${dirs.build}/`,
		fonts:       `${dirs.build}/fonts/`
	},
	src: {
		pug:         `${dirs.src}/*.pug`,
		html:        `${dirs.src}/**/*.html`,
	  js:          `${dirs.src}/js/**/*.js`,
		style:       `${dirs.src}/scss/styles.scss`,
		img:         `${dirs.src}/images/**/*.*`,
		otherImages: `${dirs.src}/*.+(png|jpg|jpeg|svg|gif|ico)`,
		fonts:       `${dirs.src}/fonts/**/*.*`
	},
	watch: {
    pug:         `${dirs.src}/**/*.pug`,
		html:        `${dirs.src}/**/*.html`,
	  js:          `${dirs.src}/js/**/*.js`,
		style:       `${dirs.src}/scss/**/*.scss`,
		img:         `${dirs.src}/images/**/*.*`,
		otherImages: `${dirs.src}/*.+(png|jpg|jpeg|svg|gif|ico)`,
		fonts:       `${dirs.src}/fonts/**/*.*`
	},
	clean: `./${dirs.build}/`
};

var config = {
	server: {
		baseDir: `./${dirs.build}/`
	},
	// tunnel: true,
	host: 'localhost',
	port: 9000,
	logPrefix: 'Alex',
	notify: false
};

gulp.task('webserver', function () {
	browserSync.init(config);
	browserSync.watch(`${dirs.build}/**/*.*`).on('change', browserSync.reload);
});

gulp.task('clean', function (cb) {
	rimraf(path.clean, cb);
});

gulp.task('pugtohtml', function() {
  return gulp.src(path.src.pug)
  .pipe(pug({
		/* Options */
		pretty: true
	}))
	.pipe(gulp.dest(dirs.src))
});

gulp.task('html:build', function () {
	return gulp.src(path.src.html)
		.pipe(gulp.dest(path.build.html));
});

gulp.task('style:build', function () {
	var postCssProcessors = [
		autoprefixer,
		// cssnext
	];

	return	gulp.src(path.src.style)
		// .pipe(sourcemaps.init())
		.pipe(scss().on('error', scss.logError))
		// .pipe(csslint())
		// .pipe(csslint.formatter())
		.pipe(postcss(postCssProcessors))
		// .pipe(uncss({
		// 	html: [path.src.html]
		// }))
		.pipe(csso())
		// .pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css));
});

gulp.task('js:build', function (cb) {
	pump([
		gulp.src(path.src.js),
		// sourcemaps.init(),
    babel(),
		eslint({
	    'rules': {
	        'quotes': [1, 'single'],
	    }
	  }),
		eslint.format(),
		eslint.failAfterError(),
		uglify(),
		// sourcemaps.write(),
		gulp.dest(path.build.js)
		],
		cb
	);
});

gulp.task('image:build', function () {
	return gulp.src(path.src.img)
		.pipe(imagemin([
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 6}),
			imagemin.svgo({plugins: [{removeViewBox: true}]})
		], {
			verbose: true
		}
	))
		.pipe(gulp.dest(path.build.img));
});

gulp.task('otherImages:build', function () {
	return gulp.src(path.src.otherImages)
		.pipe(imagemin([
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 6}),
			imagemin.svgo({plugins: [{removeViewBox: true}]})
		], {
			verbose: true
		}
	))
		.pipe(gulp.dest(path.build.otherImages));
});

gulp.task('fonts:build', function() {
	return gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.build.fonts))
});

gulp.task('build', gulp.series(
	'clean',
	'pugtohtml',
	gulp.parallel(
		'html:build',
		'style:build',
		'js:build',
		'fonts:build',
		'image:build',
		'otherImages:build')
));

gulp.task('watch', function() {
	gulp.watch(path.watch.pug,         gulp.series('pugtohtml'));
	gulp.watch(path.watch.html,        gulp.series('html:build'));
	gulp.watch(path.watch.style,       gulp.series('style:build'));
	gulp.watch(path.watch.js,          gulp.series('js:build'));
	gulp.watch(path.watch.fonts,       gulp.series('fonts:build'));
	gulp.watch(path.watch.img,         gulp.series('image:build'));
	gulp.watch(path.watch.otherImages, gulp.series('otherImages:build'));
});

gulp.task('default', gulp.series('build', gulp.parallel('watch', 'webserver')));
