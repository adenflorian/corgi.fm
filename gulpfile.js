const gulp = require('gulp')
const clean = require('gulp-clean')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')

gulp.task('clean', () => {
	return gulp.src(['built', '.cache'])
		.pipe(clean())
})

gulp.task('typescript-server-dev', () => {
	return gulp.src(['src/server/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts({
			allowJs: true,
			target: 'esnext',
			module: 'CommonJS',
			moduleResolution: 'Node',
			sourceMap: true,
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('built/dev/server'))
})

gulp.task('other-dev', () => {
	return gulp.src(['package.json', 'yarn.lock'])
		.pipe(gulp.dest('built/dev'))
})

gulp.task('build-dev', gulp.parallel('typescript-server-dev', 'other-dev'))

gulp.task('typescript-server-test', () => {
	return gulp.src(['src/server/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts({
			allowJs: true,
			target: 'esnext',
			module: 'CommonJS',
			moduleResolution: 'Node',
			sourceMap: true,
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('built/test/server'))
})

gulp.task('other-test', () => {
	return gulp.src(['package.json', 'yarn.lock'])
		.pipe(gulp.dest('built/test'))
})

gulp.task('build-test', gulp.parallel('typescript-server-test', 'other-test'))

gulp.task('typescript-server-prod', () => {
	return gulp.src(['src/server/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts({
			allowJs: true,
			target: 'esnext',
			module: 'CommonJS',
			moduleResolution: 'Node',
			sourceMap: true,
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('built/prod/server'))
})

gulp.task('other-prod', () => {
	return gulp.src(['package.json', 'yarn.lock'])
		.pipe(gulp.dest('built/prod'))
})

gulp.task('build-prod', gulp.parallel('typescript-server-prod', 'other-prod'))
