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
import { useImperativeHandle, useState } from "react";
import { Editor, LoadingStyle } from "../api";
import { LoadingScreen } from "./LoadingScreen";
import { KeyBindingsHelpOverlay } from "./KeyBindingsHelpOverlay";

interface Props {
  setLocale: React.Dispatch<string>;
}

export interface EditorEnvelopeViewApi<E extends Editor> {
  getEditor: () => E | undefined;
  setEditor: (editor: E) => void;
  setLoading: (loadingStyle: LoadingStyle) => void;
  setLoadingFinished: () => void;
  setLocale: (locale: string) => void;
}

export const EditorEnvelopeViewRef: React.ForwardRefRenderFunction<EditorEnvelopeViewApi<Editor>, Props> = (
  props: Props,
  forwardingRef
) => {
  const [editor, setEditor] = useState<Editor | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingStyle, setLoadingStyle] = useState<LoadingStyle>(LoadingStyle.OVERLAY);

  useImperativeHandle(
    forwardingRef,
    () => {
      return {
        getEditor: () => editor,
        setEditor: (newEditor) => setEditor(newEditor),
        setLoading: (loadingStyle) => {
          setLoading(true);
          setLoadingStyle(loadingStyle);
        },
        setLoadingFinished: () => setLoading(false),
        setLocale: (locale) => props.setLocale(locale),
      };
    },
    [props, editor]
  );

  return (
    <>
      {!loading && <KeyBindingsHelpOverlay />}
      <LoadingScreen loading={loading} loadingStyle={loadingStyle} />
      <div style={{ position: "absolute", width: "100vw", height: "100vh", top: "0", left: "0" }}>
        {editor && editor.af_isReact && editor.af_componentRoot()}
      </div>
    </>
  );
};

export const EditorEnvelopeView = React.forwardRef(EditorEnvelopeViewRef);
