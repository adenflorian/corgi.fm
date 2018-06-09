const gulp = require('gulp')
const clean = require('gulp-clean')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')

gulp.task('clean', () => {
	return gulp.src(['built', '.cache'])
		.pipe(clean())
})

gulp.task('typescript-server', () => {
	return gulp.src(['src/server/**/*.ts'])
		.pipe(sourcemaps.init())
		.pipe(ts({
			outDir: './built/server',
			allowJs: true,
			target: 'esnext',
			module: 'CommonJS',
			moduleResolution: 'Node',
			sourceMap: true,
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('built/server'))
})

gulp.task('other', () => {
	return gulp.src(['package.json', 'yarn.lock'])
		.pipe(gulp.dest('built'))
})

gulp.task('build', gulp.parallel('typescript-server', 'other'))
