/**
 * Copyright (C) 2016 Red Hat, Inc. and/or its affiliates.
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

package org.jboss.errai.common.client.dom;

import org.jboss.errai.common.client.api.annotations.Element;

import jsinterop.annotations.JsProperty;
import jsinterop.annotations.JsType;

/**
 *
 * @deprecated Use Elemental 2 for new development
 *
 * @author Max Barkley <mbarkley@redhat.com>
 * @see <a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement">Web API</a>
 */
@JsType(isNative = true)
@Element("button")
@Deprecated
public interface Button extends HTMLElement {
  @JsProperty Form getForm();

  @Override
  @JsProperty String getAccessKey();
  @Override
  @JsProperty void setAccessKey(String accessKey);

  @JsProperty boolean getDisabled();
  @JsProperty void setDisabled(boolean disabled);

  @JsProperty String getName();
  @JsProperty void setName(String name);

  @Override
  @JsProperty int getTabIndex();
  @Override
  @JsProperty void setTabIndex(int tabIndex);

  @JsProperty String getType();

  @JsProperty String getValue();
  @JsProperty void setValue(String value);
}
