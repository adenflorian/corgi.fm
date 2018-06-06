const gulp = require('gulp')
const clean = require('gulp-clean')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')

gulp.task('html', () => {
	return gulp.src('src/client/**/*.html')
		.pipe(gulp.dest('built/client'))
})

gulp.task('css', () => {
	return gulp.src('src/client/**/*.css')
		.pipe(gulp.dest('built/client'))
})

gulp.task('clean', () => {
	return gulp.src('built')
		.pipe(clean())
})

gulp.task('typescript-client', () => {
	return gulp.src(['src/client/**/*.ts', 'src/client/**/*.tsx'])
		.pipe(ts({
			outDir: './built/client',
			allowJs: true,
			target: 'esnext',
			jsx: 'react',
			moduleResolution: 'Node',
		}))
		.pipe(gulp.dest('built/client'))
})

gulp.task('node_modules', () => {
	return gulp.src([
		'node_modules/react/umd/react.development.js',
		'node_modules/react-dom/umd/react-dom.development.js',
	])
		.pipe(gulp.dest('built/client'))
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

gulp.task('build', gulp.parallel(
	'html', 'css', 'typescript-client', 'node_modules', 'typescript-server', 'other'))
