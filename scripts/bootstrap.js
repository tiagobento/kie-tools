/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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

const pnpmFilter = process.argv.slice(2).join(" ");
if (pnpmFilter.length === 0) {
  console.info("[bootstrap] Bootstrapping all packages...");
} else {
  console.info(`[bootstrap] Bootstrapping packages filtered by '${pnpmFilter}'...`);
}

const execOpts = { stdio: "inherit" };

console.info("\n\n[bootstrap] Installing dependencies...");
execSync(`pnpm install-dependencies ${pnpmFilter}`, execOpts);

console.info("\n\n[bootstrap] Linking packages with self...");
execSync(`pnpm link-packages-with-self`, execOpts);

console.info("\n\n[bootstrap] Generating packages graph...");
execSync(`pnpm generate-packages-graph`, execOpts);

console.info("\n\n[bootstrap] Generating build-env report...");
execSync(`pnpm generate-build-env-report ${pnpmFilter}`, execOpts);

console.info("\n\n[bootstrap] Checking CLI tools...");
execSync(`pnpm check-cli-tools`, execOpts);

console.info("\n\n[bootstrap] Done.");
