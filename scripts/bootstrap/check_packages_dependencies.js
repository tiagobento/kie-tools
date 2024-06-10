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

const fs = require("fs");

const findWorkspacePackages = require("@pnpm/find-workspace-packages").default;

async function main() {
  const packages = await findWorkspacePackages(".");
  const packagesByName = new Map(
    packages.map((p) => [
      p.manifest.name,
      {
        private: p.manifest.private,
        dependencies: Object.keys(p.manifest.dependencies ?? {}).sort(),
      },
    ])
  );

  const invalidDependencies = Array.from(packagesByName.entries())
    .filter(([pkgName, pkg]) => !pkg.private)
    .flatMap(([pkgName, pkg]) =>
      pkg.dependencies.filter((dep) => packagesByName.get(dep)?.private).map((dep) => [pkgName, dep])
    );

  if (invalidDependencies.length > 0) {
    console.error(`[check-packages-dependencies] There are public packages depending on private packages:`);
    invalidDependencies.forEach(([pkgName, dep]) => {
      console.error(`[check-packages-dependencies] ${pkgName} -> ${dep}`);
    });
    process.exit(1);
  }

  console.info(`[check-packages-dependencies] Done.`);
  console.info(`[check-packages-scripts] Checking package script names...`);

  const turboTasksForPackages = [
    ...Object.keys(require("../../turbo.json").tasks).filter((s) => !s.startsWith("//")),
    "install",
  ];

  const scriptNameErrors = new Map();

  for (const p of packages) {
    if (p.dir === ".") {
      continue; // Ignore the root package.json
    }

    for (const scriptName in p.manifest.scripts) {
      const split = scriptName.split("~:");
      // Does have ~:
      if (split.length === 1) {
        if (turboTasksForPackages.some((t) => t === scriptName)) {
          // OK. Conventionalized script name from Turbo.
        } else {
          // ERROR. Non-conventionalized script without ~: prefix.
          const error = "Non-conventionalized script name without ~: prefix";
          scriptNameErrors.set(error, [...(scriptNameErrors.get(error) ?? []), `${p.dir}#${scriptName}`]);
        }
      }
      // Does not have ~:
      else if (split.length === 2) {
        if (split[0] !== "") {
          // ERROR. Invalid script name.
          const error = "Invalid location of ~: marker on script name";
          scriptNameErrors.set(error, [...(scriptNameErrors.get(error) ?? []), `${p.dir}#${scriptName}`]);
        } else if (turboTasksForPackages.some((t) => t === split[1])) {
          // ERROR. Conventionalized script name from Turbo prefixed with ~:
          const error = "Conventionalized script name prefixed with ~:";
          scriptNameErrors.set(error, [...(scriptNameErrors.get(error) ?? []), `${p.dir}#${scriptName}`]);
        } else {
          // OK. Arbitrary script with ~: prefix.
        }
      }
    }
  }

  if (scriptNameErrors.size > 0) {
    console.error(`[check-packages-scripts] Errors:`);
    console.error(JSON.stringify(Object.fromEntries(scriptNameErrors), null, 2));
    console.error(`[check-packages-scripts] Done.`);
    // process.exit(1);
  } else {
    console.error(`[check-packages-scripts] Done.`);
    process.exit(0);
  }
}

main();
