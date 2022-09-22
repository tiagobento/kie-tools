/*
 * Copyright 2022 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export class ReadWriteFsUsageManager {
  private readonly counter = new Map<string, number>();

  public isInUse(fsMountPoint: string) {
    return this.counter.has(fsMountPoint);
  }

  public ackUsageFor(fsMountPoint: string) {
    console.log(`Summing self to usage counter ${fsMountPoint}`);
    this.counter.set(fsMountPoint, (this.counter.get(fsMountPoint) ?? 0) + 1);
  }

  public releaseUsageFor(fsMountPoint: string) {
    const countWithSelf = this.counter.get(fsMountPoint);
    if (!countWithSelf) {
      throw new Error(`Catastrophic error releasing usage of ${fsMountPoint}. No ack counterpart.`);
    }

    console.log(`Subtracting self from usage counter ${fsMountPoint}`);

    const countWithoutSelf = countWithSelf - 1;
    if (countWithoutSelf < 0) {
      throw new Error(`Catastrophic error releasing usage of ${fsMountPoint}. Negative usage count.`);
    } else if (countWithoutSelf === 0) {
      this.counter.delete(fsMountPoint);
    } else {
      this.counter.set(fsMountPoint, countWithoutSelf);
    }

    return { usagesLeft: countWithoutSelf };
  }
}
