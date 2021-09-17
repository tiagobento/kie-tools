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

import { Alert } from "@patternfly/react-core/dist/js/components/Alert";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { ActionGroup, Form, FormAlert, FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { InputGroup, InputGroupText } from "@patternfly/react-core/dist/js/components/InputGroup";
import { Popover } from "@patternfly/react-core/dist/js/components/Popover";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import { ArrowRightIcon } from "@patternfly/react-icons/dist/js/icons/arrow-right-icon";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import { TimesIcon } from "@patternfly/react-icons/dist/js/icons/times-icon";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useSettings } from "./SettingsContext";
import { useOnlineI18n } from "../common/i18n";
import { OpenShiftInstanceStatus } from "./OpenShiftInstanceStatus";
import { EMPTY_CONFIG, isConfigValid, OpenShiftSettingsConfig, saveConfigCookie } from "./OpenShiftSettingsConfig";
import { PageSection } from "@patternfly/react-core/dist/js/components/Page";

enum FormValiationOptions {
  INITIAL = "INITIAL",
  INVALID = "INVALID",
  CONNECTION_ERROR = "CONNECTION_ERROR",
  CONFIG_EXPIRED = "CONFIG_EXPIRED",
}

export function OpenShiftSettingsTabSimpleConfig() {
  const { i18n } = useOnlineI18n();
  const settings = useSettings();
  const [config, setConfig] = useState(settings.openshift.config.get);
  const [isConfigValidated, setConfigValidated] = useState(FormValiationOptions.INITIAL);
  const [isConnecting, setConnecting] = useState(false);

  useEffect(() => {
    setConfig(settings.openshift.config.get);
    setConfigValidated(
      settings.openshift.status.get === OpenShiftInstanceStatus.EXPIRED
        ? FormValiationOptions.CONFIG_EXPIRED
        : FormValiationOptions.INITIAL
    );
  }, [settings.openshift.config.get, settings.openshift.status.get]);

  const resetConfig = useCallback(
    (config: OpenShiftSettingsConfig) => {
      setConfigValidated(
        settings.openshift.status.get === OpenShiftInstanceStatus.EXPIRED && config !== EMPTY_CONFIG
          ? FormValiationOptions.CONFIG_EXPIRED
          : FormValiationOptions.INITIAL
      );
      setConnecting(false);
      setConfig(config);
    },
    [settings.openshift.status.get]
  );

  const onCheckConfig = useCallback(
    async (config: OpenShiftSettingsConfig, persist: boolean) => {
      const isConfigOk = isConfigValid(config) && (await settings.openshift.service.isConnectionEstablished(config));

      if (persist && isConfigOk) {
        settings.openshift.config.set(config);
        saveConfigCookie(config);
        settings.openshift.status.set(OpenShiftInstanceStatus.CONNECTED);
      }

      return isConfigOk;
    },
    [settings.openshift]
  );

  const onConnect = useCallback(async () => {
    if (isConnecting) {
      return;
    }

    if (!isConfigValid(config)) {
      setConfigValidated(FormValiationOptions.INVALID);
      return;
    }

    setConnecting(true);
    const isConfigOk = await onCheckConfig(config, true);
    setConnecting(false);

    if (!isConfigOk) {
      setConfigValidated(FormValiationOptions.CONNECTION_ERROR);
      return;
    }

    resetConfig(config);
  }, [config, isConnecting, resetConfig, onCheckConfig]);

  const onClearHost = useCallback(() => setConfig({ ...config, host: "" }), [config]);
  const onClearNamespace = useCallback(() => setConfig({ ...config, namespace: "" }), [config]);
  const onClearToken = useCallback(() => setConfig({ ...config, token: "" }), [config]);

  const onHostChanged = useCallback(
    (newValue: string) => {
      setConfig({ ...config, host: newValue });
    },
    [config]
  );

  const onNamespaceChanged = useCallback(
    (newValue: string) => {
      setConfig({ ...config, namespace: newValue });
    },
    [config]
  );

  const onTokenChanged = useCallback(
    (newValue: string) => {
      setConfig({ ...config, token: newValue });
    },
    [config]
  );

  return (
    <>
      <PageSection variant={"light"} isFilled={true} style={{ height: "100%" }}>
        {isConfigValidated === FormValiationOptions.INVALID && (
          <>
            <FormAlert>
              <Alert
                variant="danger"
                title={i18n.dmnDevSandbox.configModal.validationError}
                aria-live="polite"
                isInline
                data-testid="alert-validation-error"
              />
            </FormAlert>
            <br />
          </>
        )}
        {isConfigValidated === FormValiationOptions.CONNECTION_ERROR && (
          <>
            {" "}
            <FormAlert>
              <Alert
                variant="danger"
                title={i18n.dmnDevSandbox.configModal.connectionError}
                aria-live="polite"
                isInline
                data-testid="alert-connection-error"
              />
            </FormAlert>
            <br />
          </>
        )}
        {isConfigValidated === FormValiationOptions.CONFIG_EXPIRED && (
          <>
            <FormAlert>
              <Alert
                variant="warning"
                title={i18n.dmnDevSandbox.configModal.configExpiredWarning}
                aria-live="polite"
                isInline
                data-testid="alert-config-expired-warning"
              />
            </FormAlert>
            <br />
          </>
        )}

        <Button
          id="dmn-dev-sandbox-config-use-wizard-button"
          key="use-wizard"
          className="pf-u-p-0"
          variant="link"
          onClick={() => {
            /*FIXME: Tiago: add wizard option*/
          }}
          data-testid="use-wizard-button"
        >
          {i18n.dmnDevSandbox.configModal.useWizard}
          <ArrowRightIcon className="pf-u-ml-sm" />
        </Button>

        <br />
        <br />

        <Form>
          <FormGroup
            label={i18n.terms.namespace}
            labelIcon={
              <Popover bodyContent={i18n.dmnDevSandbox.configModal.namespaceInfo}>
                <button
                  type="button"
                  aria-label="More info for namespace field"
                  onClick={(e) => e.preventDefault()}
                  aria-describedby="namespace-field"
                  className="pf-c-form__group-label-help"
                >
                  <HelpIcon noVerticalAlign />
                </button>
              </Popover>
            }
            isRequired
            fieldId="namespace-field"
          >
            <InputGroup className="pf-u-mt-sm">
              <TextInput
                autoFocus={true}
                autoComplete={"off"}
                isRequired
                type="text"
                id="namespace-field"
                name="namespace-field"
                aria-label="Namespace field"
                aria-describedby="namespace-field-helper"
                value={config.namespace}
                onChange={onNamespaceChanged}
                isDisabled={isConnecting}
                tabIndex={1}
                data-testid="namespace-text-field"
              />
              <InputGroupText>
                <Button isSmall variant="plain" aria-label="Clear namespace button" onClick={onClearNamespace}>
                  <TimesIcon />
                </Button>
              </InputGroupText>
            </InputGroup>
          </FormGroup>
          <FormGroup
            label={i18n.terms.host}
            labelIcon={
              <Popover bodyContent={i18n.dmnDevSandbox.configModal.hostInfo}>
                <button
                  type="button"
                  aria-label="More info for host field"
                  onClick={(e) => e.preventDefault()}
                  aria-describedby="host-field"
                  className="pf-c-form__group-label-help"
                >
                  <HelpIcon noVerticalAlign />
                </button>
              </Popover>
            }
            isRequired
            fieldId="host-field"
          >
            <InputGroup className="pf-u-mt-sm">
              <TextInput
                autoComplete={"off"}
                isRequired
                type="text"
                id="host-field"
                name="host-field"
                aria-label="Host field"
                aria-describedby="host-field-helper"
                value={config.host}
                onChange={onHostChanged}
                isDisabled={isConnecting}
                tabIndex={2}
                data-testid="host-text-field"
              />
              <InputGroupText>
                <Button isSmall variant="plain" aria-label="Clear host button" onClick={onClearHost}>
                  <TimesIcon />
                </Button>
              </InputGroupText>
            </InputGroup>
          </FormGroup>
          <FormGroup
            label={i18n.terms.token}
            labelIcon={
              <Popover bodyContent={i18n.dmnDevSandbox.configModal.tokenInfo}>
                <button
                  type="button"
                  aria-label="More info for token field"
                  onClick={(e) => e.preventDefault()}
                  aria-describedby="token-field"
                  className="pf-c-form__group-label-help"
                >
                  <HelpIcon noVerticalAlign />
                </button>
              </Popover>
            }
            isRequired
            fieldId="token-field"
          >
            <InputGroup className="pf-u-mt-sm">
              <TextInput
                autoComplete={"off"}
                isRequired
                type="text"
                id="token-field"
                name="token-field"
                aria-label="Token field"
                aria-describedby="token-field-helper"
                value={config.token}
                onChange={onTokenChanged}
                isDisabled={isConnecting}
                tabIndex={3}
                data-testid="token-text-field"
              />
              <InputGroupText>
                <Button isSmall variant="plain" aria-label="Clear token button" onClick={onClearToken}>
                  <TimesIcon />
                </Button>
              </InputGroupText>
            </InputGroup>
          </FormGroup>
          <ActionGroup>
            <Button
              id="dmn-dev-sandbox-config-save-button"
              key="save"
              variant="primary"
              onClick={onConnect}
              data-testid="save-config-button"
              isLoading={isConnecting}
              spinnerAriaValueText={isConnecting ? "Loading" : undefined}
            >
              {isConnecting ? "Connecting" : "Connect"}
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
}
