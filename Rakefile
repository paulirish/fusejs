require 'rake'
require 'rake/packagetask'

FUSEJS_ROOT     = File.expand_path(File.dirname(__FILE__))
FUSEJS_SRC_DIR  = File.join(FUSEJS_ROOT, 'src')
FUSEJS_DIST_DIR = File.join(FUSEJS_ROOT, 'dist')
FUSEJS_PKG_DIR  = File.join(FUSEJS_ROOT, 'pkg')
FUSEJS_TEST_DIR = File.join(FUSEJS_ROOT, 'test')
FUSEJS_TMP_DIR  = File.join(FUSEJS_TEST_DIR, 'unit', 'tmp')
FUSEJS_VERSION  = 'Alpha'

PROTOTYPE_VERSION = '1.6.0.3'

task :default => [:dist, :dist_helper, :package, :clean_package_source]

desc "Builds the distribution."
task :dist do
  $:.unshift File.join(FUSEJS_ROOT, 'lib')
  require 'protodoc'
  
  Dir.chdir(FUSEJS_SRC_DIR) do
    File.open(File.join(FUSEJS_DIST_DIR, 'fuse.js'), 'w+') do |dist|
      dist << Protodoc::Preprocessor.new('fuse.js')
    end
  end
end

desc "Builds the updating helper."
task :dist_helper do
  $:.unshift File.join(FUSEJS_ROOT, 'lib')
  require 'protodoc'
  
  Dir.chdir(File.join(FUSEJS_ROOT, 'ext', 'update_helper')) do
    File.open(File.join(FUSEJS_DIST_DIR, 'prototype_update_helper.js'), 'w+') do |dist|
      dist << Protodoc::Preprocessor.new('prototype_update_helper.js')
    end
  end
end

Rake::PackageTask.new('fuse', FUSEJS_VERSION) do |package|
  package.need_tar_gz = true
  package.package_dir = FUSEJS_PKG_DIR
  package.package_files.include(
    '[A-Z]*',
    'dist/fuse.js',
    'lib/**',
    'src/**',
    'test/**'
  )
end

desc "Builds the distribution and the test suite, runs the tests and collects their results."
task :test => [:dist, :test_units]

require 'test/lib/jstest'
desc "Runs all the JavaScript unit tests and collects the results"
JavaScriptTestTask.new(:test_units => [:build_unit_tests]) do |t|
  testcases        = ENV['TESTCASES']
  tests_to_run     = ENV['TESTS']    && ENV['TESTS'].split(',')
  browsers_to_test = ENV['BROWSERS'] && ENV['BROWSERS'].split(',')
  
  t.mount("/dist")
  t.mount("/test")
  
  Dir.mkdir(FUSEJS_TMP_DIR) unless File.exist?(FUSEJS_TMP_DIR)
  
  Dir["test/unit/tmp/*_test.html"].each do |file|
    test_name = File.basename(file).sub("_test.html", "")
    unless tests_to_run && !tests_to_run.include?(test_name)
      t.run("/#{file}", testcases)
    end
  end
  
  %w( safari firefox ie konqueror opera chrome ).each do |browser|
    t.browser(browser.to_sym) unless browsers_to_test && !browsers_to_test.include?(browser)
  end
end

task :build_unit_tests do
  Dir[File.join('test', 'unit', '*_test.js')].each do |file|
    PageBuilder.new(file, 'fuse.erb').render
  end
end

task :clean_package_source do
  rm_rf File.join(FUSEJS_PKG_DIR, "fuse-#{FUSEJS_VERSION}")
end

desc 'Generates an empty tmp directory for building tests.'
task :clean_tmp do
  puts 'Generating an empty tmp directory for building tests.'
  FileUtils.rm_rf(FUSEJS_TMP_DIR) if File.exist?(FUSEJS_TMP_DIR)
  Dir.mkdir(FUSEJS_TMP_DIR)
end
