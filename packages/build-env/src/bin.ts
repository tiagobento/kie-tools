/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "fs";
import * as path from "path";

import { EnvAndVarsWithName, getOrDefault } from "./index";

const BUILD_ENV_RECURSION_STOP_FILE_NAME = ".build-env-root";

const logs = {
  envNotFound: (envPath: string) => {
    return `[build-env] env not found at '${envPath}'`;
  },
  envFound: (envPath: string) => {
    return `[build-env] found env at '${envPath}'`;
  },
  envLoadingError: (envPath: string) => {
    return `[build-env] error loading env at '${envPath}'`;
  },
  envRecursionStopped: (startDir: string, curDir: string, envRecursionStopPath: string) => {
    return `[build-env] Couldn't load env from '${startDir}' to '${curDir}'. Stopped at '${envRecursionStopPath}'`;
  },
  cantNegateNonBoolean(envPropertyValue: string) {
    return `[build-env] Cannot negate non-boolean value '${envPropertyValue}'`;
  },
  pleaseProvideEnvPropertyPath() {
    return `[build-env] Please provide an env property path.`;
  },
  seeAllEnvProperties() {
    return `[build-env] See all env properties with 'build-env --print-env'`;
  },
  propertyNotFound(propertyPath: string) {
    return `[build-env] Env property '${propertyPath}' not found.`;
  },
};

async function requireEnv(curDir: string): Promise<EnvAndVarsWithName<any> | undefined> {
  const envPath = path.resolve(curDir, "env", "index.js");

  if (!fs.existsSync(envPath)) {
    // console.debug(logs.envNotFound(envPath));
    return undefined;
  }

  // console.debug(logs.envFound(envPath));

  try {
    return (await import(envPath)) as EnvAndVarsWithName<any>;
  } catch (e) {
    console.info(logs.envLoadingError(envPath));
    throw e;
  }
}

async function findEnv(startDir: string, curDir: string): Promise<EnvAndVarsWithName<any>> {
  const env = await requireEnv(curDir);
  if (env) {
    return env;
  }

  const envRecursionStopPath = path.resolve(curDir, BUILD_ENV_RECURSION_STOP_FILE_NAME);
  if (fs.existsSync(envRecursionStopPath)) {
    console.info(logs.envRecursionStopped(startDir, curDir, envRecursionStopPath));
    process.exit(1);
  }

  return findEnv(startDir, path.dirname(curDir));
}

//

async function main() {
  const { env, vars } = await findEnv(path.resolve("."), path.resolve("."));

  const opt = process.argv[2];
  const flags = process.argv[3];

  if (opt === "--print-vars") {
    const result: Record<string, string | undefined> = {};

    for (const v in vars) {
      result[v] = getOrDefault(vars[v]);
      if (vars[v].default === undefined && result[v]) {
        result[v] += " <- CHANGED 👀️ ";
      } else if (result[v] === undefined) {
        result[v] = "[unset] Default value may vary ⚠️ ";
      } else if (result[v] !== vars[v].default) {
        result[v] += " <- CHANGED 👀️ ";
      }
    }

    console.log(JSON.stringify(flattenObj(result), undefined, 2));
    process.exit(0);
  }

  if (opt === "--print-env") {
    console.log(JSON.stringify(flattenObj(env), undefined, 2));
    process.exit(0);
  }

  const propertyPath = opt;
  if (!propertyPath) {
    console.error(logs.pleaseProvideEnvPropertyPath());
    console.error(logs.seeAllEnvProperties());
    process.exit(1);
  }

  let envPropertyValue: any = env;
  for (const p of propertyPath.split(".")) {
    envPropertyValue = envPropertyValue[p];
    if (envPropertyValue === undefined || typeof envPropertyValue === "function") {
      console.error(logs.propertyNotFound(propertyPath));
      console.error(logs.seeAllEnvProperties());
      process.exit(1);
    }
  }

  if (flags === "--not") {
    const isBoolean = `${envPropertyValue}` === "true" || `${envPropertyValue}` === "false";
    if (isBoolean) {
      console.log(!(`${envPropertyValue}` === "true"));
      process.exit(0);
    } else {
      console.error(logs.cantNegateNonBoolean(envPropertyValue));
      process.exit(0);
    }
  }

  console.log(envPropertyValue);
}

function flattenObj(obj: any, parent: any = undefined, res: any = {}): any {
  for (const key in obj) {
    const propName = parent ? parent + "." + key : key;
    if (typeof obj[key] == "object") {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

main();
