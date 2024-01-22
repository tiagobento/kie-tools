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

import { Computed, State } from "./Store";

export type TypeOrReturnType<T> = T extends (...args: any[]) => any ? ReturnType<T> : T;

export type CacheEntry<T> = {
  [K in keyof T]: { value: TypeOrReturnType<T[K]>; dependencies: any[] };
};

export const computedCache = new Map<State, CacheEntry<Computed>>();
(window as any).__KIE_DMN_EDITOR__zustandComputedStateCache = computedCache;

let r: number = 0;
let h: number = 0;
let m: number = 0;

export function cached<K extends keyof Computed>(
  key: K,
  state: State,
  delegate: (state: Omit<State, "computed">, computed: Computed) => TypeOrReturnType<Computed[K]>,
  dependencies?: any[]
): TypeOrReturnType<Computed[K]> {
  r++;
  dependencies ??= [];

  let cacheEntry: Partial<CacheEntry<Computed>>;
  computedCache.set(state, (cacheEntry = computedCache.get(state) ?? ({} as CacheEntry<Computed>)));

  if (Object.hasOwn(cacheEntry, key)) {
    const cachedDeps = cacheEntry[key]?.dependencies ?? [];

    let depsAreEqual = cachedDeps.length === dependencies.length;
    if (depsAreEqual) {
      for (let i = 0; i < cachedDeps.length; i++) {
        if (!Object.is(cachedDeps[i], dependencies[i])) {
          depsAreEqual = false;
        }
      }
    } else {
      console.debug(`${r}: COMPUTED STORE CACHE: (Miss) Deps don't have the same length... (${key})`);
      console.debug(`${r}: ${key} ${cachedDeps} ${dependencies}`);
    }

    if (depsAreEqual) {
      console.debug(`${r}: COMPUTED STORE CACHE: Hit ${++h}! (${key})`);
      return cacheEntry[key]!.value;
    } else {
      console.debug(`${r}: COMPUTED STORE CACHE: (Miss) Deps have different values... (${key})`);
      console.debug(`${r}: ${key} ${cachedDeps} ${dependencies}`);
    }
  }

  console.debug(`${r}: COMPUTED STORE CACHE: Miss (${++m}})... (${key})`);

  const { computed, ...s } = state;
  const v = delegate(s, computed);
  cacheEntry[key] = {} as any;
  cacheEntry[key]!.dependencies = dependencies;
  cacheEntry[key]!.value = v;
  return v;
}

export function clearComputedCache(s: State) {
  console.debug(`${r}: COMPUTED STORE CACHE: Clearing...`);
  computedCache.delete(s);
}
