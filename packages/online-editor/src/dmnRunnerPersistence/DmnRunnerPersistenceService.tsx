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

import { InputRow } from "@kie-tools/form-dmn";
import { CompanionFsService } from "../companionFs/CompanionFsService";
import { v4 as uuid } from "uuid";

export const generateUuid = () => {
  return `_${uuid()}`.toLocaleUpperCase();
};

interface DmnRunnerPersistenceJsonConfig {
  width: number;
}

// Can't use Record<string, DmnRunnerConfig | ConfigInputRow>;
type ConfigInputRow = { [x: string]: DmnRunnerPersistenceJsonConfig | ConfigInputRow };

export enum DmnRunnerMode {
  FORM = "form",
  TABLE = "table",
}

interface DmnRunnerPersistenceJsonConfigs {
  mode: DmnRunnerMode;
  inputs: Array<ConfigInputRow>;
}

export interface DmnRunnerPersistenceJson {
  configs: DmnRunnerPersistenceJsonConfigs;
  inputs: Array<InputRow>;
}

export const EMPTY_DMN_RUNNER_PERSISTANCE_JSON = {} as DmnRunnerPersistenceJson;

// different reference for each one
export const EMPTY_DMN_RUNNER_INPUTS_CONFIG = [{}];
export const EMPTY_DMN_RUNNER_INPUTS = [{}];

export const DEFAULT_DMN_RUNNER_PERSISTENCE_JSON: DmnRunnerPersistenceJson = {
  configs: {
    mode: DmnRunnerMode.FORM,
    inputs: EMPTY_DMN_RUNNER_INPUTS_CONFIG,
  },
  inputs: EMPTY_DMN_RUNNER_INPUTS,
};

export class DmnRunnerPersistenceService {
  public readonly companionFsService = new CompanionFsService({
    storeNameSuffix: "dmn_runner_data",
    emptyFileContent: JSON.stringify(EMPTY_DMN_RUNNER_PERSISTANCE_JSON),
  });

  public parseDmnRunnerPersistenceJson(inputs: string): DmnRunnerPersistenceJson {
    const parsedDmnRunnerPersistenceJsobn = JSON.parse(inputs) as DmnRunnerPersistenceJson;
    if (Object.prototype.toString.call(parsedDmnRunnerPersistenceJsobn) === "[object Object]") {
      parsedDmnRunnerPersistenceJsobn.inputs = parsedDmnRunnerPersistenceJsobn.inputs.map((e) => (e === null ? {} : e));
      return parsedDmnRunnerPersistenceJsobn;
    }
    return EMPTY_DMN_RUNNER_PERSISTANCE_JSON;
  }
}
