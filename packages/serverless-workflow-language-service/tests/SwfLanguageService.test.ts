/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
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

import { nodeUpUntilType, SwfLsNode } from "@kie-tools/serverless-workflow-language-service/dist/channel";

describe("SWF LS Generic tests", () => {
  describe("nodeUpUntilType", () => {
    test("with node undefined", () => {
      expect(nodeUpUntilType(undefined, "property")).toBe(undefined);
    });

    test("simple test", () => {
      const rootNode: SwfLsNode = {
        children: [
          {
            children: [
              {
                children: [],
                type: "property",
                offset: 0,
                length: 0,
              },
            ],
            type: "object",
            offset: 0,
            length: 0,
          },
        ],
        type: "object",
        offset: 0,
        length: 0,
      };

      if (!rootNode.children?.[0] || !rootNode.children?.[0].children?.[0]) {
        return;
      }

      rootNode.children[0].children[0].parent = rootNode.children[0];
      rootNode.children[0].parent = rootNode;

      expect(nodeUpUntilType(rootNode.children[0].children[0], "property")!).toBe(rootNode.children[0].children[0]);
      expect(nodeUpUntilType(rootNode.children[0].children[0], "object")!).toBe(rootNode.children[0]);
      expect(nodeUpUntilType(rootNode.children[0], "object")!).toBe(rootNode.children[0]);
      expect(nodeUpUntilType(rootNode, "object")!).toBe(rootNode);
    });
  });
});
