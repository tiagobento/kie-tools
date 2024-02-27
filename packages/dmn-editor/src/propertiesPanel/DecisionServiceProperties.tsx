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

import * as React from "react";
import {
  DMN15__tDecision,
  DMN15__tDecisionService,
  DMN15__tInputData,
} from "@kie-tools/dmn-marshaller/dist/schemas/dmn-1_5/ts-gen/types";
import { ClipboardCopy } from "@patternfly/react-core/dist/js/components/ClipboardCopy";
import { FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { TextArea } from "@patternfly/react-core/dist/js/components/TextArea";
import { DocumentationLinksFormGroup } from "./DocumentationLinksFormGroup";
import { TypeRefSelector } from "../dataTypes/TypeRefSelector";
import { useDmnEditorStore, useDmnEditorStoreApi } from "../store/StoreContext";
import { useCallback, useMemo } from "react";
import { buildXmlHref, parseXmlHref } from "../xml/xmlHrefs";
import { DmnObjectListItem } from "../externalNodes/DmnObjectListItem";
import { renameDrgElement } from "../mutations/renameNode";
import { InlineFeelNameInput } from "../feel/InlineFeelNameInput";
import { Divider } from "@patternfly/react-core/dist/js/components/Divider";
import { useDmnEditor } from "../DmnEditorContext";
import { useResolvedTypeRef } from "../dataTypes/useResolvedTypeRef";
import { useExternalModels } from "../includedModels/DmnEditorDependenciesContext";

export type AllKnownDrgElementsByHref = Map<
  string,
  ({ __$$element: "decision" } & DMN15__tDecision) | ({ __$$element: "inputData" } & DMN15__tInputData)
>;

export function DecisionServiceProperties({
  decisionService,
  namespace,
  index,
}: {
  decisionService: DMN15__tDecisionService;
  namespace: string;
  index: number;
}) {
  const { setState } = useDmnEditorStoreApi();

  const thisDmn = useDmnEditorStore((s) => s.dmn);
  const { externalModelsByNamespace } = useExternalModels();
  const externalDmnsByNamespace = useDmnEditorStore(
    (s) => s.computed(s).getExternalModelTypesByNamespace(externalModelsByNamespace).dmns
  );

  const allDrgElementsByHref = useMemo(() => {
    const ret: AllKnownDrgElementsByHref = new Map();

    const allDmns = [{ model: thisDmn.model }, ...externalDmnsByNamespace.values()];

    for (let i = 0; i < allDmns.length; i++) {
      const someDmn = allDmns[i]!;

      const namespace = someDmn.model.definitions["@_namespace"];

      const drgElements = someDmn.model.definitions.drgElement ?? [];
      for (let i = 0; i < drgElements.length; i++) {
        const element = drgElements[i];
        if (element.__$$element === "decision" || element.__$$element === "inputData") {
          ret.set(
            buildXmlHref({
              id: element["@_id"]!,
              namespace,
              relativeToNamespace: thisDmn.model.definitions["@_namespace"],
            }),
            element
          );
        }
      }
    }

    return ret;
  }, [externalDmnsByNamespace, thisDmn]);

  const thisDmnsNamespace = useDmnEditorStore((s) => s.dmn.model.definitions["@_namespace"]);

  const isReadonly = namespace !== thisDmnsNamespace;

  const { dmnEditorRootElementRef } = useDmnEditor();

  const resolvedTypeRef = useResolvedTypeRef(decisionService.variable?.["@_typeRef"], namespace);

  return (
    <>
      <FormGroup label="Name">
        <InlineFeelNameInput
          enableAutoFocusing={false}
          isPlain={false}
          id={decisionService["@_id"]!}
          name={decisionService["@_name"]}
          isReadonly={isReadonly}
          shouldCommitOnBlur={true}
          className={"pf-c-form-control"}
          onRenamed={(newName) => {
            setState((state) => {
              renameDrgElement({
                definitions: state.dmn.model.definitions,
                index,
                newName,
              });
            });
          }}
          allUniqueNames={useCallback((s) => s.computed(s).getAllFeelVariableUniqueNames(), [])}
        />
      </FormGroup>

      <FormGroup label="Data type">
        <TypeRefSelector
          heightRef={dmnEditorRootElementRef}
          typeRef={resolvedTypeRef}
          onChange={(newTypeRef) => {
            setState((state) => {
              const drgElement = state.dmn.model.definitions.drgElement![index] as DMN15__tDecisionService;
              drgElement.variable ??= { "@_name": decisionService["@_name"] };
              drgElement.variable["@_typeRef"] = newTypeRef;
            });
          }}
        />
      </FormGroup>

      <FormGroup label="Description">
        <TextArea
          aria-label={"Description"}
          type={"text"}
          isDisabled={isReadonly}
          value={decisionService.description?.__$$text}
          onChange={(newDescription) => {
            setState((state) => {
              (state.dmn.model.definitions.drgElement![index] as DMN15__tDecisionService).description = {
                __$$text: newDescription,
              };
            });
          }}
          placeholder={"Enter a description..."}
          style={{ resize: "vertical", minHeight: "40px" }}
          rows={6}
        />
      </FormGroup>

      <FormGroup label="ID">
        <ClipboardCopy isReadOnly={true} hoverTip="Copy" clickTip="Copied">
          {decisionService["@_id"]}
        </ClipboardCopy>
      </FormGroup>

      <FormGroup label="Output decisions">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.outputDecision}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>
      <FormGroup label="Encapsulated decisions">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.encapsulatedDecision}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>

      <Divider />

      <FormGroup label="Input data">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.inputData}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>
      <FormGroup label="Input decisions">
        <DecisionServiceElementList
          decisionServiceNamespace={namespace}
          elements={decisionService.inputDecision}
          allDrgElementsByHref={allDrgElementsByHref}
        />
      </FormGroup>

      <DocumentationLinksFormGroup
        isReadonly={isReadonly}
        values={decisionService.extensionElements?.["kie:attachment"]}
        onChange={(newExtensionElements) => {
          setState((state) => {
            (state.dmn.model.definitions.drgElement![index] as DMN15__tDecisionService).extensionElements = {
              "kie:attachment": newExtensionElements,
            };
          });
        }}
      />
    </>
  );
}

export function DecisionServiceElementList({
  decisionServiceNamespace,
  elements,
  allDrgElementsByHref,
}: {
  decisionServiceNamespace: string;
  elements: DMN15__tDecisionService["outputDecision"];
  allDrgElementsByHref: AllKnownDrgElementsByHref;
}) {
  const thisDmnsNamespace = useDmnEditorStore((s) => s.dmn.model.definitions["@_namespace"]);

  return (
    <ul>
      {(elements ?? []).length <= 0 && (
        <li>
          <small>
            <i>(Empty)</i>
          </small>
        </li>
      )}
      {(elements ?? []).map((e) => {
        const potentialExternalHref = buildXmlHref({
          ...parseXmlHref({ href: e["@_href"], relativeToNamespace: decisionServiceNamespace }),
          relativeToNamespace: thisDmnsNamespace,
        });

        return (
          <li key={potentialExternalHref}>
            <DmnObjectListItem
              dmnObjectHref={potentialExternalHref}
              dmnObject={allDrgElementsByHref.get(potentialExternalHref)}
              relativeToNamespace={thisDmnsNamespace}
              dmnObjectNamespace={decisionServiceNamespace}
            />
          </li>
        );
      })}
    </ul>
  );
}
