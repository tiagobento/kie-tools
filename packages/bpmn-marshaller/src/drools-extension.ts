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

import { Namespaced, mergeMetas } from "@kie-tools/xml-parser-ts";

import { meta as bpmn20meta, ns as bpmn20ns } from "./schemas/bpmn-2_0/ts-gen/meta";
import "./schemas/bpmn-2_0/ts-gen/types";

import { meta as drools10meta, ns as drools10ns } from "./schemas/drools-1_0/ts-gen/meta";
import {
  drools__GLOBAL__global,
  drools__GLOBAL__import,
  drools__GLOBAL__metaData,
  drools__GLOBAL__onEntry_script,
  drools__GLOBAL__onExit_script,
} from "./schemas/drools-1_0/ts-gen/types";

export const DROOLS_NS__PRE_GWT_REMOVAL = "http://www.jboss.org/drools";
export const DROOLS_NS = "drools:";
export type DROOLS = "drools";

export { Namespaced };

///////////////////////////
///       BPMN 2.0      ///
///////////////////////////

declare module "./schemas/bpmn-2_0/ts-gen/types" {
  export interface BPMN20__tProcess {
    "@_drools:packageName"?: Namespaced<DROOLS, string>;
    "@_drools:version"?: Namespaced<DROOLS, string>;
    "@_drools:adHoc"?: Namespaced<DROOLS, string>;
    "drools:metaData"?: Namespaced<DROOLS, drools__GLOBAL__metaData>[];
  }

  export interface BPMN20__tProcess__extensionElements {
    "drools:import"?: Namespaced<DROOLS, drools__GLOBAL__import>[];
    "drools:global"?: Namespaced<DROOLS, drools__GLOBAL__global>[];
  }

  export interface BPMN20__tBusinessRuleTask {
    "@_drools:ruleFlowGroup"?: Namespaced<DROOLS, string>;
  }

  type AllNodesExtensionElements = {
    "drools:metaData"?: Namespaced<DROOLS, drools__GLOBAL__metaData>[];
    "drools:onEntry-script"?: Namespaced<DROOLS, drools__GLOBAL__onEntry_script>;
    "drools:onExit-script"?: Namespaced<DROOLS, drools__GLOBAL__onExit_script>;
  };

  // *************************************************** NOTE ******************************************************
  //
  //  Some sequenceFlow elements are commented on purpose. They're here for completeness, but they're not currently
  //                   relevant by this BPMN marshaller, since none of those are executable.
  //
  // ***************************************************************************************************************

  export interface BPMN20__tAdHocSubProcess__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tBoundaryEvent__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tBusinessRuleTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tCallActivity__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tCallChoreography__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tChoreographyTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tComplexGateway__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tDataObject__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tDataObjectReference__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tDataStoreReference__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tEndEvent__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tEvent__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tEventBasedGateway__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tExclusiveGateway__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tImplicitThrowEvent__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tInclusiveGateway__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tIntermediateCatchEvent__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tIntermediateThrowEvent__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tManualTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tParallelGateway__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tReceiveTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tScriptTask__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tSendTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tSequenceFlow__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tServiceTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tStartEvent__extensionElements extends AllNodesExtensionElements {}
  // export interface BPMN20__tSubChoreography__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tSubProcess__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tTransaction__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tUserTask__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tAssociation__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tGroup__extensionElements extends AllNodesExtensionElements {}
  export interface BPMN20__tTextAnnotation__extensionElements extends AllNodesExtensionElements {}
}

bpmn20ns.set(DROOLS_NS, drools10ns.get("")!);
bpmn20ns.set(drools10ns.get("")!, DROOLS_NS);

mergeMetas(bpmn20meta, [[DROOLS_NS, drools10meta]]);

// Process attrs
(bpmn20meta["BPMN20__tProcess"] as any)["@_drools:packageName"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tProcess",
};
(bpmn20meta["BPMN20__tProcess"] as any)["@_drools:version"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tProcess",
};
(bpmn20meta["BPMN20__tProcess"] as any)["@_drools:adHoc"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tProcess",
};

// Process elements
(bpmn20meta["BPMN20__tProcess__extensionElements"] as any)["drools:import"] = {
  type: "drools__GLOBAL__import",
  isArray: true,
  xsdType: "// local type",
  fromType: "BPMN20__tProcess__extensionElements",
};
(bpmn20meta["BPMN20__tProcess__extensionElements"] as any)["drools:global"] = {
  type: "drools__GLOBAL__global",
  isArray: true,
  xsdType: "// local type",
  fromType: "BPMN20__tProcess__extensionElements",
};

// Business Rule Task attrs
(bpmn20meta["BPMN20__tBusinessRuleTask"] as any)["@_drools:ruleFlowGroup"] = {
  type: "string",
  isArray: false,
  xsdType: "xsd:string",
  fromType: "BPMN20__tBusinessRuleTask",
};

// All nodes
const assignAllNodesExtensionElementsMeta = (type: keyof typeof bpmn20meta) => {
  (bpmn20meta[type] as any)["drools:metaData"] = {
    type: "drools__GLOBAL__metaData",
    isArray: true,
    xsdType: "// local type",
    fromType: type,
  };
  (bpmn20meta[type] as any)["drools:onEntry-script"] = {
    type: "drools__GLOBAL__onEntry_script",
    isArray: false,
    xsdType: "// local type",
    fromType: type,
  };
  (bpmn20meta[type] as any)["drools:onExit-script"] = {
    type: "drools__GLOBAL__onExit_script",
    isArray: false,
    xsdType: "// local type",
    fromType: type,
  };
};

//
// See some of those are commented above.
//
assignAllNodesExtensionElementsMeta("BPMN20__tAdHocSubProcess__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tBoundaryEvent__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tBusinessRuleTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tCallActivity__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tCallChoreography__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tChoreographyTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tComplexGateway__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tDataObject__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tDataObjectReference__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tDataStoreReference__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tEndEvent__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tEvent__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tEventBasedGateway__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tExclusiveGateway__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tImplicitThrowEvent__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tInclusiveGateway__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tIntermediateCatchEvent__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tIntermediateThrowEvent__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tManualTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tParallelGateway__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tReceiveTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tScriptTask__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tSendTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tSequenceFlow__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tServiceTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tStartEvent__extensionElements");
// assignAllNodesExtensionElementsMeta("BPMN20__tSubChoreography__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tSubProcess__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tTransaction__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tUserTask__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tAssociation__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tGroup__extensionElements");
assignAllNodesExtensionElementsMeta("BPMN20__tTextAnnotation__extensionElements");
