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

import { Rect } from "@kogito-tooling/microeditor-envelope-protocol";

function getPositionProvider() {
  return window.JsInterop__Envelope__GuidedTour__GuidedTourCustomSelectorPositionProvider.getInstance();
}

export const getGuidedTourElementPosition = (selector: string) => {
  return getPositionProvider().getPosition(selector);
};

interface GuidedTourCustomSelectorPositionProvider {
  getPosition(querySelector: string): Rect;

  getInstance(): GuidedTourCustomSelectorPositionProvider;
}

declare global {
  interface Window {
    JsInterop__Envelope__GuidedTour__GuidedTourCustomSelectorPositionProvider: GuidedTourCustomSelectorPositionProvider;
  }
}
