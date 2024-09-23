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

import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { Form, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useMemo } from "react";
import * as RF from "reactflow";
import { BpmnDiagramNodeData, BpmnNodeType } from "../diagram/BpmnDiagramDomain";
import {
  CallActivityIcon,
  DataObjectIcon,
  EndEventIcon,
  GatewayIcon,
  GroupIcon,
  IntermediateCatchEventIcon,
  IntermediateThrowEventIcon,
  LaneIcon,
  StartEventIcon,
  SubProcessIcon,
  TaskIcon,
  TextAnnotationIcon,
  UnknownNodeIcon,
} from "../diagram/nodes/NodeIcons";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { assertUnreachable } from "../ts-ext/assertUnreachable";
import { AdHocSubProcessProperties } from "./singleNodeProperties/AdHocSubProcessProperties";
import { BoundaryEventProperties } from "./singleNodeProperties/BoundaryEventProperties";
import { BusinessRuleTaskProperties } from "./singleNodeProperties/BusinessRuleTaskProperties";
import { CallActivityProperties } from "./singleNodeProperties/CallActivityProperties";
import { ComplexGatewayProperties } from "./singleNodeProperties/ComplexGatewayProperties";
import { DataObjectProperties } from "./singleNodeProperties/DataObjectProperties";
import { EndEventProperties } from "./singleNodeProperties/EndEventProperties";
import { EventBasedGatewayProperties } from "./singleNodeProperties/EventBasedGatewayProperties";
import { EventSubProcessProperties } from "./singleNodeProperties/EventSubProcessProperties";
import { ExclusiveGatewayProperties } from "./singleNodeProperties/ExclusiveGatewayProperties";
import { GroupProperties } from "./singleNodeProperties/GroupProperties";
import { InclusiveGatewayProperties } from "./singleNodeProperties/InclusiveGatewayProperties";
import { IntermediateCatchEventProperties } from "./singleNodeProperties/IntermediateCatchEventProperties";
import { IntermediateThrowEventProperties } from "./singleNodeProperties/IntermediateThrowEventProperties";
import { LaneProperties } from "./singleNodeProperties/LaneProperties";
import { ParallelGatewayProperties } from "./singleNodeProperties/ParallelGatewayProperties";
import { ScriptTaskProperties } from "./singleNodeProperties/ScriptTaskProperties";
import { ServiceTaskProperties } from "./singleNodeProperties/ServiceTaskProperties";
import { StartEventProperties } from "./singleNodeProperties/StartEventProperties";
import { SubProcessProperties } from "./singleNodeProperties/SubProcessProperties";
import { TaskProperties } from "./singleNodeProperties/TaskProperties";
import { TextAnnotationProperties } from "./singleNodeProperties/TextAnnotationProperties";
import { TransactionProperties } from "./singleNodeProperties/TransactionProperties";
import { UserTaskProperties } from "./singleNodeProperties/UserTaskProperties";

export function SingleNodeProperties() {
  const [isSectionExpanded, setSectionExpanded] = React.useState<boolean>(true);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const selectedNode = useBpmnEditorStore(
    (s) =>
      [...s.computed(s).getDiagramData().selectedNodesById.values()][0] as
        | undefined
        | RF.Node<BpmnDiagramNodeData, BpmnNodeType>
  );

  const { properties, title, icon } = useMemo(() => {
    const bpmnElement = selectedNode?.data.bpmnElement;
    const e = bpmnElement?.__$$element;
    switch (e) {
      // Events
      case "startEvent":
        return {
          properties: <StartEventProperties startEvent={bpmnElement!} />,
          title: "Start Event",
          icon: <StartEventIcon variant={bpmnElement?.eventDefinition?.[0].__$$element} />,
        };
      case "endEvent":
        return {
          properties: <EndEventProperties endEvent={bpmnElement!} />,
          title: "End Event",
          icon: <EndEventIcon variant={bpmnElement?.eventDefinition?.[0].__$$element} />,
        };
      case "intermediateCatchEvent":
        return {
          properties: <IntermediateCatchEventProperties intermediateCatchEvent={bpmnElement!} />,
          title: "Intermediate Catch Event",
          icon: <IntermediateCatchEventIcon variant={bpmnElement?.eventDefinition?.[0].__$$element} />,
        };
      case "intermediateThrowEvent":
        return {
          properties: <IntermediateThrowEventProperties intermediateThrowEvent={bpmnElement!} />,
          title: "Intermediate Throw Event",
          icon: <IntermediateThrowEventIcon variant={bpmnElement?.eventDefinition?.[0].__$$element} />,
        };
      case "boundaryEvent":
        return {
          properties: <BoundaryEventProperties boundaryEvent={bpmnElement!} />,
          title: "Boundary Event",
          icon: <IntermediateCatchEventIcon variant={bpmnElement?.eventDefinition?.[0].__$$element} />,
        };
      // Gateways
      case "complexGateway":
        return {
          properties: <ComplexGatewayProperties complexGateway={bpmnElement!} />,
          title: "Complex Gateway",
          icon: <GatewayIcon variant={e} />,
        };
      case "eventBasedGateway":
        return {
          properties: <EventBasedGatewayProperties eventBasedGateway={bpmnElement!} />,
          title: "Event-based Gateway",
          icon: <GatewayIcon variant={e} />,
        };
      case "exclusiveGateway":
        return {
          properties: <ExclusiveGatewayProperties exclusiveGateway={bpmnElement!} />,
          title: "Exclusive Gateway",
          icon: <GatewayIcon variant={e} />,
        };
      case "inclusiveGateway":
        return {
          properties: <InclusiveGatewayProperties inclusiveGateway={bpmnElement!} />,
          title: "Inclusive Gateway",
          icon: <GatewayIcon variant={e} />,
        };
      case "parallelGateway":
        return {
          properties: <ParallelGatewayProperties parallelGateway={bpmnElement!} />,
          title: "Parallel Gateway",
          icon: <GatewayIcon variant={e} />,
        };
      // Tasks
      case "task":
        return {
          properties: <TaskProperties task={bpmnElement!} />,
          title: "Task",
          icon: <TaskIcon />,
        };
      case "businessRuleTask":
        return {
          properties: <BusinessRuleTaskProperties businessRuleTask={bpmnElement!} />,
          title: "Business Rule Task",
          icon: <TaskIcon variant={e} />,
        };

      case "scriptTask":
        return {
          properties: <ScriptTaskProperties scriptTask={bpmnElement!} />,
          title: "Script Task",
          icon: <TaskIcon variant={e} />,
        };
      case "serviceTask":
        return {
          properties: <ServiceTaskProperties serviceTask={bpmnElement!} />,
          title: "Service Task",
          icon: <TaskIcon variant={e} />,
        };
      case "userTask":
        return {
          properties: <UserTaskProperties userTask={bpmnElement!} />,
          title: "User Task",
          icon: <TaskIcon variant={e} />,
        };
      case "callActivity":
        return {
          properties: <CallActivityProperties callActivity={bpmnElement!} />,
          title: "Call Activity",
          icon: <CallActivityIcon />,
        };
      // Sub-processes
      case "subProcess":
        if (bpmnElement?.["@_triggeredByEvent"]) {
          return {
            properties: <EventSubProcessProperties eventSubProcess={bpmnElement!} />,
            title: "Event Sub-process",
            icon: <SubProcessIcon variant={"event"} />,
          };
        } else {
          return {
            properties: <SubProcessProperties subProcess={bpmnElement!} />,
            title: "Sub-process",
            icon: <SubProcessIcon variant={"other"} />,
          };
        }
      case "adHocSubProcess":
        return {
          properties: <AdHocSubProcessProperties adHocSubProcess={bpmnElement!} />,
          title: "Ad-hoc Sub-process",
          icon: <SubProcessIcon variant={"other"} />,
        };
      case "transaction":
        return {
          properties: <TransactionProperties transaction={bpmnElement!} />,
          title: "Transaction",
          icon: <SubProcessIcon variant={"other"} />,
        };
      // Misc.
      case "dataObject":
        return {
          properties: <DataObjectProperties dataObject={bpmnElement!} />,
          title: "Data Object",
          icon: <DataObjectIcon />,
        };
      case "textAnnotation":
        return {
          properties: <TextAnnotationProperties textAnnotation={bpmnElement!} />,
          title: "Text Annotation",
          icon: <TextAnnotationIcon />,
        };
      case "group":
        return {
          properties: <GroupProperties group={bpmnElement!} />,
          title: "Group",
          icon: <GroupIcon />,
        };
      case "lane":
        return {
          properties: <LaneProperties lane={bpmnElement!} />,
          title: "Lane",
          icon: <LaneIcon />,
        };
      // Unsupported
      //// events
      case "event":
      case "implicitThrowEvent":
      //// data
      case "dataObjectReference":
      case "dataStoreReference":
      //// choreography
      case "manualTask":
      case "sendTask":
      case "receiveTask":
      case "callChoreography":
      case "choreographyTask":
      case "subChoreography":
      // undefined
      case undefined:
        return {
          properties: (
            <>
              <FormSection style={{ textAlign: "center" }}>{"No properties to edit."}</FormSection>
            </>
          ),
          title: "Unsupported",
          icon: <UnknownNodeIcon />,
        };
      default:
        assertUnreachable(e);
    }
  }, [selectedNode?.data.bpmnElement]);

  return (
    <>
      <Form>
        <FormSection>
          <SectionHeader
            fixed={true}
            icon={icon}
            expands={true}
            isSectionExpanded={isSectionExpanded}
            toogleSectionExpanded={() => setSectionExpanded((prev) => !prev)}
            title={title}
            action={
              <Button
                title={"Close"}
                variant={ButtonVariant.plain}
                onClick={() => {
                  bpmnEditorStoreApi.setState((state) => {
                    state.propertiesPanel.isOpen = false;
                  });
                }}
              >
                <TimesIcon />
              </Button>
            }
          />
        </FormSection>
        {properties}
      </Form>
    </>
  );
}
