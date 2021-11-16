/*
 * Copyright 2021 Red Hat, Inc. and/or its affiliates.
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

import { matchPath } from "react-router";
import { extname } from "path";
import { useMemo } from "react";
import { useEditorEnvelopeLocator } from "../../envelopeLocator/EditorEnvelopeLocatorContext";

export enum UrlType {
  GIT,
  GITHUB,
  GIST,
  GIST_FILE,
  GITHUB_FILE,
  FILE,
  ZIP,
  INVALID,
}

export type ImportableUrl =
  | {
      type: UrlType.ZIP;
      error?: undefined;
      url: URL;
    }
  | {
      type: UrlType.FILE;
      error?: undefined;
      url: URL;
    }
  | {
      type: UrlType.GIT;
      error?: undefined;
      url: URL;
    }
  | {
      type: UrlType.GIST;
      error?: undefined;
      url: URL;
    }
  | {
      type: UrlType.GIST_FILE;
      error?: undefined;
      url: URL;
    }
  | {
      type: UrlType.GITHUB_FILE;
      error?: undefined;
      url: URL;
    }
  | {
      type: UrlType.GITHUB;
      error?: undefined;
      url: URL;
      branch?: string;
    }
  | {
      type: UrlType.INVALID;
      error: string;
      url: string;
    };

export function useImportableUrl(urlString?: string, allowedUrlTypes?: UrlType[]): ImportableUrl {
  const editorEnvelopeLocator = useEditorEnvelopeLocator();

  return useMemo(() => {
    const ifAllowed = (url: ImportableUrl): ImportableUrl => {
      if (allowedUrlTypes && !allowedUrlTypes.includes(url.type)) {
        return { type: UrlType.INVALID, error: "URL not allowed", url: url.url.toString() };
      }

      return url;
    };

    if (!urlString) {
      return { type: UrlType.INVALID, error: "Empty URL", url: "" };
    }

    let url: URL;
    try {
      url = new URL(urlString);
    } catch (e) {
      return { type: UrlType.INVALID, error: "Invalid URL", url: urlString };
    }

    if (url.host === "github.com") {
      const defaultBranchMatch = matchPath<{ org: string; repo: string }>(url.pathname, {
        path: "/:org/:repo",
        exact: true,
        strict: true,
        sensitive: false,
      });

      const customBranchMatch = matchPath<{ org: string; repo: string; tree: string }>(url.pathname, {
        path: "/:org/:repo/tree/:tree",
        exact: true,
        strict: true,
        sensitive: false,
      });

      if (defaultBranchMatch) {
        return ifAllowed({ type: UrlType.GITHUB, url });
      }

      if (customBranchMatch) {
        const branch = customBranchMatch.params.tree;
        const customBranchUrl = new URL(urlString);
        customBranchUrl.pathname = customBranchUrl.pathname.replace(`/tree/${branch}`, "");
        return ifAllowed({ type: UrlType.GITHUB, url: customBranchUrl, branch });
      }

      return { type: UrlType.INVALID, error: "Unsupported GitHub URL", url: urlString };
    }

    if (url.host === "gist.github.com") {
      const match = matchPath<{ org: string; repo: string; tree: string }>(url.pathname, {
        path: "/:user/:gistId",
        exact: true,
        strict: true,
      });

      if (!match) {
        return { type: UrlType.INVALID, error: "Unsupported Gist URL", url: urlString };
      }

      return ifAllowed({ type: UrlType.GIST, url });
    }

    const extension = extname(url.pathname).replace(".", "");
    if (!extension) {
      return { type: UrlType.INVALID, error: `Can't determine file extension from URL`, url: urlString };
    }

    // if (extension === "zip") {
    //   return ifAllowed({ type: UrlType.ZIP, url });
    // }

    if (extension === "git") {
      return ifAllowed({ type: UrlType.GIT, url });
    }

    if (![...editorEnvelopeLocator.mapping.keys()].includes(extension)) {
      return { type: UrlType.INVALID, error: `Unsupported extension '${extension}'`, url: urlString };
    }

    return ifAllowed({ type: UrlType.FILE, url });
  }, [editorEnvelopeLocator, urlString, allowedUrlTypes]);
}
