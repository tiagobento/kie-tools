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

import type { Meta, StoryObj } from "@storybook/react";
import { getMarshaller } from "@kie-tools/bpmn-marshaller";
import { ns as bpmn20ns } from "@kie-tools/bpmn-marshaller/dist/schemas/bpmn-2_0/ts-gen/meta";
import { generateUuid } from "@kie-tools/boxed-expression-component/dist/api";
import { BpmnEditorWrapper, StorybookBpmnEditorProps } from "../../bpmnEditorStoriesWrapper";
import { BpmnEditor, BpmnEditorProps } from "../../../src/BpmnEditor";

export const generateEmptyBpmn20 = () => `<?xml version="1.0" encoding="UTF-8" ?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" targetNamespace="https://kie.apache.org/bpmn/_E66382E3-2E9C-49B6-BB33-2BA4027BE5A2" expressionLanguage="" id="_B1C67778-EAC0-4A5C-A7AC-477E546E6AA1" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" xmlns:drools="http://www.jboss.org/drools">
  <process id="_CA4A698F-C381-4505-B935-56486319F064">
    <startEvent id="_1DABC1C9-AFAA-47A2-8224-E41BBFD2443E" name="testing">
      <linkEventDefinition id="_A97B2A15-5237-49F7-9557-BBC9CF14FD5B" />
    </startEvent>
  </process>
  <bpmndi:BPMNDiagram id="_300EA56D-5755-49A2-9DBF-40A1D5E7CE71">
    <bpmndi:BPMNPlane id="_C30990BF-D627-4ED0-8277-DB099135971E">
      <bpmndi:BPMNShape id="_54066ADC-4B13-4813-AB30-3DB1A7A25798" bpmnElement="_1DABC1C9-AFAA-47A2-8224-E41BBFD2443E">
        <dc:Bounds x="600" y="237" width="60" height="60" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>
`;

const meta: Meta<BpmnEditorProps> = {
  title: "Misc/Empty",
  component: BpmnEditor,
  includeStories: /^[A-Z]/,
};

export default meta;
type Story = StoryObj<StorybookBpmnEditorProps>;

const marshaller = getMarshaller(generateEmptyBpmn20(), { upgradeTo: "latest" });
const model = marshaller.parser.parse();

export const Empty: Story = {
  render: (args) => BpmnEditorWrapper(),
  args: {
    model: model,
    originalVersion: "2.0",
    externalContextDescription: "",
    externalContextName: "Storybook - BPMN Editor",
    issueTrackerHref: "",
    xml: marshaller.builder.build(model),
  },
};
