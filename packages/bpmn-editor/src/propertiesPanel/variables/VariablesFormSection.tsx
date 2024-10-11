import * as React from "react";
import { Variables, WithVariables } from "./Variables";
import { SectionHeader } from "@kie-tools/xyflow-react-kie-diagram/dist/propertiesPanel/SectionHeader";
import { FormSection } from "@patternfly/react-core/dist/js/components/Form";
import { DomainIcon } from "@patternfly/react-icons/dist/js/icons/domain-icon";
import { useState } from "react";

export function VariablesFormSection({ p }: { p: undefined | WithVariables }) {
  const [isVariablesSectionExpanded, setVariablesSectionExpanded] = useState<boolean>(true);

  const variablesCount = p?.property?.length ?? 0;

  return (
    <>
      <FormSection
        title={
          <SectionHeader
            expands={true}
            isSectionExpanded={isVariablesSectionExpanded}
            toogleSectionExpanded={() => setVariablesSectionExpanded((prev) => !prev)}
            icon={<DomainIcon width={16} height={36} style={{ marginLeft: "12px" }} />}
            title={"Variables" + (variablesCount > 0 ? ` (${variablesCount})` : "")}
          />
        }
      >
        {isVariablesSectionExpanded && (
          <>
            <FormSection style={{ paddingLeft: "20px", marginTop: "20px", gap: 0 }}>
              <Variables p={p} />
            </FormSection>
          </>
        )}
      </FormSection>
    </>
  );
}
