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

import { EditorEnvelopeLocator } from "@kie-tools-core/editor/dist/api";
import { I18n } from "@kie-tools-core/i18n/dist/core";
import { VsCodeJavaCodeCompletionApiImpl } from "@kie-tools-core/vscode-java-code-completion/dist/vscode";
import * as vscode from "vscode";
import { EnvelopeBusMessageBroadcaster } from "./EnvelopeBusMessageBroadcaster";
import { VsCodeKieEditorChannelApiProducer } from "./VsCodeKieEditorChannelApiProducer";
import { VsCodeKieEditorControllerFactory } from "./VsCodeKieEditorControllerFactory";
import { VsCodeKieEditorStore } from "./VsCodeKieEditorStore";
import { VsCodeKieEditorsCustomEditorProvider } from "./VsCodeKieEditorsCustomEditorProvider";
import { VsCodeKieEditorsTextEditorProvider } from "./VsCodeKieEditorsTextEditorProvider";
import { generateSvg } from "./generateSvg";
import { vsCodeI18nDefaults, vsCodeI18nDictionaries } from "./i18n";
import { VsCodeNotificationsChannelApiImpl } from "./notifications/VsCodeNotificationsChannelApiImpl";
import { executeOnSaveHook } from "./onSaveHook";
import { VsCodeWorkspaceChannelApiImpl } from "./workspace/VsCodeWorkspaceChannelApiImpl";

/**
 * Starts a VS Code Extension with the configured EditorEnvelopeLocator, allowing for easily creating a Webview-based editor.
 *
 *  @param args.extensionName The extension name. Used to fetch the extension configuration for supported languages.
 *  @param args.context The vscode.ExtensionContext provided on the activate method of the extension.
 *  @param args.viewType "viewType" attribute of the "customEditor" mapped on package.json of the extension.
 *  @param args.generateSvgCommandId Identifier of the command that will generate an SVG from the open Webview-based editor. A toast notification will appear when it runs.
 *  @param args.silentlyGenerateSvgCommandId Identifier of the command that will generate an SVG from the open Webview-based editor, without any notification appearing.
 *  @param args.settingsEntriesPrefix Prefix os Settings entries registered by this extension. Should match what is defined on `package.json` for `runOnSave`, `svgFilenameTemplate`, and `svgFilePath`.
 *  @param args.editorEnvelopeLocator Mapping of Webviews based on file extensions. Webviews will load content based on this parameter.
 *  @param args.channelApiProducer Optional producer of custom KogitoEditorChannelApi instances.
 *  @param args.editorDocumentType Type of Editor being registered. "custom" (default) for binary files. "text" for Text-based files.
 */
export async function startExtension(args: {
  extensionName: string;
  context: vscode.ExtensionContext;
  viewType: string;
  generateSvgCommandId?: string;
  silentlyGenerateSvgCommandId?: string;
  settingsEntriesPrefix: string;
  editorEnvelopeLocator: EditorEnvelopeLocator;
  channelApiProducer?: VsCodeKieEditorChannelApiProducer;
  editorDocumentType?: "text" | "custom";
}) {
  const i18n = new I18n(vsCodeI18nDefaults, vsCodeI18nDictionaries, vscode.env.language);
  const vscodeWorkspace = new VsCodeWorkspaceChannelApiImpl();
  const editorStore = new VsCodeKieEditorStore();
  const messageBroadcaster = new EnvelopeBusMessageBroadcaster();
  const vscodeNotifications = new VsCodeNotificationsChannelApiImpl(vscodeWorkspace);
  const vsCodeJavaCodeCompletionChannelApi = new VsCodeJavaCodeCompletionApiImpl();

  const editorFactory = new VsCodeKieEditorControllerFactory(
    args.context,
    editorStore,
    args.editorEnvelopeLocator,
    messageBroadcaster,
    vscodeWorkspace,
    vscodeNotifications,
    vsCodeJavaCodeCompletionChannelApi,
    args.viewType,
    i18n,
    args.channelApiProducer
  );

  if (args.editorDocumentType === undefined || args.editorDocumentType === "custom") {
    args.context.subscriptions.push(
      vscode.window.registerCustomEditorProvider(
        args.viewType,
        new VsCodeKieEditorsCustomEditorProvider(
          args.context,
          args.viewType,
          editorStore,
          editorFactory,
          i18n,
          vscodeNotifications,
          args.editorEnvelopeLocator,
          args.settingsEntriesPrefix
        ),
        {
          webviewOptions: { retainContextWhenHidden: true },
        }
      )
    );
  } else if (args.editorDocumentType === "text") {
    args.context.subscriptions.push(
      vscode.window.registerCustomEditorProvider(
        args.viewType,
        new VsCodeKieEditorsTextEditorProvider(args.context, args.viewType, editorFactory),
        {
          webviewOptions: { retainContextWhenHidden: true },
        }
      )
    );

    args.context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
        const envelopeMapping = args.editorEnvelopeLocator.getEnvelopeMapping(document.uri.fsPath);
        if (envelopeMapping) {
          executeOnSaveHook(args.settingsEntriesPrefix, envelopeMapping.type);
        }
      })
    );
  } else {
    throw new Error("Type not supported");
  }

  if (args.generateSvgCommandId !== undefined) {
    args.context.subscriptions.push(
      vscode.commands.registerCommand(args.generateSvgCommandId, () =>
        generateSvg({
          editorStore,
          vscodeWorkspace,
          vsCodeI18n: i18n,
          displayNotification: true,
          editorEnvelopeLocator: args.editorEnvelopeLocator,
          settingsEntriesPrefix: args.settingsEntriesPrefix,
        })
      )
    );
  }

  if (args.silentlyGenerateSvgCommandId !== undefined) {
    args.context.subscriptions.push(
      vscode.commands.registerCommand(args.silentlyGenerateSvgCommandId, () =>
        generateSvg({
          editorStore,
          vscodeWorkspace,
          vsCodeI18n: i18n,
          displayNotification: false,
          editorEnvelopeLocator: args.editorEnvelopeLocator,
          settingsEntriesPrefix: args.settingsEntriesPrefix,
        })
      )
    );
  }

  return editorStore;
}

export * from "./VsCodeKieEditorStore";
export * from "./VsCodeRecommendation";
