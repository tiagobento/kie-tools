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

import { ErrorBoundary } from "@kie-tools/form/dist/ErrorBoundary";
import { Button, ButtonVariant } from "@patternfly/react-core/dist/js/components/Button";
import { EmptyState, EmptyStateBody, EmptyStateIcon } from "@patternfly/react-core/dist/js/components/EmptyState";
import { Text, TextContent } from "@patternfly/react-core/dist/js/components/Text";
import { Tooltip } from "@patternfly/react-core/dist/js/components/Tooltip";
import { ExclamationIcon } from "@patternfly/react-icons/dist/js/icons/exclamation-icon";
import { ListIcon } from "@patternfly/react-icons/dist/js/icons/list-icon";
import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import nextId from "react-id-generator";
import { UnitablesBeeTable } from "./bee";
import { UnitablesI18n } from "./i18n";
import { FORMS_ID, UnitablesJsonSchemaBridge } from "./uniforms";
import { useUnitablesColumns } from "./UnitablesColumns";
import "./Unitables.css";
import { UnitablesRow } from "./UnitablesRow";
import isEqual from "lodash/isEqual";
import set from "lodash/set";
import get from "lodash/get";
import { InputRow } from "@kie-tools/form-dmn";
import { diff } from "deep-object-diff";
import { isObject, mergeDeep } from "./object/mergeDeep";
import cloneDeep from "lodash/cloneDeep";

const EMPTY_UNITABLES_INPUTS = [{}];

interface Props {
  jsonSchema: object;
  rows: object[];
  setRows: (previousStateFunction: (previous: Array<InputRow>) => Array<InputRow>) => void;
  error: boolean;
  setError: React.Dispatch<React.SetStateAction<boolean>>;
  openRow: (rowIndex: number) => void;
  i18n: UnitablesI18n;
  jsonSchemaBridge: UnitablesJsonSchemaBridge;
  propertiesEntryPath: string;
  containerRef: React.RefObject<HTMLDivElement>;
  scrollableParentRef: React.RefObject<HTMLElement>;
  onRowAdded: (args: { beforeIndex: number }) => void;
  onRowDuplicated: (args: { rowIndex: number }) => void;
  onRowReset: (args: { rowIndex: number }) => void;
  onRowDeleted: (args: { rowIndex: number }) => void;
  setWidth: (newWidth: number, columnIndex: number, rowIndex: number) => void;
  autoSaveDelay?: number;
}

// should set the deep key that is going to be changed;
function recursiveCheckForKey(
  rowIndex: number,
  previousInputRows: InputRow,
  newInputRow: InputRow,
  cachedKeysOfRows: Map<number, Set<string>>,
  parentProperty: Record<string, any>,
  parentKey: string
) {
  for (const [key, value] of Object.entries(parentProperty)) {
    const fullKey: string = `${parentKey}.${key}`;
    if (isObject(value)) {
      recursiveCheckForKey(rowIndex, previousInputRows, newInputRow, cachedKeysOfRows, value, fullKey);
    } else {
      const keySet = cachedKeysOfRows.get(rowIndex);
      if (keySet) {
        if (keySet.has(fullKey)) {
          // key shouldnt be updated;
          set(newInputRow, fullKey, get(previousInputRows, fullKey));
        } else {
          keySet.add(fullKey);
        }
      } else {
        cachedKeysOfRows.set(rowIndex, new Set([fullKey]));
      }
    }
  }
}

export const Unitables = ({
  rows,
  setRows,
  setError,
  openRow,
  i18n,
  jsonSchemaBridge,
  propertiesEntryPath,
  containerRef,
  scrollableParentRef,
  onRowAdded,
  onRowDuplicated,
  onRowReset,
  onRowDeleted,
  setWidth,
  autoSaveDelay = 400,
}: Props) => {
  const inputErrorBoundaryRef = useRef<ErrorBoundary>(null);
  const [formsDivRendered, setFormsDivRendered] = useState<boolean>(false);
  const { columns: unitablesColumns } = useUnitablesColumns(jsonSchemaBridge, setRows, propertiesEntryPath);
  const inputUid = useMemo(() => nextId(), []);

  // create cache to save inputs cache;
  const cachedKeysOfRows = useRef<Map<number, Set<string>>>(new Map());

  // Resets the ErrorBoundary everytime the FormSchema is updated
  useEffect(() => {
    inputErrorBoundaryRef.current?.reset();
  }, [jsonSchemaBridge]);

  // Clear cache;
  const timeout = useRef<number | undefined>(undefined);
  const onValidateRow = useCallback(
    (rowInput: InputRow, rowIndex: number) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      timeout.current = window.setTimeout(() => {
        cachedKeysOfRows.current.clear();
      }, 0);

      setRows((previousInputRows) => {
        const newInputRows = cloneDeep(previousInputRows);
        const clonedRowInput = cloneDeep(rowInput);
        const difference: Record<string, any> = diff(rowInput, newInputRows[rowIndex]);

        for (const [key, value] of Object.entries(difference)) {
          if (isObject(value)) {
            recursiveCheckForKey(
              rowIndex,
              newInputRows[rowIndex],
              clonedRowInput,
              cachedKeysOfRows.current,
              value,
              key
            );
          } else {
            const keySet = cachedKeysOfRows.current.get(rowIndex);
            if (keySet) {
              if (keySet.has(key)) {
                // key shouldnt be updated;
                clonedRowInput[key] = get(newInputRows[rowIndex], key);
              } else {
                keySet.add(key);
              }
            } else {
              cachedKeysOfRows.current.set(rowIndex, new Set([key]));
            }
          }
        }

        newInputRows[rowIndex] = clonedRowInput;
        return newInputRows;
      });
    },
    [setRows]
  );

  const rowWrapper = useCallback(
    ({
      children,
      rowIndex,
      row,
    }: React.PropsWithChildren<{
      rowIndex: number;
      row: object;
    }>) => {
      return (
        <UnitablesRow
          key={rowIndex}
          formsId={FORMS_ID}
          rowIndex={rowIndex}
          rowInput={row}
          jsonSchemaBridge={jsonSchemaBridge}
          onValidateRow={onValidateRow}
        >
          {children}
        </UnitablesRow>
      );
    },
    [jsonSchemaBridge, onValidateRow]
  );

  return (
    <>
      {unitablesColumns.length > 0 && rows.length > 0 && formsDivRendered && (
        <ErrorBoundary ref={inputErrorBoundaryRef} setHasError={setError} error={<InputError />}>
          <div style={{ display: "flex" }} ref={containerRef}>
            <div
              className={"kie-tools--unitables-open-on-form-container"}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <OutsideRowMenu height={63} isFirstChild={true}>{`#`}</OutsideRowMenu>
              <OutsideRowMenu height={64.2} borderBottomSizeBasis={1}>{`#`}</OutsideRowMenu>
              {rows.map((e, rowIndex) => (
                <Tooltip key={rowIndex} content={`Open row ${rowIndex + 1} in the form view`}>
                  <OutsideRowMenu height={60.8} isLastChild={rowIndex === rows.length - 1}>
                    <Button
                      className={"kie-tools--masthead-hoverable"}
                      variant={ButtonVariant.plain}
                      onClick={() => openRow(rowIndex)}
                    >
                      <ListIcon />
                    </Button>
                  </OutsideRowMenu>
                </Tooltip>
              ))}
            </div>
            <UnitablesBeeTable
              rowWrapper={rowWrapper}
              scrollableParentRef={scrollableParentRef}
              i18n={i18n}
              rows={rows}
              columns={unitablesColumns}
              id={inputUid}
              onRowAdded={onRowAdded}
              onRowDuplicated={onRowDuplicated}
              onRowReset={onRowReset}
              onRowDeleted={onRowDeleted}
              setWidth={setWidth}
            />
          </div>
        </ErrorBoundary>
      )}

      <div ref={() => setFormsDivRendered(true)} id={FORMS_ID} />
    </>
  );
};

function InputError() {
  return (
    <div>
      <EmptyState>
        <EmptyStateIcon icon={ExclamationIcon} />
        <TextContent>
          <Text component={"h2"}>Error</Text>
        </TextContent>
        <EmptyStateBody>
          <p>An error has happened while trying to show your inputs</p>
        </EmptyStateBody>
      </EmptyState>
    </div>
  );
}

function OutsideRowMenu({
  children,
  height,
  isLastChild = false,
  isFirstChild = false,
  borderBottomSizeBasis = 1,
}: React.PropsWithChildren<{
  height: number;
  isLastChild?: boolean;
  isFirstChild?: boolean;
  borderBottomSizeBasis?: number;
}>) {
  return (
    <div
      style={{
        width: "60px",
        height: `${height + (isFirstChild ? 3 : 0) + (isLastChild ? 1.6 : 0)}px`,
        display: "flex",
        fontSize: "16px",
        color: "gray",
        alignItems: "center",
        justifyContent: "center",
        borderBottom: `${isLastChild ? 3 : borderBottomSizeBasis}px solid lightgray`,
        borderTop: `${isFirstChild ? 2 : 0}px solid lightgray`,
        borderLeft: "3px solid lightgray",
      }}
    >
      {children}
    </div>
  );
}
