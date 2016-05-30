/*
 *
 *    Copyright (c) 2014,2015,2016 Ahome' Innovation Technologies. All rights reserved.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 *  
 */

package com.ait.lienzo.test.translator;

import com.ait.lienzo.test.settings.Settings;
import javassist.CannotCompileException;
import javassist.CtClass;
import javassist.CtMethod;
import javassist.NotFoundException;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Translator interceptor for overlay types.
 *
 * It provides mocked stubs for Lienzo's overlay types. Delegates most of the methods stubbing to parent and 
 * takes about some concrete methods such as <code>make</code>, <code>create</code>, <code>makeXXX</code> 
 * or <code>createXXX</code>.
 * 
 * NOTE: If the class is an inner class it cannot be mocked, Mockito does not support it. So if you're in this situation, 
 * you can use: 
 * 
 * - <code>com.ait.lienzo.test.translator.LienzoJSOStubTranslatorInterceptor</code> to generate a no-op stub for it
 * - <code>com.ait.lienzo.test.translator.LienzoStubTranslatorInterceptor</code> to provide a custom stub for it
 * 
 * @author Roger Martinez
 * @since 1.0
 * 
 */
public class LienzoJSOMockTranslatorInterceptor 
        extends AbstractLienzoJSOTranslatorInterceptor implements HasSettings {
    
    private final Set<String> jsos = new LinkedHashSet<String>();

    public LienzoJSOMockTranslatorInterceptor() {
        
    }

    @Override
    protected Set<String> getJSOClasses() {
        return jsos;
    }

    @Override
    protected void setMakeMethodBody( String fqcn, 
                                      CtClass ctClass, 
                                      CtMethod ctMethod ) throws NotFoundException, CannotCompileException {
        
        String rName = ctMethod.getReturnType().getName();
        
        ctMethod.setBody(
                String.format( "{ return (%s) com.ait.lienzo.test.ReturnLienzoJSOMocks.invoke("
                        + "Class.forName(\"%s\")); }", rName, rName) );
        
    }

    public void useSettings( Settings settings ) {
        assert null != settings;
        
        this.jsos.addAll( settings.getJSOMocks() );
    }
    
}
