#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const fs = require('fs');
const path = require('path');

async function prepareBaseBuild() {
  const currentBranch = (await exec(`git rev-parse --abbrev-ref HEAD`)).stdout.trim();
  await exec(`rm -rf ./base-build`);
  await exec(`mkdir ./base-build`);
  await exec(`git fetch`);
  await exec(`git checkout main`);
  await exec(`npm run build-prod`);
  await exec(`cp -R ./packages/outline/dist/*.js ./base-build`);
  await exec(`cp -R ./packages/outline-react/dist/*.js ./base-build`);
  await exec(`git checkout ${currentBranch}`);
}

async function prepareBuild() {
  await exec(`rm -rf ./build`);
  await exec(`mkdir ./build`);
  await exec(`cp -R ./packages/outline/dist/*.js ./build`);
  await exec(`cp -R ./packages/outline-react/dist/*.js ./build`);
}

prepareBuild();
prepareBaseBuild();