const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const header = require('gulp-header')
const footer = require('gulp-footer')
const pump = require('pump')
const rename = require('gulp-rename')

// comments header
let pkg = require('./package.json')
let banner = ['/**',
  ' * <%= pkg.name %> - <%= pkg.description %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.homepage %>',
  ' * @author <%= pkg.author %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''].join('\n')

gulp.task('compress', function (cb) {
  pump([
    // compress JS file
    gulp.src('./dist/render.js'),
    // encapsulate script inside a global function
    header('(function(){'),
    footer('}())'),
    // minify
    uglify(),
    rename({ suffix: '.min' }),
    // add credits
    header(banner, { pkg: pkg }),
    // save end minified file
    gulp.dest('./dist/')
  ], cb)
})

gulp.task('concat', function () {
  // concat index and partials
  return gulp.src([
    './src/index.js',
    './src/partials/main.js',
    './src/partials/methods.js'
  ])
  .pipe(concat('render.js', { newLine: ';\n\n' }))
  .pipe(gulp.dest('./dist/'))
})
