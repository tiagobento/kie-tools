/*
 * Copyright 2020 Red Hat, Inc. and/or its affiliates.
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

import * as React from "react";
import { DmnBuiltInDataType } from "../api";

// Extending react-table definitions with missing and custom properties
declare module "react-table" {
  export interface TableState {
    columnResizing: {
      isResizingColumn: boolean;
      columnWidths: {
        [columnName: string]: number;
      };
    };
  }

  export interface ColumnInstance<D extends object> {
    /** Current column is an empty TH element, created by react-table to fill a missing header cell element */
    placeholderOf?: ColumnInstance<D> | undefined;

    columns?: Array<ColumnInstance<D>>;
  }

  export interface ColumnInterface<D extends object> {
    /** Used by react-table to hold the original id chosen for the column, independently from applied operations */
    originalId?: string;
    /** Column identifier */
    accessor: string;
    /** Column group type */
    groupType?: string;
    /** Used to indicate that column operation should be performed directly on column's children */
    appendColumnsOnChildren?: boolean;
    /** Column additive css classes - appended as passed */
    cssClasses?: string;
    /** Column label */
    label: string;
    /** Custom Element to be rendered in place of the column label */
    headerCellElement?: JSX.Element;
    /** It makes this column header inline editable (with double-click) */
    inlineEditable?: boolean;
    /** Column data type */
    dataType: DmnBuiltInDataType;
    /** It tells whether column is of type counter or not */
    isRowIndexColumn: boolean;
    /** Disabling operation handler on the header of this column */
    disableOperationHandlerOnHeader?: boolean;

    //

    cellDelegate?: (id: string) => React.ReactNode;

    width?: number;
    setWidth?(width: number): void;

    resizingWidth?: number;
    setResizingWidth?(width: number, pivotArgs?: { isPivot: boolean }): void;

    columns?: Array<Column<D>>;
  }
}
