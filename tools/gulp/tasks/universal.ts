import {task} from 'gulp';
import {execTask} from '../util/task_helpers';
import {join} from 'path';
import {buildConfig, sequenceTask} from 'lib-build-tools';

const {packagesDir} = buildConfig;
const appDir = join(packagesDir, 'universal-app');

task('prerender', sequenceTask('prerender:pre', 'prerender:build', 'prerender:clean'));
task('prerender:pre', sequenceTask('clean', 'flex-layout:build-release', 'prerender:deps'));

task('prerender:deps', [], execTask(
  'npm', ['install'], {cwd: appDir}
));

/** Task that builds the universal-app in server mode */
task('prerender:build', execTask(
  'ng', ['build', '--prod', '--app', '1', '--output-hashing=false'],
  {cwd: appDir, failOnStderr: true}
));

task('prerender:clean', [], execTask(
  'rm', ['-rf', 'node_modules'], {
    failOnStderr: true,
    cwd: appDir
  }
));
