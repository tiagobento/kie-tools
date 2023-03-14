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
import { InputRow } from "@kie-tools/form-dmn";
import { diff } from "deep-object-diff";
import { isObject, mergeDeep } from "./object/mergeDeep";

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
  autoSaveDelay?: number;
}

// should set the deep key that is going to be changed;
function recursiveCheckForKey(
  rowIndex: number,
  cachedRows: InputRow[],
  cachedKeysOfRows: Map<number, Set<string>>,
  parentProperty: Record<string, any>,
  parentKey: string,
  dontCheckForKey?: boolean
): Record<string, any> {
  return Object.entries(parentProperty).reduce((acc, [key, value]) => {
    const fullKey = `${parentKey}.${key}`;
    if (isObject(value)) {
      return recursiveCheckForKey(rowIndex, cachedRows, cachedKeysOfRows, value, fullKey, dontCheckForKey);
    }

    if (!dontCheckForKey && cachedKeysOfRows.get(rowIndex)?.has(fullKey)) {
      return acc;
    }

    // build object from path;
    const objectFromPath: Record<string, any> = set({}, fullKey, value);

    const keySet = cachedKeysOfRows.get(rowIndex);
    if (keySet) {
      keySet.add(fullKey);
    } else {
      cachedKeysOfRows.set(rowIndex, new Set([fullKey]));
    }

    return { ...acc, ...objectFromPath };
  }, {} as Record<string, any>);
}

function filterDifference(
  difference: Record<string, any>,
  rowIndex: number,
  cachedRows: Record<string, any>[],
  cachedKeysOfRows: Map<number, Set<string>>,
  dontCheckForKey?: boolean
) {
  return Object.entries(difference).reduce((acc, [key, value]) => {
    if (key === "id") {
      return acc;
    }

    if (isObject(value)) {
      const recursive = recursiveCheckForKey(rowIndex, cachedRows, cachedKeysOfRows, value, key, dontCheckForKey);
      return { ...acc, ...recursive };
    }
    // check if already changed a value of a key;
    if (!dontCheckForKey && cachedKeysOfRows.get(rowIndex)?.has(key)) {
      return acc;
    }
    acc[key] = value;

    // add key to the cache;
    const keySet = cachedKeysOfRows.get(rowIndex);
    if (keySet) {
      keySet.add(key);
    } else {
      cachedKeysOfRows.set(rowIndex, new Set([key]));
    }
    return acc;
  }, {} as Record<string, any>);
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
  autoSaveDelay = 400,
}: Props) => {
  const inputErrorBoundaryRef = useRef<ErrorBoundary>(null);
  const [formsDivRendered, setFormsDivRendered] = useState<boolean>(false);
  const { columns: unitablesColumns } = useUnitablesColumns(jsonSchemaBridge, setRows, propertiesEntryPath);
  const inputUid = useMemo(() => nextId(), []);

  // create cache to save inputs cache;
  const cachedKeysOfRows = useRef<Map<number, Set<string>>>(new Map());
  const cachedRows = useRef<InputRow[]>([...EMPTY_UNITABLES_INPUTS]);

  // reset cache when rows are updated;
  useLayoutEffect(() => {
    if (isEqual(rows, EMPTY_UNITABLES_INPUTS)) {
      cachedRows.current = [...EMPTY_UNITABLES_INPUTS];
      cachedKeysOfRows.current.clear();
    }
  }, [rows]);

  // Resets the ErrorBoundary everytime the FormSchema is updated
  useEffect(() => {
    inputErrorBoundaryRef.current?.reset();
  }, [jsonSchemaBridge]);

  // Set in-cell input heights (begin)
  const searchRecursively = useCallback((child: any) => {
    if (!child) {
      return;
    }
    if (child.tagName === "svg") {
      return;
    }
    if (child.style) {
      child.style.height = "60px";
    }
    if (!child.childNodes) {
      return;
    }
    child.childNodes.forEach(searchRecursively);
  }, []);

  useLayoutEffect(() => {
    const tbody = containerRef.current?.getElementsByTagName("tbody")[0];
    const inputsCells = Array.from(tbody?.getElementsByTagName("td") ?? []);
    inputsCells.shift();
    inputsCells.forEach((inputCell) => {
      searchRecursively(inputCell.childNodes[0]);
    });
  }, [formsDivRendered, rows, containerRef, searchRecursively]);
  // Set in-cell input heights (end)

  // Perform a autosaveDelay and update all rows simultaneously;
  const timeout = useRef<number | undefined>(undefined);
  const onValidateRow = useCallback(
    (rowInput: Record<string, any>, rowIndex: number) => {
      // check for differences between rowInput and current cache;
      const difference = diff(cachedRows.current[rowIndex], rowInput);
      // save into a map the row and keys that were changed;
      // changing multiple rows/columns at the same time;
      let filteredDifference: Record<string, any> = {};
      if (Object.keys(difference).length > 1) {
        filteredDifference = filterDifference(difference, rowIndex, cachedRows.current, cachedKeysOfRows.current);
      } else {
        filteredDifference = filterDifference(difference, rowIndex, cachedRows.current, cachedKeysOfRows.current, true);
      }

      // merge with rowInput to use `id`
      cachedRows.current[rowIndex] = mergeDeep(rowInput, cachedRows.current[rowIndex], filteredDifference);

      // Debounce;
      if (timeout.current) {
        window.clearTimeout(timeout.current);
      }

      timeout.current = window.setTimeout(() => {
        cachedKeysOfRows.current.clear();
        // Update all rows if a value was changed;
        setRows((previousInputRows) => {
          // if cached length isn't equal to current a table event occured. e.g. add, delete;
          // if cached has the same value as current
          if (
            cachedRows.current.length !== previousInputRows.length ||
            isEqual(cachedRows.current, previousInputRows)
          ) {
            return previousInputRows;
          }
          return [...cachedRows.current] as Array<InputRow>;
        });
      }, autoSaveDelay);
    },
    [setRows, autoSaveDelay]
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
