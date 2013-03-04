/*
 * Copyright 2012 JBoss, by Red Hat, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.jboss.errai.bus.client.framework;

/**
 * @author Mike Brock
 */
public enum BusState {
  UNINITIALIZED(true, false),
  LOCAL_ONLY(true, true),
  CONNECTING(false, false),
  CONNECTION_INTERRUPTED(false, true),
  CONNECTED(false, false);

  private final boolean startableState;
  private final boolean shadowDeliverable;

  private BusState(final boolean startableState, final boolean shadowDeliverable) {
    this.startableState = startableState;
    this.shadowDeliverable = shadowDeliverable;
  }

  public boolean isStartableState() {
    return startableState;
  }

  public boolean isShadowDeliverable() {
    return shadowDeliverable;
  }
}
