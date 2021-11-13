import { WorkspaceFile } from "../workspace/WorkspacesContext";
import { Breadcrumb, BreadcrumbItem } from "@patternfly/react-core/dist/js/components/Breadcrumb";
import { Link } from "react-router-dom";
import * as React from "react";
import { ActiveWorkspace } from "../workspace/model/ActiveWorkspace";
import { useGlobals } from "../common/GlobalContext";

export function InEditorNavigationBreadcrumb(props: {
  inEditorNavigationStack: string[];
  currentFile: WorkspaceFile;
  workspace: ActiveWorkspace;
}) {
  const globals = useGlobals();

  return (
    <Breadcrumb>
      {props.inEditorNavigationStack
        .slice(0, props.inEditorNavigationStack.lastIndexOf(props.currentFile.relativePath))
        .map((relativePath) => props.workspace.files.filter((f) => f.relativePath === relativePath).pop())
        .filter((file) => file)
        .map((file: WorkspaceFile) => (
          <BreadcrumbItem
            key={file.relativePath}
            render={() => (
              <Link
                to={{
                  pathname: globals.routes.workspaceWithFilePath.path({
                    workspaceId: file.workspaceId,
                    fileRelativePath: file.relativePathWithoutExtension,
                    extension: file.extension,
                  }),
                }}
              >
                {file.nameWithoutExtension}
              </Link>
            )}
          />
        ))}
    </Breadcrumb>
  );
}
