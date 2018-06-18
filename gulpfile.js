const gulp = require('gulp')
const del = require('del')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')

const tsconfig = Object.freeze({
	allowJs: true,
	target: 'esnext',
	module: 'CommonJS',
	moduleResolution: 'Node',
	sourceMap: true,
})

gulp.task('clean', () => {
	return del([
		'built',
		'.cache',
	])
})

gulp.task('typescript-dev-common', () => {
	return gulp.src(['src/common/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts(tsconfig))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('built/dev/common'))
})

gulp.task('typescript-server-dev', () => {
	return gulp.src(['src/server/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts(tsconfig))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('built/dev/server'))
})

gulp.task('build-dev', gulp.parallel('typescript-server-dev', 'typescript-dev-common'))

gulp.task('typescript-test-common', () => {
	return gulp.src(['src/common/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts(tsconfig))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('built/test/common'))
})

gulp.task('typescript-server-test', () => {
	return gulp.src(['src/server/**/*.ts'])
		.pipe(ts(tsconfig))
		.pipe(gulp.dest('built/test/server'))
})

gulp.task('other-test', () => {
	return gulp.src(['package.json', 'yarn.lock'])
		.pipe(gulp.dest('built/test'))
})

gulp.task('build-test', gulp.parallel('typescript-server-test', 'other-test', 'typescript-test-common'))
