/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
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
import * as React from "react";
import { Button, EmptyState, EmptyStateBody, EmptyStateIcon, EmptyStateVariant, Title } from "@patternfly/react-core";
import { SignOutAltIcon } from "@patternfly/react-icons";

interface EmptyStateNoOutputProps {
  onAddOutputField: () => void;
}

export const EmptyStateNoOutput = (props: EmptyStateNoOutputProps) => (
  <EmptyState data-testid="empty-state-no-output" variant={EmptyStateVariant.small}>
    <EmptyStateIcon icon={SignOutAltIcon} />
    <Title headingLevel="h4" size="lg" data-ouia-component-id="no-outputs-title">
      No Outputs have been defined for this model.
    </Title>
    <EmptyStateBody>
      PMML uses Output elements to describe a set of result values that can be returned from a model.
    </EmptyStateBody>
    <Button data-testid="empty-state-no-output__add-model" variant="primary" onClick={props.onAddOutputField}>
      Add Output
    </Button>
  </EmptyState>
);
