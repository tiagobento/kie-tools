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

import { EmbeddedEditorFile, StateControl } from "../../channel";
import { KogitoGuidedTour } from "@kie-tools-core/guided-tour/dist/channel";
import { Tutorial, UserInteraction } from "@kie-tools-core/guided-tour/dist/api";
import { EditorContent, EditorTheme, KogitoEditorChannelApi, StateControlCommand } from "../../api";
import { FindPathsOpts, WorkspaceEdit } from "@kie-tools-core/workspace/dist/api";
import { Notification } from "@kie-tools-core/notifications/dist/api";

export class EmbeddedEditorChannelApiImpl implements KogitoEditorChannelApi {
  constructor(
    private readonly stateControl: StateControl,
    private readonly file: EmbeddedEditorFile,
    private readonly locale: string,
    private readonly overrides: Partial<KogitoEditorChannelApi>
  ) {}

  public kogitoWorkspace_onNewEdit(edit: WorkspaceEdit) {
    this.stateControl.updateCommandStack({ id: edit.id });
    this.overrides.kogitoWorkspace_onNewEdit?.(edit);
  }

  public kogitoEditor_stateControlCommandUpdate(command: StateControlCommand) {
    switch (command) {
      case StateControlCommand.REDO:
        this.stateControl.redo();
        break;
      case StateControlCommand.UNDO:
        this.stateControl.undo();
        break;
      default:
        console.info(`Unknown message type received: ${command}`);
        break;
    }
    this.overrides.kogitoEditor_stateControlCommandUpdate?.(command);
  }

  public kogitoGuidedTour_guidedTourUserInteraction(userInteraction: UserInteraction) {
    KogitoGuidedTour.getInstance().onUserInteraction(userInteraction);
  }

  public kogitoGuidedTour_guidedTourRegisterTutorial(tutorial: Tutorial) {
    KogitoGuidedTour.getInstance().registerTutorial(tutorial);
  }

  public async kogitoEditor_contentRequest() {
    const content = await this.file.getFileContents();
    return { content: content ?? "", path: this.file.fileName };
  }

  public async kogitoWorkspace_requestContent(path: string) {
    return this.overrides.kogitoWorkspace_requestContent?.(path);
  }

  public async kogitoWorkspace_findPaths(globPattern: string, opts?: FindPathsOpts) {
    return this.overrides.kogitoWorkspace_findPaths?.(globPattern, opts) ?? [];
  }

  public kogitoWorkspace_openFile(path: string): void {
    this.overrides.kogitoWorkspace_openFile?.(path);
  }

  public kogitoEditor_ready(): void {
    this.overrides.kogitoEditor_ready?.();
  }

  public kogitoEditor_setContentError(editorContent: EditorContent): void {
    this.overrides.kogitoEditor_setContentError?.(editorContent);
  }

  public kogitoEditor_theme() {
    return this.overrides.kogitoEditor_theme?.() ?? { defaultValue: EditorTheme.LIGHT };
  }

  public kogitoI18n_getLocale(): Promise<string> {
    return Promise.resolve(this.locale);
  }

  public kogitoNotifications_createNotification(notification: Notification): void {
    this.overrides.kogitoNotifications_createNotification?.(notification);
  }

  public kogitoNotifications_setNotifications(path: string, notifications: Notification[]): void {
    this.overrides.kogitoNotifications_setNotifications?.(path, notifications);
  }

  public kogitoNotifications_removeNotifications(path: string): void {
    this.overrides.kogitoNotifications_removeNotifications?.(path);
  }
}
