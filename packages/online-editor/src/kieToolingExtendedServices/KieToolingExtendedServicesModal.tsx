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

import { Alert, AlertVariant } from "@patternfly/react-core/dist/js/components/Alert";
import { Button } from "@patternfly/react-core/dist/js/components/Button";
import { ExpandableSection } from "@patternfly/react-core/dist/js/components/ExpandableSection";
import { Form, FormGroup } from "@patternfly/react-core/dist/js/components/Form";
import { Label } from "@patternfly/react-core/dist/js/components/Label";
import { List, ListItem } from "@patternfly/react-core/dist/js/components/List";
import { Modal, ModalVariant } from "@patternfly/react-core/dist/js/components/Modal";
import { SelectDirection } from "@patternfly/react-core/dist/js/components/Select";
import { Text, TextContent, TextVariants } from "@patternfly/react-core/dist/js/components/Text";
import { TextInput } from "@patternfly/react-core/dist/js/components/TextInput";
import {
  Wizard,
  WizardContext,
  WizardContextConsumer,
  WizardFooter,
} from "@patternfly/react-core/dist/js/components/Wizard";
import { ExclamationCircleIcon } from "@patternfly/react-icons/dist/js/icons/exclamation-circle-icon";
import { ExternalLinkAltIcon } from "@patternfly/react-icons/dist/js/icons/external-link-alt-icon";
import * as React from "react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatedTripleDotLabel } from "./AnimatedTripleDotLabel";
import { useOnlineI18n } from "../i18n";
import { I18nHtml, I18nWrapped } from "@kie-tooling-core/i18n/dist/react-components";
import { SelectOs } from "../os/SelectOs";
import { getOperatingSystem, OperatingSystem } from "@kie-tooling-core/operating-system";
import { DEVELOPER_SANDBOX_URL } from "../openshift/OpenShiftService";
import { DependentFeature, useKieToolingExtendedServices } from "./KieToolingExtendedServicesContext";
import { KIE_TOOLING_EXTENDED_SERVICES_DEFAULT_PORT } from "./KieToolingExtendedServicesContextProvider";
import { KieToolingExtendedServicesStatus } from "./KieToolingExtendedServicesStatus";
import { useRoutes } from "../navigation/Hooks";

enum ModalPage {
  INITIAL,
  WIZARD,
  USE,
}

const UBUNTU_APP_INDICATOR_LIB = "apt install libappindicator3-dev";
const FEDORA_APP_INDICATOR_LIB = "dnf install libappindicator-gtk3";

export function KieToolingExtendedServicesModal() {
  const { i18n } = useOnlineI18n();
  const routes = useRoutes();
  const [operatingSystem, setOperatingSystem] = useState(getOperatingSystem() ?? OperatingSystem.LINUX);
  const [modalPage, setModalPage] = useState<ModalPage>(ModalPage.INITIAL);
  const kieToolingExtendedServices = useKieToolingExtendedServices();

  const KIE_TOOLING_EXTENDED_SERVICES_MACOS_DMG = useMemo(
    () => `kie_tooling_extended_services_macos_${kieToolingExtendedServices.version}.dmg`,
    [kieToolingExtendedServices.version]
  );
  const KIE_TOOLING_EXTENDED_SERVICES_MACOS_APP = useMemo(() => "KIE Tooling Extended Services.app", []);
  const KIE_TOOLING_EXTENDED_SERVICES_WINDOWS_EXE = useMemo(
    () => `kie_tooling_extended_services_windows_${kieToolingExtendedServices.version}.exe`,
    [kieToolingExtendedServices.version]
  );
  const KIE_TOOLING_EXTENDED_SERVICES_LINUX_TAG_GZ = useMemo(
    () => `kie_tooling_extended_services_linux_${kieToolingExtendedServices.version}.tar.gz`,
    [kieToolingExtendedServices.version]
  );
  const KIE_TOOLING_EXTENDED_SERVICES_BINARIES = useMemo(() => "kie_tooling_extended_services", []);

  const downloadKieToolingExtendedServicesUrl = useMemo(() => {
    switch (operatingSystem) {
      case OperatingSystem.MACOS:
        return process.env.WEBPACK_REPLACE__kieToolingExtendedServicesMacOsDownloadUrl;
      case OperatingSystem.WINDOWS:
        return process.env.WEBPACK_REPLACE__kieToolingExtendedServicesWindowsDownloadUrl;
      case OperatingSystem.LINUX:
      default:
        return process.env.WEBPACK_REPLACE__kieToolingExtendedServicesLinuxDownloadUrl;
    }
  }, [operatingSystem]);

  const macOsWizardSteps = useMemo(
    () => [
      {
        name: i18n.terms.install,
        component: (
          <>
            {kieToolingExtendedServices.outdated && (
              <>
                <Alert
                  variant={AlertVariant.warning}
                  isInline={true}
                  title={i18n.dmnRunner.modal.wizard.outdatedAlert.title}
                >
                  {i18n.dmnRunner.modal.wizard.outdatedAlert.message}
                </Alert>
                <br />
              </>
            )}
            <List>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    <Text
                      id="kie-tooling-extended-services-modal-download-macos"
                      component={TextVariants.a}
                      href={downloadKieToolingExtendedServicesUrl}
                    >
                      {i18n.terms.download}
                    </Text>
                    {i18n.dmnRunner.modal.wizard.macos.install.download}
                  </Text>
                </TextContent>
              </ListItem>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_MACOS_DMG}</Label> }}>
                      {i18n.dmnRunner.modal.wizard.macos.install.openFile}
                    </I18nWrapped>
                  </Text>
                </TextContent>
              </ListItem>
              <ListItem>
                <TextContent>
                  <Text>
                    <I18nWrapped
                      components={{
                        file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_MACOS_APP}</Label>,
                        folder: <Label>{i18n.terms.macosApplicationFolder}</Label>,
                      }}
                    >
                      {i18n.dmnRunner.modal.wizard.macos.install.dragFileToApplicationsFolder}
                    </I18nWrapped>
                  </Text>
                </TextContent>
              </ListItem>
            </List>
          </>
        ),
      },
      {
        name: i18n.terms.start,
        component: (
          <>
            {kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.STOPPED ? (
              <>
                <Alert
                  variant={AlertVariant.warning}
                  isInline={true}
                  title={i18n.dmnRunner.modal.wizard.stoppedAlert.title}
                >
                  {i18n.dmnRunner.modal.wizard.stoppedAlert.message}
                </Alert>
                <br />
                <List>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        {i18n.dmnRunner.modal.wizard.macos.start.stopped.startInstruction}
                      </Text>
                    </TextContent>
                  </ListItem>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_MACOS_APP}</Label> }}>
                          {i18n.dmnRunner.modal.wizard.macos.start.stopped.launchKieToolingExtendedServices}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                </List>
              </>
            ) : (
              <>
                <TextContent>
                  <Text component={TextVariants.p}>{i18n.dmnRunner.modal.wizard.macos.start.firstTime.title}</Text>
                </TextContent>
                <br />
                <List>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped components={{ folder: <Label>{i18n.terms.macosApplicationFolder}</Label> }}>
                          {i18n.dmnRunner.modal.wizard.macos.start.firstTime.openApplicationsFolder}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_MACOS_APP}</Label> }}>
                          {i18n.dmnRunner.modal.wizard.macos.start.firstTime.openAndCancel}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped
                          components={{
                            file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_MACOS_APP}</Label>,
                            again: <b>{i18n.dmnRunner.modal.wizard.macos.start.firstTime.again}</b>,
                          }}
                        >
                          {i18n.dmnRunner.modal.wizard.macos.start.firstTime.openInstruction}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                </List>

                <br />

                <TextContent>
                  <Text component={TextVariants.p}>{i18n.dmnRunner.modal.wizard.macos.start.alreadyRanBefore}</Text>
                </TextContent>
                <br />
                <List>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_MACOS_APP}</Label> }}>
                          {i18n.dmnRunner.modal.wizard.macos.start.launchKieToolingExtendedServices}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                </List>
                <br />
                <br />
                <hr />
                <br />
                <ExpandableSection
                  toggleTextExpanded={i18n.dmnRunner.modal.wizard.macos.start.advanced.title}
                  toggleTextCollapsed={i18n.dmnRunner.modal.wizard.macos.start.advanced.title}
                >
                  <KieToolingExtendedServicesPortForm />
                  <br />
                  <TextContent>
                    <Text component={TextVariants.p}>
                      {i18n.dmnRunner.modal.wizard.macos.start.advanced.runFollowingCommand}
                    </Text>
                  </TextContent>
                  <br />
                  <TextContent>
                    <Text component={TextVariants.p} className={"kogito--code"}>
                      /Applications/KIE\ Tooling\ Extended\ Services.app/Contents/MacOs/kogito -p{" "}
                      {kieToolingExtendedServices.port}
                    </Text>
                  </TextContent>
                  <br />
                </ExpandableSection>
              </>
            )}
          </>
        ),
      },
    ],
    [
      i18n,
      kieToolingExtendedServices.outdated,
      kieToolingExtendedServices.status,
      kieToolingExtendedServices.port,
      downloadKieToolingExtendedServicesUrl,
      KIE_TOOLING_EXTENDED_SERVICES_MACOS_DMG,
      KIE_TOOLING_EXTENDED_SERVICES_MACOS_APP,
    ]
  );

  const windowsWizardSteps = useMemo(
    () => [
      {
        name: i18n.terms.install,
        component: (
          <>
            {kieToolingExtendedServices.outdated && (
              <>
                <Alert
                  variant={AlertVariant.warning}
                  isInline={true}
                  title={i18n.dmnRunner.modal.wizard.outdatedAlert.title}
                >
                  {i18n.dmnRunner.modal.wizard.outdatedAlert.message}
                </Alert>
                <br />
              </>
            )}
            <List>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    <Text
                      id="kie-tooling-extended-services-modal-download-windows"
                      component={TextVariants.a}
                      href={downloadKieToolingExtendedServicesUrl}
                    >
                      {i18n.terms.download}
                    </Text>
                    {i18n.dmnRunner.modal.wizard.windows.install.keepDownload}
                  </Text>
                </TextContent>
              </ListItem>
              <ListItem>
                <TextContent>
                  <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_WINDOWS_EXE}</Label> }}>
                    {i18n.dmnRunner.modal.wizard.windows.install.moveTheFile}
                  </I18nWrapped>
                </TextContent>
              </ListItem>
            </List>
          </>
        ),
      },
      {
        name: i18n.terms.start,
        component: (
          <>
            {kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.STOPPED ? (
              <>
                <Alert
                  variant={AlertVariant.warning}
                  isInline={true}
                  title={i18n.dmnRunner.modal.wizard.stoppedAlert.title}
                >
                  {i18n.dmnRunner.modal.wizard.stoppedAlert.message}
                </Alert>
                <br />
                <List>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        {i18n.dmnRunner.modal.wizard.windows.start.stopped.startInstruction}
                      </Text>
                    </TextContent>
                  </ListItem>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_WINDOWS_EXE}</Label> }}>
                          {i18n.dmnRunner.modal.wizard.windows.start.stopped.launchKieToolingExtendedServices}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                </List>
              </>
            ) : (
              <>
                <TextContent>
                  <Text component={TextVariants.p}>{i18n.dmnRunner.modal.wizard.windows.start.firstTime.title}</Text>
                </TextContent>
                <br />
                <List>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_WINDOWS_EXE}</Label> }}>
                          {i18n.dmnRunner.modal.wizard.windows.start.firstTime.openFolder}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        {i18n.dmnRunner.modal.wizard.windows.start.firstTime.runAnyway}
                      </Text>
                    </TextContent>
                  </ListItem>
                </List>

                <br />

                <TextContent>
                  <Text component={TextVariants.p}>{i18n.dmnRunner.modal.wizard.windows.start.alreadyRanBefore}</Text>
                </TextContent>
                <br />
                <List>
                  <ListItem>
                    <TextContent>
                      <Text component={TextVariants.p}>
                        <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_WINDOWS_EXE}</Label> }}>
                          {i18n.dmnRunner.modal.wizard.windows.start.launchKieToolingExtendedServices}
                        </I18nWrapped>
                      </Text>
                    </TextContent>
                  </ListItem>
                </List>
                <br />
                <br />
                <hr />
                <br />
                <ExpandableSection
                  toggleTextExpanded={i18n.dmnRunner.modal.wizard.windows.start.advanced.title}
                  toggleTextCollapsed={i18n.dmnRunner.modal.wizard.windows.start.advanced.title}
                >
                  <KieToolingExtendedServicesPortForm />
                  <br />
                  <TextContent>
                    <Text component={TextVariants.p}>
                      {i18n.dmnRunner.modal.wizard.windows.start.advanced.runFollowingCommand}
                    </Text>
                  </TextContent>
                  <br />
                  <TextContent>
                    <Text component={TextVariants.p} className={"kogito--code"}>
                      &quot;kie-tooling-extended-services_windows_{kieToolingExtendedServices.version}.exe&quot; -p{" "}
                      {kieToolingExtendedServices.port}
                    </Text>
                  </TextContent>
                  <br />
                </ExpandableSection>
              </>
            )}
          </>
        ),
      },
    ],
    [
      i18n,
      kieToolingExtendedServices.outdated,
      kieToolingExtendedServices.status,
      kieToolingExtendedServices.version,
      kieToolingExtendedServices.port,
      downloadKieToolingExtendedServicesUrl,
      KIE_TOOLING_EXTENDED_SERVICES_WINDOWS_EXE,
    ]
  );

  const linuxWizardSteps = useMemo(
    () => [
      {
        name: i18n.terms.install,
        component: (
          <>
            {kieToolingExtendedServices.outdated && (
              <>
                <Alert
                  variant={AlertVariant.warning}
                  isInline={true}
                  title={i18n.dmnRunner.modal.wizard.outdatedAlert.title}
                >
                  {i18n.dmnRunner.modal.wizard.outdatedAlert.message}
                </Alert>
                <br />
              </>
            )}
            <List>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    <Text
                      id="kie-tooling-extended-services-modal-download-linux"
                      component={TextVariants.a}
                      href={downloadKieToolingExtendedServicesUrl}
                    >
                      {i18n.terms.download}
                    </Text>{" "}
                    {i18n.dmnRunner.modal.wizard.linux.install.download}
                  </Text>
                </TextContent>
              </ListItem>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    {i18n.dmnRunner.modal.wizard.linux.install.installAppIndicator}
                  </Text>
                  <List>
                    <ListItem>
                      <I18nWrapped components={{ package: <Label>{UBUNTU_APP_INDICATOR_LIB}</Label> }}>
                        {i18n.dmnRunner.modal.wizard.linux.install.ubuntuDependency}
                      </I18nWrapped>
                    </ListItem>
                    <ListItem>
                      <I18nWrapped components={{ package: <Label>{FEDORA_APP_INDICATOR_LIB}</Label> }}>
                        {i18n.dmnRunner.modal.wizard.linux.install.fedoraDependency}
                      </I18nWrapped>
                    </ListItem>
                  </List>
                </TextContent>
              </ListItem>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_LINUX_TAG_GZ}</Label> }}>
                      {i18n.dmnRunner.modal.wizard.linux.install.extractContent}
                    </I18nWrapped>
                  </Text>
                </TextContent>
              </ListItem>
            </List>
            <br />
            <TextContent>
              <Text component={TextVariants.p}>
                <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_BINARIES}</Label> }}>
                  {i18n.dmnRunner.modal.wizard.linux.install.binaryExplanation}
                </I18nWrapped>
              </Text>
            </TextContent>
          </>
        ),
      },
      {
        name: i18n.terms.start,
        component: (
          <>
            {kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.STOPPED && (
              <div>
                <Alert
                  variant={AlertVariant.warning}
                  isInline={true}
                  title={i18n.dmnRunner.modal.wizard.stoppedAlert.title}
                >
                  {i18n.dmnRunner.modal.wizard.stoppedAlert.message}
                </Alert>
                <br />
              </div>
            )}
            <List>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>{i18n.dmnRunner.modal.wizard.linux.start.openTerminal}</Text>
                </TextContent>
              </ListItem>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_BINARIES}</Label> }}>
                      {i18n.dmnRunner.modal.wizard.linux.start.goToFolder}
                    </I18nWrapped>
                  </Text>
                </TextContent>
              </ListItem>
              <ListItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    {i18n.dmnRunner.modal.wizard.linux.start.runCommand}
                    <Text component={TextVariants.p} className={"kogito--code"}>
                      ./kie_tooling_extended_services
                    </Text>
                  </Text>
                </TextContent>
              </ListItem>
              <br />
              <hr />
              <br />
              <ExpandableSection
                toggleTextExpanded={i18n.dmnRunner.modal.wizard.linux.start.advanced.title}
                toggleTextCollapsed={i18n.dmnRunner.modal.wizard.linux.start.advanced.title}
              >
                <KieToolingExtendedServicesPortForm />
                <br />
                <TextContent>
                  <Text component={TextVariants.p}>
                    <I18nWrapped components={{ file: <Label>{KIE_TOOLING_EXTENDED_SERVICES_BINARIES}</Label> }}>
                      {i18n.dmnRunner.modal.wizard.linux.start.advanced.runFollowingCommand}
                    </I18nWrapped>
                  </Text>
                </TextContent>
                <br />
                <TextContent>
                  <Text component={TextVariants.p} className={"kogito--code"}>
                    ./kie-tooling-extended-services -p {kieToolingExtendedServices.port}
                  </Text>
                </TextContent>
                <br />
              </ExpandableSection>
            </List>
          </>
        ),
      },
    ],
    [
      i18n,
      kieToolingExtendedServices.outdated,
      kieToolingExtendedServices.status,
      kieToolingExtendedServices.port,
      downloadKieToolingExtendedServicesUrl,
      KIE_TOOLING_EXTENDED_SERVICES_LINUX_TAG_GZ,
      KIE_TOOLING_EXTENDED_SERVICES_BINARIES,
    ]
  );

  const wizardSteps = useMemo(() => {
    switch (operatingSystem) {
      case OperatingSystem.MACOS:
        return macOsWizardSteps;
      case OperatingSystem.WINDOWS:
        return windowsWizardSteps;
      case OperatingSystem.LINUX:
      default:
        return linuxWizardSteps;
    }
  }, [operatingSystem, macOsWizardSteps, windowsWizardSteps, linuxWizardSteps]);

  useEffect(() => {
    if (kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.NOT_RUNNING) {
      setModalPage(ModalPage.INITIAL);
    } else if (kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.STOPPED) {
      setModalPage(ModalPage.WIZARD);
    } else if (kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.RUNNING) {
      setModalPage(ModalPage.USE);
    }

    if (kieToolingExtendedServices.outdated) {
      setModalPage(ModalPage.WIZARD);
    }
  }, [kieToolingExtendedServices.status, kieToolingExtendedServices.outdated]);

  const onClose = useCallback(() => {
    setModalPage(ModalPage.INITIAL);
    kieToolingExtendedServices.setModalOpen(false);
    if (
      kieToolingExtendedServices.status === KieToolingExtendedServicesStatus.STOPPED ||
      kieToolingExtendedServices.outdated
    ) {
      kieToolingExtendedServices.setStatus(KieToolingExtendedServicesStatus.NOT_RUNNING);
    }
  }, [kieToolingExtendedServices]);

  const modalTitle = useMemo(() => {
    switch (modalPage) {
      case ModalPage.INITIAL:
      case ModalPage.USE:
        return "";
      case ModalPage.WIZARD:
        return i18n.dmnRunner.modal.wizard.title;
    }
  }, [modalPage, i18n]);

  const modalVariant = useMemo(() => {
    switch (modalPage) {
      case ModalPage.INITIAL:
      case ModalPage.USE:
        return ModalVariant.medium;
      case ModalPage.WIZARD:
        return ModalVariant.large;
    }
  }, [modalPage]);

  return (
    <Modal
      ouiaId="kie-tooling-extended-services-modal"
      isOpen={kieToolingExtendedServices.isModalOpen}
      onClose={onClose}
      variant={modalVariant}
      aria-label={"Steps to enable the Kie Tooling Extended Services"}
      title={modalTitle}
      description={modalPage === ModalPage.WIZARD && <p>{i18n.dmnRunner.modal.wizard.description}</p>}
      footer={
        <>
          {modalPage === ModalPage.INITIAL && (
            <Button
              className="pf-u-mt-xl kogito--editor__kie-tooling-extended-services-modal-initial-center"
              onClick={() => setModalPage(ModalPage.WIZARD)}
            >
              {i18n.terms.setup}
            </Button>
          )}
          {modalPage === ModalPage.WIZARD && (
            <div className={"kogito--editor__kie-tooling-extended-services-modal-footer"}>
              <Alert
                variant={"default"}
                isInline={true}
                className={"kogito--editor__kie-tooling-extended-services-modal-footer-alert"}
                title={
                  <AnimatedTripleDotLabel label={i18n.dmnRunner.modal.wizard.footerWaitingToConnect} interval={750} />
                }
              />
            </div>
          )}
          {modalPage === ModalPage.USE && <></>}
        </>
      }
    >
      {modalPage === ModalPage.INITIAL && (
        <div className={"kogito--editor__kie-tooling-extended-services-modal-initial"}>
          <div className={"kogito--editor__kie-tooling-extended-services-modal-initial-title"}>
            <TextContent>
              <Text component={TextVariants.h1}>
                {kieToolingExtendedServices.installTriggeredBy === DependentFeature.DMN_DEV_SANDBOX
                  ? i18n.names.dmnDevSandbox
                  : i18n.names.dmnRunner}
              </Text>
            </TextContent>
          </div>
          <div>
            <TextContent className="pf-u-mt-sm pf-u-mb-md">
              <Text component={TextVariants.p}>{i18n.kieToolingExtendedServices.modal.initial.subHeader}</Text>
            </TextContent>
          </div>
          {kieToolingExtendedServices.installTriggeredBy === DependentFeature.DMN_RUNNER && (
            <div className="pf-u-display-flex pf-u-flex-direction-row">
              <div className="pf-u-w-25 pf-u-ml-sm">
                <TextContent>
                  <Text component={TextVariants.p}>{i18n.dmnRunner.modal.initial.runDmnModels}</Text>
                </TextContent>
                <TextContent className="pf-u-mt-md">
                  <Text component={TextVariants.p}>{i18n.dmnRunner.modal.initial.explanation}</Text>
                </TextContent>
                <TextContent className="pf-u-mt-md">
                  <Text component={TextVariants.p}>
                    <I18nWrapped components={{ icon: <ExclamationCircleIcon /> }}>
                      {i18n.dmnRunner.modal.initial.notificationPanelExplanation}
                    </I18nWrapped>
                  </Text>
                </TextContent>
              </div>
              <div className="pf-u-w-75 pf-u-p-sm">
                <img
                  className="pf-u-h-100"
                  src={routes.static.images.dmnRunnerGif.path({})}
                  alt={"DMN Runner usage"}
                  width={"100%"}
                />
              </div>
            </div>
          )}
          {kieToolingExtendedServices.installTriggeredBy === DependentFeature.DMN_DEV_SANDBOX && (
            <div className="pf-u-mt-xl pf-u-display-flex pf-u-flex-direction-row">
              <div className="pf-u-w-25 pf-u-mr-sm">
                <TextContent>
                  <Text component={TextVariants.p}>{i18n.dmnDevSandbox.introduction.explanation}</Text>
                </TextContent>
                <TextContent className="pf-u-mt-md">
                  <Text component={TextVariants.p}>
                    <I18nHtml>{i18n.dmnDevSandbox.introduction.disclaimer}</I18nHtml>
                  </Text>
                </TextContent>
                <TextContent className="pf-u-mt-md">
                  <Text component={TextVariants.p}>
                    <Text component={TextVariants.a} href={DEVELOPER_SANDBOX_URL} target={"_blank"}>
                      {i18n.dmnDevSandbox.common.learnMore}
                      <ExternalLinkAltIcon className="pf-u-mx-sm" />
                    </Text>
                  </Text>
                </TextContent>
              </div>
              <div className="pf-u-w-75">
                <img
                  className="pf-u-h-100"
                  src={routes.static.images.dmnDevSandboxGif.path({})}
                  alt={"DMN Dev Sandbox usage"}
                  width={"100%"}
                />
              </div>
            </div>
          )}
        </div>
      )}
      {modalPage === ModalPage.WIZARD && (
        <div>
          <Form isHorizontal={true}>
            <FormGroup fieldId={"select-os"} label={i18n.terms.os.full}>
              <SelectOs selected={operatingSystem} onSelect={setOperatingSystem} direction={SelectDirection.down} />
            </FormGroup>
          </Form>
          <br />
          <Wizard
            steps={wizardSteps}
            height={400}
            footer={
              <KieToolingExtendedServicesWizardFooter
                onClose={onClose}
                steps={wizardSteps}
                setModalPage={setModalPage}
              />
            }
          />
        </div>
      )}
      {modalPage === ModalPage.USE && (
        <div className={"kogito--editor__kie-tooling-extended-services-modal-use"}>
          <div className={"kogito--editor__kie-tooling-extended-services-modal-use-title"}>
            <TextContent>
              <Text component={TextVariants.h1}>{i18n.dmnRunner.modal.use.title}</Text>
            </TextContent>
          </div>
          <div className={"kogito--editor__kie-tooling-extended-services-modal-use-main-content"}>
            <TextContent className={"kogito--editor__kie-tooling-extended-services-modal-use-margin"}>
              <Text
                component={TextVariants.h3}
                className={"kogito--editor__kie-tooling-extended-services-modal-use-text-align"}
              >
                {i18n.dmnRunner.modal.use.connected}
              </Text>
            </TextContent>
            <br />
            <Button
              variant={"primary"}
              type="submit"
              onClick={onClose}
              className={"kogito--editor__kie-tooling-extended-services-modal-use-margin"}
            >
              {i18n.dmnRunner.modal.use.backToEditor}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

interface WizardImperativeControlProps {
  onClose: () => void;
  steps: Array<{ component: JSX.Element; name: string }>;
  setModalPage: React.Dispatch<ModalPage>;
}

function KieToolingExtendedServicesWizardFooter(props: WizardImperativeControlProps) {
  const wizardContext = useContext(WizardContext);
  const { status } = useKieToolingExtendedServices();
  const { i18n } = useOnlineI18n();

  useEffect(() => {
    if (status === KieToolingExtendedServicesStatus.STOPPED) {
      wizardContext.goToStepByName(props.steps[1].name);
    }
  }, [status, props.setModalPage]);

  return (
    <WizardFooter>
      <WizardContextConsumer>
        {({ activeStep, goToStepByName, goToStepById, onNext, onBack }) => {
          if (activeStep.name !== i18n.terms.start) {
            return (
              <>
                <Button variant="primary" type="submit" onClick={onNext}>
                  {i18n.terms.next}
                </Button>
              </>
            );
          } else {
            return (
              <>
                <Button variant="primary" type="submit" onClick={onBack}>
                  {i18n.terms.back}
                </Button>
              </>
            );
          }
        }}
      </WizardContextConsumer>
    </WizardFooter>
  );
}

function KieToolingExtendedServicesPortForm() {
  const { port, saveNewPort } = useKieToolingExtendedServices();
  const { i18n } = useOnlineI18n();

  return (
    <>
      <Text component={TextVariants.p}>
        <I18nWrapped
          components={{ port: <Text className={"kogito--code"}>{KIE_TOOLING_EXTENDED_SERVICES_DEFAULT_PORT}</Text> }}
        >
          {i18n.dmnRunner.modal.wizard.advancedSettings.title}
        </I18nWrapped>
      </Text>
      <br />
      <Form isHorizontal={true}>
        <FormGroup
          fieldId={"kie-tooling-extended-services-port"}
          label={i18n.dmnRunner.modal.wizard.advancedSettings.label}
          validated={port === "" || parseInt(port, 10) < 0 || parseInt(port, 10) > 65353 ? "error" : "success"}
          helperTextInvalid={i18n.dmnRunner.modal.wizard.advancedSettings.helperTextInvalid}
        >
          <TextInput value={port} type={"number"} onChange={(value) => saveNewPort(value)} />
        </FormGroup>
      </Form>
    </>
  );
}
