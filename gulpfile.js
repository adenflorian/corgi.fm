const gulp = require('gulp')
const clean = require('gulp-clean')
const ts = require('gulp-typescript')
const sourcemaps = require('gulp-sourcemaps')

gulp.task('html', () => {
    return gulp.src('src/client/**/*.html')
        .pipe(gulp.dest('built/client'))
})

gulp.task('clean', () => {
    return gulp.src('built')
        .pipe(clean())
})

gulp.task('typescript-client', () => {
    return gulp.src('src/client/**/*s')
        .pipe(ts({
            outDir: './built/client',
            allowJs: true,
            target: 'esnext'
        }))
        .pipe(gulp.dest('built/client'));
});

gulp.task('typescript-server', () => {
    return gulp.src('src/server/**/*')
        .pipe(sourcemaps.init())
        .pipe(ts({
            outDir: './built/server',
            allowJs: true,
            target: 'esnext',
            module: "CommonJS",
            moduleResolution: 'Node',
            sourceMap: true
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('built/server'));
});

gulp.task('other', () => {
    return gulp.src(['package.json', 'yarn.lock'])
        .pipe(gulp.dest('built'));
});

gulp.task('build', gulp.series('html', 'typescript-client', 'typescript-server', 'other'))
