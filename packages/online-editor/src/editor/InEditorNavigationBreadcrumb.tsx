import { WorkspaceFile } from "../workspace/WorkspacesContext";
import { Breadcrumb, BreadcrumbItem } from "@patternfly/react-core/dist/js/components/Breadcrumb";
import { Flex, FlexItem } from "@patternfly/react-core/dist/js/layouts/Flex";
import { Link } from "react-router-dom";
import * as React from "react";
import { useEffect } from "react";
import { ActiveWorkspace } from "../workspace/model/ActiveWorkspace";
import { useGlobals } from "../common/GlobalContext";
import { useWorkspaceFilePromise } from "../workspace/hooks/WorkspaceFileHooks";
import { usePrevious } from "../common/Hooks";
import { FileLabel } from "../workspace/components/FileLabel";

export function InEditorNavigationBreadcrumb(props: {
  inEditorNavigationStack: string[];
  setInEditorNavigationStack: React.Dispatch<React.SetStateAction<string[]>>;
  currentFile: WorkspaceFile;
  workspace: ActiveWorkspace;
}) {
  return (
    <>
      <Breadcrumb>
        {props.inEditorNavigationStack
          .slice(0, props.inEditorNavigationStack.indexOf(props.currentFile.relativePath) + 1)
          .map((relativePath, i) => (
            <BreadcrumbItem>
              <BreadcrumbFile
                key={relativePath}
                isActive={i === props.inEditorNavigationStack.indexOf(props.currentFile.relativePath)}
                setInEditorNavigationStack={props.setInEditorNavigationStack}
                workspaceId={props.workspace.descriptor.workspaceId}
                relativePath={relativePath}
              />
            </BreadcrumbItem>
          ))}
      </Breadcrumb>
    </>
  );
}

export function BreadcrumbFile(props: {
  isActive: boolean;
  workspaceId: string;
  relativePath: string;
  setInEditorNavigationStack: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const file = useWorkspaceFilePromise(props.workspaceId, props.relativePath);
  const prevFile = usePrevious(file);
  const globals = useGlobals();

  // When a file is renamed, this updates the breadcrumb.
  // Although the reference is probably broken inside the Editor.
  useEffect(() => {
    if (!file.data || !prevFile?.data) {
      return;
    }

    props.setInEditorNavigationStack((prev) => {
      if (!prev.includes(prevFile.data.relativePath)) {
        return prev;
      }

      return prev.map((p) => {
        return p === prevFile?.data?.relativePath ? file.data.relativePath : p;
      });
    });
  }, [file.data?.relativePath, prevFile?.data?.relativePath]);

  return (
    <>
      {(file.data && (
        <>
          {(!props.isActive && (
            <Link
              to={{
                pathname: globals.routes.workspaceWithFilePath.path({
                  workspaceId: props.workspaceId,
                  fileRelativePath: file.data.relativePathWithoutExtension,
                  extension: file.data.extension,
                }),
              }}
            >
              <Flex
                flexWrap={{ default: "nowrap" }}
                className={"kogito-tooling--masthead-hoverable"}
                style={{ padding: "16px" }}
              >
                <FlexItem>
                  <FileLabel extension={file.data.extension} />
                </FlexItem>
                <FlexItem>{file.data.nameWithoutExtension}</FlexItem>
              </Flex>
            </Link>
          )) || (
            <Flex
              flexWrap={{ default: "nowrap" }}
              className={"kogito-tooling--masthead-hoverable"}
              style={{ padding: "16px" }}
            >
              <FlexItem>
                <FileLabel extension={file.data.extension} />
              </FlexItem>
              <FlexItem>{file.data.nameWithoutExtension}</FlexItem>
            </Flex>
          )}
        </>
      )) ||
        props.relativePath}
    </>
  );
}
