/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
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
import { connectField, FieldProps } from "uniforms";
import { TextInput, TextInputProps } from "@patternfly/react-core/dist/js/components/TextInput";
import wrapField from "./wrapField";

export type DateFieldProps = FieldProps<
  Date,
  TextInputProps,
  {
    inputRef?: React.RefObject<HTMLInputElement>;
    labelProps?: object;
    max?: Date;
    min?: Date;
    type?: "date" | "datetime-local";
  }
>;

type DateFieldType = "date" | "datetime-local";

const DateConstructor = (typeof global === "object" ? global : window).Date;

const dateFormat = (value?: Date | string, type: DateFieldType = "datetime-local") => {
  if (typeof value === "string") {
    return value?.slice(0, type === "datetime-local" ? -8 : -14);
  }
  return value?.toISOString().slice(0, type === "datetime-local" ? -8 : -14);
};

const dateParse = (timestamp: number, onChange: DateFieldProps["onChange"]) => {
  const date = new DateConstructor(timestamp);
  if (date.getFullYear() < 10000) {
    onChange(date);
  } else if (isNaN(timestamp)) {
    onChange(undefined);
  }
};

function DateField({ onChange, ...props }: DateFieldProps) {
  return wrapField(
    props as any,
    <TextInput
      data-testid={"date-field"}
      id={props.id}
      isDisabled={props.disabled}
      name={props.name}
      placeholder={props.placeholder}
      ref={props.inputRef}
      type="datetime-local"
      onChange={(value) => {
        const valueAsNumber = DateConstructor.parse(value);
        props.disabled || dateParse(valueAsNumber, onChange);
      }}
      value={dateFormat(props.value, props.type) ?? ""}
    />
  );
}

export default connectField(DateField);
