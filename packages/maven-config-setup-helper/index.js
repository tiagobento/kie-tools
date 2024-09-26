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

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Constants relative to consumer packages.
const MVN_CONFIG_ORIGINAL_FILE_PATH = path.join(".mvn", "maven.config.original");
const MVN_CONFIG_FILE_PATH = path.join(".mvn", "maven.config");

// This package's constants.
const MVNW_VERSION = "3.3.0";
const EMPTY_POM_XML_PATH = path.join(__dirname, "empty-pom.xml");
const BUILD_SETTINGS_XML_PATH = path.join(__dirname, "build-settings.xml");
const BOOTSTRAP_SETTINGS_XML_PATH = path.join(__dirname, "bootstrap-settings.xml");

const DEFAULT_MAVEN_CONFIG = `
-Dstyle.color=always
--batch-mode
--settings=${BUILD_SETTINGS_XML_PATH}
`.trim();

const DEFAULT_LOCAL_REPO = String(
  execSync(`mvn help:evaluate -Dexpression=settings.localRepository -q -DforceStdout -f ${EMPTY_POM_XML_PATH}`, [], {
    stdio: "pipe",
  })
).trim();

const BOOTSTRAP_CLI_ARGS = `-P'!kie-tools--maven-profile--1st-party-dependencies' --settings=${BOOTSTRAP_SETTINGS_XML_PATH}`;

module.exports = {
  /**
   * Evaluation of ${settings.localRepository}.
   */
  DEFAULT_LOCAL_REPO,

  /**
   * Maven CLI arguments to be passed for `mvn` commands running during `bootstrap` phase.
   */
  BOOTSTRAP_CLI_ARGS,

  /**
   * An absolute path for an empty POM, in case someone needs to run `mvn` scripts.
   */
  EMPTY_POM_XML_PATH,

  /**
   * Installs `mvnw` on the same directory of invocation.
   *  */
  installMvnw: () => {
    console.info(`[maven-config-setup-helper] Installing mvnw...`);
    console.time(`[maven-config-setup-helper] Installing mvnw...`);
    execSync(`mvn -e org.apache.maven.plugins:maven-wrapper-plugin:${MVNW_VERSION}:wrapper ${BOOTSTRAP_CLI_ARGS}`, {
      stdio: "inherit",
    });
    console.timeEnd(`[maven-config-setup-helper] Installing mvnw...`);
  },

  /**
   * Builds a single Maven repository directory out of multiple local Maven repositories using hard links.
   *
   * @param tmpM2Dir Relative path of this new Maven repository directory. It will be deleted and recreated for each invocation.
   * @param tail A list of paths representing additional Maven repository directories, to be concatenated the default one (I.e, `maven.repo.local`)
   *  */
  prepareM2FromTail: (tmpM2Dir, tail) => {
    const resolvedTmpM2Dir = path.resolve(tmpM2Dir);
    if (fs.existsSync(resolvedTmpM2Dir)) {
      fs.rmSync(resolvedTmpM2Dir, { recursive: true, force: true });
    }
    fs.mkdirSync(resolvedTmpM2Dir);

    // head
    execSync(`cp -nal ${DEFAULT_LOCAL_REPO}/* ${resolvedTmpM2Dir}`, { stdio: "inherit" });

    // tail
    for (const t of tail) {
      execSync(`cp -nal ${path.resolve(t)}/* ${resolvedTmpM2Dir}`, { stdio: "inherit" });
    }
  },

  /**
   * Sets a property on a POM.
   *
   * @param entry An object with `key` and `value` properties
   */
  setPomProperty: ({ key, value }) => {
    if (!key || !value) {
      console.error("[maven-config-setup-helper] Wrong values provided");
      process.exit(1);
    }

    console.info(`[maven-config-setup-helper] Setting property '${key}' with value '${value}'...`);
    console.time(`[maven-config-setup-helper] Setting property '${key}' with value '${value}'...`);

    const cmd = `mvn versions:set-property -Dproperty=${key} -DnewVersion=${value} -DgenerateBackupPoms=false ${BOOTSTRAP_CLI_ARGS}`;

    if (process.platform === "win32") {
      execSync(cmd.replaceAll(" -", " `-"), { stdio: "inherit", shell: "powershell.exe" });
    } else {
      execSync(cmd, { stdio: "inherit" });
    }

    console.timeEnd(`[maven-config-setup-helper] Setting property '${key}' with value '${value}'...`);
  },

  /**
   * Writes to `.mvn/maven.config` idempotently, preserving what was there before this function was called.
   *
   * @param mavenConfigString New-line-separated string containing arguments to the `mvn` command.
   * @param args An object with a `ignoreDefault: boolean` property.
   */
  setup: (mavenConfigString, args) => {
    console.info(`[maven-config-setup-helper] Configuring Maven through .mvn/maven.config...`);
    console.time(`[maven-config-setup-helper] Configuring Maven through .mvn/maven.config...`);
    let originalMvnConfigString;
    if (fs.existsSync(MVN_CONFIG_ORIGINAL_FILE_PATH)) {
      console.info(`[maven-config-setup-helper] Found '${MVN_CONFIG_ORIGINAL_FILE_PATH}'.`);
      originalMvnConfigString = fs.readFileSync(MVN_CONFIG_ORIGINAL_FILE_PATH, "utf-8");
    } else if (fs.existsSync(MVN_CONFIG_FILE_PATH)) {
      console.info(`[maven-config-setup-helper] Found '${MVN_CONFIG_FILE_PATH}'.`);
      originalMvnConfigString = fs.readFileSync(MVN_CONFIG_FILE_PATH, "utf-8");
    } else {
      console.info(`[maven-config-setup-helper] No previous config found.`);
      originalMvnConfigString = "";
    }

    fs.mkdirSync(".mvn", { recursive: true });

    console.info(`[maven-config-setup-helper] Writing '${MVN_CONFIG_ORIGINAL_FILE_PATH}'...`);
    console.info(`${originalMvnConfigString}` || "<empty>");
    fs.writeFileSync(MVN_CONFIG_ORIGINAL_FILE_PATH, originalMvnConfigString);

    const trimmedMavenConfigString = mavenConfigString
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .join("\n");

    const newMavenConfigString = `### Package-specific configuration${
      originalMvnConfigString ? `\n${originalMvnConfigString}\n` : ``
    }
${trimmedMavenConfigString.trim()}`;

    console.info(`[maven-config-setup-helper] Writing '${MVN_CONFIG_FILE_PATH}'...`);
    console.info(newMavenConfigString);

    const defaultMavenConfigString = args?.ignoreDefault
      ? ""
      : `

#### Default configuration
${DEFAULT_MAVEN_CONFIG}`;

    fs.writeFileSync(MVN_CONFIG_FILE_PATH, `${newMavenConfigString}${defaultMavenConfigString}`);
    console.timeEnd(`[maven-config-setup-helper] Configuring Maven through .mvn/maven.config...`);
  },
};
