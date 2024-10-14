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
import { useMemo } from "react";
import { WrenchIcon } from "@patternfly/react-icons/dist/js/icons/wrench-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import "./NodeMorphingPanel.css";

export function NodeMorphingPanel<
  X extends { id: string; key: string; title: string; action: () => void; icon: React.ReactElement },
>({
  isToggleVisible,
  isExpanded,
  setExpanded,
  actions,
  selectedActionId,
  primaryColor,
  secondaryColor,
  disabledActionIds,
}: {
  isToggleVisible: boolean;
  isExpanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  primaryColor: string;
  secondaryColor: string;
  disabledActionIds: Set<string>;
  actions: X[];
  selectedActionId: X["id"];
}) {
  const buttonStyle = useMemo(
    () => ({ background: secondaryColor, color: primaryColor }),
    [primaryColor, secondaryColor]
  );

  const badgeStyle = useMemo(() => ({ background: primaryColor }), [primaryColor]);

  const toggle = React.useCallback(() => {
    setExpanded((s) => !s);
  }, [setExpanded]);

  return (
    <>
      {isToggleVisible && (
        <>
          <div className={`kie-bpmn-editor--node-morphing-panel-toggle`}>
            <div className={`${isExpanded ? "expanded" : ""}`} onClick={toggle}>
              <>{isExpanded ? <TimesIcon /> : <WrenchIcon />}</>
            </div>
          </div>
        </>
      )}
      {isToggleVisible && isExpanded && (
        <div className={"kie-bpmn-editor--node-morphing-panel"}>
          <div>
            {actions.map(({ id, key, action, icon, title }) => {
              const disabled = disabledActionIds.has(id) || selectedActionId === id;
              return (
                <button
                  key={id}
                  value={key}
                  onClick={action}
                  disabled={disabled}
                  title={title}
                  style={buttonStyle}
                  className={selectedActionId === id ? "selected" : ""}
                >
                  {icon}
                  {!disabled && <div style={badgeStyle}>{key}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
