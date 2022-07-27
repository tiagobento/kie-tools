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

import { Notification } from "./Notification";
import { NotificationsChannelApi } from "./NotificationsChannelApi";

export type BreakdownPrefixedPropertyName<Property> = Property extends `${infer Prefix}_${infer Name}`
  ? Name
  : Property;

export type ServiceApiFrom<ChannelOrEnvelopeApi> = {
  [P in keyof ChannelOrEnvelopeApi as BreakdownPrefixedPropertyName<P>]: ChannelOrEnvelopeApi[P];
};

const a: ServiceApiFrom<NotificationsChannelApi> = {
  createNotification(notification: Notification): void {},
  removeNotifications(path: string): void {},
  setNotifications(path: string, notifications: Notification[]): void {},
};
