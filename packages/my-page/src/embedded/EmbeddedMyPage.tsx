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

import * as React from "react";
import { useCallback, useImperativeHandle, useRef } from "react";
import { MyPageMapping } from "../channel";
import { ChannelType } from "@kogito-tooling/channel-common-api";
import { ApiDefinition, EnvelopeBusMessage } from "@kogito-tooling/envelope-bus/dist/api";
import { MyPageApi, MyPageChannelApi, MyPageEnvelopeApi } from "../api";
import { useConnectedEnvelopeServer } from "@kogito-tooling/envelope-bus/dist/hooks";
import { ChannelEnvelopeServer } from "@kogito-tooling/envelope-bus/dist/channel";

interface Props {
  mapping: MyPageMapping;
  targetOrigin: string;
  channelType: ChannelType;
  api: MyPageChannelApi;
}

const EmbeddedMyPage: React.RefForwardingComponent<MyPageApi, Props> = (props, forwardedRef) => {
  const myPageApi = useCallback(
    (envelopeServer: ChannelEnvelopeServer<MyPageChannelApi, MyPageEnvelopeApi>) => ({
      setText: (text: string) => envelopeServer.client.notify("myPage__setText", text)
    }),
    []
  );

  const pollInit = useCallback((envelopeServer: ChannelEnvelopeServer<MyPageChannelApi, MyPageEnvelopeApi>) => {
    return envelopeServer.client.request(
      "myPage__init",
      { origin: envelopeServer.origin, busId: envelopeServer.busId },
      { filePath: undefined, backendUrl: "https://localhost:8000" }
    );
  }, []);

  return (
    <EmbeddedX
      forwardedRef={forwardedRef}
      api={props.api}
      envelopePath={props.mapping.envelopePath}
      origin={props.targetOrigin}
      refDelegate={myPageApi}
      pollInit={pollInit}
    />
  );
};

interface XProps<
  ApiToProvide extends ApiDefinition<ApiToProvide>,
  ApiToConsume extends ApiDefinition<ApiToConsume>,
  T
> {
  refDelegate: (envelopeServer: ChannelEnvelopeServer<ApiToProvide, ApiToConsume>) => T;
  forwardedRef: React.Ref<T>;
  api: ApiToProvide;
  envelopePath: string;
  origin: string;
  pollInit: (envelopeServer: ChannelEnvelopeServer<ApiToProvide, ApiToConsume>) => Promise<any>;
}

function EmbeddedX<
  ApiToProvide extends ApiDefinition<ApiToProvide>,
  ApiToConsume extends ApiDefinition<ApiToConsume>,
  Ref
>(props: XProps<ApiToProvide, ApiToConsume, Ref>, forwardedRef: React.Ref<Ref>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const bus = {
    postMessage<D, T>(message: EnvelopeBusMessage<D, T>) {
      iframeRef.current?.contentWindow?.postMessage(message, "*");
    }
  };

  const envelopeServer = new ChannelEnvelopeServer<ApiToProvide, ApiToConsume>(bus, props.origin, self =>
    props.pollInit(self)
  );

  useImperativeHandle(forwardedRef, () => props.refDelegate(envelopeServer), [props.refDelegate]);

  useConnectedEnvelopeServer<ApiToProvide>(envelopeServer, props.api);

  return <iframe ref={iframeRef} src={props.envelopePath} title="X" />;
}
