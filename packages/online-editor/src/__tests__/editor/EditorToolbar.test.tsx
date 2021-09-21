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
import { fireEvent, render } from "@testing-library/react";
import { EditorToolbar, Props } from "../../editor/EditorToolbar";
import { EMPTY_FILE_BPMN, EMPTY_FILE_DMN, EMPTY_FILE_PMML, StateControl } from "@kie-tooling-core/editor/dist/channel";
import {
  usingTestingGlobalContext,
  usingTestingKieToolingExtendedServicesContext,
  usingTestingOnlineI18nContext,
} from "../testing_utils";
import { KieToolingExtendedServicesStatus } from "../../editor/KieToolingExtendedServices/KieToolingExtendedServicesStatus";

const enterFullscreen = jest.fn(() => null);
const requestSave = jest.fn(() => null);
const close = jest.fn(() => null);
const requestCopyContentToClipboard = jest.fn(() => null);
const fullscreen = false;
const requestPreview = jest.fn(() => null);
const requestGistIt = jest.fn(() => null);
const requestEmbed = jest.fn(() => null);
const onRename = jest.fn(() => null);

function mockFunctions() {
  const original = jest.requireActual("../../common/Hooks");
  return {
    ...original,
    useFileUrl: jest.fn().mockImplementation(() => "gist.githubusercontent.com/?file=something"),
  };
}

jest.mock("../../common/Hooks", () => mockFunctions());

afterAll(() => {
  jest.resetAllMocks();
});

describe("EditorToolbar", () => {
  let stateControl: StateControl;
  let requestDownload: () => null;

  beforeEach(() => {
    stateControl = new StateControl();
    requestDownload = jest.fn().mockImplementation(() => {
      stateControl.setSavedCommand();
    });
  });

  describe("is dirty indicator", () => {
    test("should show the isDirty indicator when isEdited is true", () => {
      const isEdited = true;

      const { queryByTestId, getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            <EditorToolbar
              currentFile={EMPTY_FILE_DMN}
              onRename={onRename}
              onFullScreen={enterFullscreen}
              onSave={requestSave}
              onDownload={requestDownload}
              onClose={close}
              onCopyContentToClipboard={requestCopyContentToClipboard}
              isPageFullscreen={fullscreen}
              onPreview={requestPreview}
              onGistIt={requestGistIt}
              onEmbed={requestEmbed}
              isEdited={isEdited}
            />
          ).wrapper
        ).wrapper
      );

      expect(queryByTestId("is-dirty-indicator")).toBeVisible();
      expect(getByTestId("toolbar-title")).toMatchSnapshot();
    });

    test("shouldn't show the isDirty indicator when isEdited is false", () => {
      const isEdited = false;

      const { queryByTestId, getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            <EditorToolbar
              currentFile={EMPTY_FILE_DMN}
              onFullScreen={enterFullscreen}
              onSave={requestSave}
              onDownload={requestDownload}
              onClose={close}
              onRename={onRename}
              onCopyContentToClipboard={requestCopyContentToClipboard}
              isPageFullscreen={fullscreen}
              onPreview={requestPreview}
              onGistIt={requestGistIt}
              onEmbed={requestEmbed}
              isEdited={isEdited}
            />
          ).wrapper
        ).wrapper
      );

      expect(queryByTestId("is-dirty-indicator")).toBeNull();
      expect(getByTestId("toolbar-title")).toMatchSnapshot();
    });

    test("should show the Read-only indicator when readonly is true", () => {
      const { queryByTestId, getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            <EditorToolbar
              currentFile={{ ...EMPTY_FILE_DMN, isReadOnly: true }}
              onFullScreen={enterFullscreen}
              onSave={requestSave}
              onDownload={requestDownload}
              onClose={close}
              onRename={onRename}
              onCopyContentToClipboard={requestCopyContentToClipboard}
              isPageFullscreen={fullscreen}
              onPreview={requestPreview}
              onGistIt={requestGistIt}
              onEmbed={requestEmbed}
              isEdited={false}
            />
          ).wrapper
        ).wrapper
      );

      expect(queryByTestId("is-readonly-indicator")).toBeVisible();
      expect(getByTestId("toolbar-title")).toMatchSnapshot();
    });
  });

  describe("file actions", () => {
    test("Gist it button should be disable without token", async () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            <EditorToolbar
              currentFile={EMPTY_FILE_DMN}
              onFullScreen={enterFullscreen}
              onSave={requestSave}
              onDownload={requestDownload}
              onClose={close}
              onRename={onRename}
              onCopyContentToClipboard={requestCopyContentToClipboard}
              isPageFullscreen={fullscreen}
              onPreview={requestPreview}
              onGistIt={requestGistIt}
              onEmbed={requestEmbed}
              isEdited={false}
            />
          ).wrapper
        ).wrapper
      );

      fireEvent.click(getByTestId("share-menu"));
      expect(getByTestId("gist-it-button")).toBeVisible();
      expect(getByTestId("gist-it-button")).toHaveAttribute("aria-disabled", "true");
      expect(getByTestId("share-menu")).toMatchSnapshot();
    });
  });

  describe("share dropdown items", () => {
    const toolbar = (props?: Partial<Props>) => (
      <EditorToolbar
        currentFile={EMPTY_FILE_DMN}
        onFullScreen={enterFullscreen}
        onSave={requestSave}
        onDownload={requestDownload}
        onClose={close}
        onRename={onRename}
        onCopyContentToClipboard={requestCopyContentToClipboard}
        isPageFullscreen={fullscreen}
        onPreview={requestPreview}
        onGistIt={requestGistIt}
        onEmbed={requestEmbed}
        isEdited={false}
        {...(props ?? {})}
      />
    );

    test("should include Download SVG when dmn", () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(usingTestingGlobalContext(toolbar({ currentFile: EMPTY_FILE_DMN })).wrapper)
          .wrapper
      );

      expect(getByTestId("share-menu")).toBeVisible();
      fireEvent.click(getByTestId("share-menu"));
      expect(getByTestId("dropdown-download-svg")).toBeVisible();
    });

    test("should include Download SVG when bpmn", () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(usingTestingGlobalContext(toolbar({ currentFile: EMPTY_FILE_BPMN })).wrapper)
          .wrapper
      );

      expect(getByTestId("share-menu")).toBeVisible();
      fireEvent.click(getByTestId("share-menu"));
      expect(getByTestId("dropdown-download-svg")).toBeVisible();
    });

    test("should exclude Download SVG when pmml", () => {
      const { queryByTestId, getByTestId } = render(
        usingTestingOnlineI18nContext(usingTestingGlobalContext(toolbar({ currentFile: EMPTY_FILE_PMML })).wrapper)
          .wrapper
      );

      expect(getByTestId("share-menu")).toBeVisible();
      fireEvent.click(getByTestId("share-menu"));
      expect(queryByTestId("dropdown-download-svg")).toBeNull();
    });

    test("should include Embed when dmn", () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(usingTestingGlobalContext(toolbar({ currentFile: EMPTY_FILE_DMN })).wrapper)
          .wrapper
      );

      expect(getByTestId("share-menu")).toBeVisible();
      fireEvent.click(getByTestId("share-menu"));
      expect(getByTestId("dropdown-embed")).toBeVisible();
    });

    test("should include Embed when bpmn", () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(usingTestingGlobalContext(toolbar({ currentFile: EMPTY_FILE_BPMN })).wrapper)
          .wrapper
      );

      expect(getByTestId("share-menu")).toBeVisible();
      fireEvent.click(getByTestId("share-menu"));
      expect(getByTestId("dropdown-embed")).toBeVisible();
    });

    test("should exclude Embed when pmml", () => {
      const { queryByTestId, getByTestId } = render(
        usingTestingOnlineI18nContext(usingTestingGlobalContext(toolbar({ currentFile: EMPTY_FILE_PMML })).wrapper)
          .wrapper
      );

      expect(getByTestId("share-menu")).toBeVisible();
      fireEvent.click(getByTestId("share-menu"));
      expect(queryByTestId("dropdown-embed")).toBeNull();
    });
  });

  describe("KIE Tooling Extended Services", () => {
    const toolbar = (props?: Partial<Props>) => (
      <EditorToolbar
        currentFile={EMPTY_FILE_DMN}
        onFullScreen={enterFullscreen}
        onSave={requestSave}
        onDownload={() => null}
        onClose={close}
        onRename={onRename}
        onCopyContentToClipboard={requestCopyContentToClipboard}
        isPageFullscreen={fullscreen}
        onPreview={requestPreview}
        onGistIt={requestGistIt}
        onEmbed={requestEmbed}
        isEdited={false}
        {...(props ?? {})}
      />
    );

    it("should include buttons when dmn", async () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(usingTestingKieToolingExtendedServicesContext(toolbar()).wrapper).wrapper
        ).wrapper
      );

      expect(getByTestId("kie-tooling-extended-services-button")).toBeVisible();
      expect(getByTestId("dmn-dev-sandbox-button")).toBeVisible();
      expect(getByTestId("dmn-runner-button")).toBeVisible();
    });

    it("should not include buttons when not dmn", async () => {
      const { queryByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            usingTestingKieToolingExtendedServicesContext(toolbar({ currentFile: EMPTY_FILE_BPMN })).wrapper
          ).wrapper
        ).wrapper
      );

      expect(queryByTestId("kie-tooling-extended-services-button")).toBeNull();
      expect(queryByTestId("dmn-dev-sandbox-button")).toBeNull();
      expect(queryByTestId("dmn-runner-button")).toBeNull();
    });

    it("should be running", async () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            usingTestingKieToolingExtendedServicesContext(toolbar(), {
              status: KieToolingExtendedServicesStatus.RUNNING,
            }).wrapper
          ).wrapper
        ).wrapper
      );

      expect(getByTestId("connected-icon")).toBeVisible();
    });

    it("should not be running", async () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            usingTestingKieToolingExtendedServicesContext(toolbar(), {
              status: KieToolingExtendedServicesStatus.STOPPED,
            }).wrapper
          ).wrapper
        ).wrapper
      );

      expect(getByTestId("disconnected-icon")).toBeVisible();
    });

    it("should be outdated", async () => {
      const { getByTestId } = render(
        usingTestingOnlineI18nContext(
          usingTestingGlobalContext(
            usingTestingKieToolingExtendedServicesContext(toolbar(), { outdated: true }).wrapper
          ).wrapper
        ).wrapper
      );

      expect(getByTestId("outdated-icon")).toBeVisible();
    });
  });
});
