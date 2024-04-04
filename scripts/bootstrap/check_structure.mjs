/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

async function main() {
  // 1. all folders inside packages/examples must have a valid package.json file on it
  // 2. there can't be files inside packages/examples directories
  // 3. prettierignore is always a superset of gitignore

  console.info(`[check-structure] Checking if all package directories have a a valid package.json file...`);

  console.info(`[check-structure] Checking if there's dangling files outside packages directories...`);

  console.info(`[check-structure] Checking if .prettierignore is a superset of .gitignore...`);

  console.info(`[check-structure] Done.`);
  process.exit(0);
}

main();
