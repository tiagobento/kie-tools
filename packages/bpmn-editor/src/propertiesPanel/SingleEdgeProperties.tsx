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

import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { Form, FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { Flex } from "@patternfly/react-core/dist/js/layouts/Flex";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useBpmnEditorStore, useBpmnEditorStoreApi } from "../store/StoreContext";
import { SectionHeader } from "./SectionHeader";

export function SingleEdgeProperties() {
  const [isSectionExpanded, setSectionExpanded] = React.useState<boolean>(true);

  const bpmnEditorStoreApi = useBpmnEditorStoreApi();

  const size = useBpmnEditorStore((s) => s.computed(s).getDiagramData().selectedEdgesById.size);

  return (
    <>
      <Form>
        <FormSection>
          <SectionHeader
            fixed={true}
            isSectionExpanded={isSectionExpanded}
            toogleSectionExpanded={() => setSectionExpanded((prev) => !prev)}
            title={
              <Flex justifyContent={{ default: "justifyContentCenter" }}>
                <TextContent>
                  {/* FIXME: Tiago -> Display the node name and its icon. */}
                  <Text component={TextVariants.h4}>Edge</Text>
                </TextContent>
              </Flex>
            }
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
        <FormSection>... // TODO</FormSection>
      </Form>
    </>
  );
}
