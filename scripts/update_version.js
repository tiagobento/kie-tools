/*
 * Copyright 2019 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const execSync = require("child_process").execSync;

// MAIN

const newVersion = process.argv[2];
const pnpmFilter = ""; // TODO: `${process.argv.slice(3).join(" ")}`;

if (!newVersion) {
  console.error("Usage 'node update_version.js [version]'");
  return 1;
}

let execOpts = {};
const opts = process.argv[3];
if (opts === "--silent") {
  execOpts = { stdio: "pipe" };
} else {
  execOpts = { stdio: "inherit" };
}

try {
  const pnpmVersionArgs = `--git-tag-version=false --allow-same-version=true`;

  console.info("[update-version] Updating root package...");
  execSync(`pnpm version ${newVersion} ${pnpmVersionArgs}`, execOpts);

  console.info("[update-version] Updating workspace packages...");
  execSync(`pnpm -r ${pnpmFilter} exec pnpm version ${newVersion} ${pnpmVersionArgs}`, execOpts);

  console.info(`[update-version] Bootstrapping with updated version...`);
  execSync(`pnpm bootstrap`, execOpts); // TODO: use pnpmFilter

  console.info(`[update-version] Formatting files...`);
  execSync(`pnpm pretty-quick`, execOpts);

  console.info(`[update-version] Updated to '${newVersion}'.`);
  console.info(`[update-version] Done.`);
} catch (error) {
  console.error(error);
  console.error("");
  console.error(`[update-version] Error updating versions. There might be undesired unstaged changes.`);
}
