/*
 * Copyright 2023 Red Hat, Inc. and/or its affiliates.
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

import { CompanionFsService } from "../companionFs/CompanionFsService";

// intentention:
// Multiple operations in a short period of time that shares the same type should be one event;
// For this case, the last operation should override the first;

type Parameter<Method> = Method extends (...args: infer Args) => any ? Args : never;

export interface DmnRunnerPersistenceQueueElement<
  FS extends CompanionFsService = CompanionFsService,
  Methods extends keyof FS = keyof FS,
  Method = FS[Methods]
> {
  method: Method;
  args: Parameter<Method>;
}

export class DmnRunnerPersistenceQueue {
  private readonly queue: DmnRunnerPersistenceQueueElement[] = [];
  private timeout: number | undefined = undefined;

  constructor(public readonly companionFsService: CompanionFsService) {}

  public post(element: DmnRunnerPersistenceQueueElement) {
    console.log("PUSH", element);
    this.queue.push(element);

    if (this.timeout) {
      console.log("CANCEL TIMEOUT");
      window.clearTimeout(this.timeout);
    }

    // saves the curernt length before schedule the timeout;
    // if an event appears after the dispatch, it will not be lost;
    const length = this.queue.length;
    this.timeout = window.setTimeout(() => {
      console.log("DISPATCH");
      this.dispatch(length);
    }, 100);
  }

  private dispatch(length: number) {
    // erase the first elements;
    this.queue.splice(0, length - 1);
    const element = this.queue.shift();
    if (!element) {
      return;
    }

    const { method, args } = element;
    method.call(this.companionFsService, ...args);
  }
}
