var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var browserSync = require('browser-sync').create();
// var gulpSequence = require('gulp-sequence');
var minimist = require('minimist');
var envOptions = {
    string: 'env',
    default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions);

// html
gulp.task('moveHtml', function() {
    return gulp.src('./source/**/*.html')
        .pipe($.plumber())
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream())
});
// 編譯pug
gulp.task('pug', function() {
    return gulp.src('./source/**/*.pug')
        .pipe($.plumber())
        .pipe($.data(function() {
            var khData = require('./source/data/data.json');
            var menu = require('./source/data/menu.json');
            var source = {
                "khData": khData,
                "menu": menu
            };

            return source;
        }))
        .pipe($.pug({
            // Your options in here.
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream());
});


// 編譯scss
gulp.task('sass', function() {
    return gulp.src('./source/scss/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            includePaths: ['./node_modules/bootstrap/scss']
        }).on('error', $.sass.logError))
        .pipe($.postcss([autoprefixer()]))
        .pipe($.if(options.env === 'production', $.cleanCss())) //如果輸出格式為prodyction，則壓縮
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream());
});

// 編譯js
gulp.task('babel', () =>
    gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
        presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production', $.uglify({
        compress: {
            drop_console: true
        }
    }))) //如果輸出格式為prodyction，則壓縮
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream())
);

// 將bower載入的套件輸出至自己的專案資料夾中
// gulp.task('bower', function() {
//     return gulp.src(mainBowerFiles())
//         .pipe(gulp.dest('./.tmp/vendors'))
// });

// 將bower載入的套件合併為一隻js
gulp.task('vendorJS', function() {
    return gulp.src(['./node_modules/jquery/dist/jquery.min.js',
            './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
        ])
        .pipe($.concat('vendors.js'))
        .pipe($.if(options.env === 'production', $.uglify({
            compress: {
                drop_console: true
            }
        }))) //如果輸出格式為prodyction，則壓縮
        .pipe(gulp.dest('./public/js'))
})

// 建立伺服器
// gulp.task('browser-sync', function() {
//     browserSync.init({
//         server: { baseDir: "./public" },
//         reloadDebounce: 2000 // 重新整理間隔需2秒以上
//     });
// });

// 壓縮圖片
gulp.task('image-min', function() {
    return gulp.src('./source/img/*')
        .pipe($.if(options.env === 'production', $.imagemin()))
        .pipe(gulp.dest('./public/img'))
});

// 監控，即時更新
// gulp.task('watch', function() {
//     gulp.watch('./source/scss/**/*.html', ['moveHtml']);
//     gulp.watch('./source/scss/**/*.scss', ['sass']);
//     gulp.watch('./source/**/*.pug', ['pug']);
//     gulp.watch('./source/**/*.js', ['babel']);
// });

// 部署到github上
gulp.task('deploy', function() {
    return gulp.src('./public/**/*')
        .pipe($.ghPages());
});

//刪除 .tmp public資料夾
gulp.task('clean', () => {
    return gulp.src(['./.tmp', './public'], { read: false, allowEmpty: true })
        .pipe($.clean());
});

// 完成專案後，最終執行 gulp build --env production
// gulp.task('build', gulpSequence('clean', 'moveHtml', 'pug', 'sass', 'babel', 'vendorJS', 'image-min'));
// 開發中執行gulp
// gulp.task('default', ['moveHtml', 'pug', 'sass', 'babel', 'vendorJS', 'image-min', 'browser-sync', 'watch']);
// gulp 4.0
gulp.task('build',
    gulp.series(
        'clean',
        gulp.parallel('moveHtml', 'pug', 'sass', 'babel', 'vendorJS', 'image-min')
    )
)

gulp.task('default',
    gulp.series(
        'clean',
        gulp.parallel('pug', 'sass', 'babel', 'vendorJS'),
        function(done) {
            browserSync.init({
                server: { baseDir: "./public" },
                reloadDebounce: 2000 // 重新整理間隔需2秒以上
            });

            gulp.watch('./source/scss/**/*.html', gulp.series('moveHtml'));
            gulp.watch('./source/scss/**/*.scss', gulp.series('sass'));
            gulp.watch('./source/**/*.pug', gulp.series('pug'));
            gulp.watch('./source/**/*.js', gulp.series('babel'));
            done();
        }
    )
)