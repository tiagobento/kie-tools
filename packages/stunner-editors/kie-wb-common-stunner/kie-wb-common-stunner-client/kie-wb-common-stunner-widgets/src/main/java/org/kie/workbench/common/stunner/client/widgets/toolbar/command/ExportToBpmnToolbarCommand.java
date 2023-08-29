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


package org.kie.workbench.common.stunner.client.widgets.toolbar.command;

import javax.enterprise.inject.Any;
import javax.inject.Inject;

import org.gwtbootstrap3.client.ui.constants.IconType;
import org.jboss.errai.ioc.client.api.ManagedInstance;
import org.kie.workbench.common.stunner.core.client.canvas.AbstractCanvas;
import org.kie.workbench.common.stunner.core.client.canvas.AbstractCanvasHandler;
import org.kie.workbench.common.stunner.core.client.i18n.ClientTranslationService;
import org.kie.workbench.common.stunner.core.client.session.command.impl.ExportToRawFormatSessionCommand;
import org.kie.workbench.common.stunner.core.client.session.impl.AbstractSession;
import org.kie.workbench.common.stunner.core.i18n.CoreTranslationMessages;
import org.kie.workbench.common.stunner.core.util.DefinitionUtils;

public class ExportToBpmnToolbarCommand extends AbstractToolbarCommand<AbstractSession<AbstractCanvas, AbstractCanvasHandler>, ExportToRawFormatSessionCommand> {

    @Inject
    public ExportToBpmnToolbarCommand(final DefinitionUtils definitionUtils,
                                      final @Any ManagedInstance<ExportToRawFormatSessionCommand> command,
                                      final ClientTranslationService translationService) {
        super(definitionUtils,
              command,
              translationService);
    }

    @Override
    protected boolean requiresConfirm() {
        return false;
    }

    @Override
    public IconType getIcon() {
        return IconType.FILE_TEXT_O;
    }

    @Override
    public String getCaption() {
        return translationService.getValue(CoreTranslationMessages.EXPORT_BPMN);
    }

    @Override
    public String getTooltip() {
        return translationService.getValue(CoreTranslationMessages.EXPORT_BPMN);
    }
}
