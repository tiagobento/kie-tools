import * as fs from "fs";
import * as path from "path";
import { DmnDefinitions, getMarshaller } from "@kie-tools/dmn-marshaller";
import { Parser } from "@kie-tools/xml-parser-ts";
import { DMN12__tDefinitions } from "../dist/schemas/dmn-1_2/ts-gen/types";

describe("basic", () => {
  test("sample.dmn", () => {
    const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/sample12.dmn"), "utf-8");

    const { parser, instanceNs, version } = getMarshaller(xml);
    expect(version).toStrictEqual("1.2");

    const { json } = parser.parse({ xml, instanceNs });
    const xml_firstPass = parser.build({ json, instanceNs });
    const xml_secondPass = parser.build({ json: parser.parse({ xml: xml_firstPass, instanceNs }).json, instanceNs });

    expect(xml_firstPass).toStrictEqual(xml_secondPass);
  });

  test("empty.dmn", () => {
    const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/empty13.dmn"), "utf-8");

    const { parser, instanceNs, version } = getMarshaller(xml);
    expect(version).toStrictEqual("1.3");

    const { json } = parser.parse({ xml, instanceNs });
    const xml_firstPass = parser.build({ json, instanceNs });
    const xml_secondPass = parser.build({ json: parser.parse({ xml: xml_firstPass, instanceNs }).json, instanceNs });

    expect(xml_firstPass).toStrictEqual(xml_secondPass);
  });

  test("weird.dmn", () => {
    const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/weird.dmn"), "utf-8");

    const { parser, instanceNs, version } = getMarshaller(xml);
    expect(version).toStrictEqual("1.2");

    const { json } = parser.parse({ xml, instanceNs });
    const xml_firstPass = parser.build({ json, instanceNs });
    const xml_secondPass = parser.build({ json: parser.parse({ xml: xml_firstPass, instanceNs }).json, instanceNs });

    expect(xml_firstPass).toStrictEqual(xml_secondPass);
    console.info(xml_secondPass);
  });

  test("extensionTypes", () => {
    const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/sample12.dmn"), "utf-8");

    const { parser, instanceNs, version } = getMarshaller(xml);
    expect(version).toStrictEqual("1.2");

    const { json } = parser.parse({ xml, instanceNs });
    ((json as DMN12__tDefinitions)["dmndi:DMNDI"]?.["dmndi:DMNDiagram"] ?? []).map((s) => {
      s["di:extension"]?.ComponentWidthsExtension; // Do not remove this line, as it's used to verify that the compilation is working well for extension types.
    });

    ((json as DMN12__tDefinitions)["knowledgeSource"] ?? []).map((s) => {
      s.extensionElements?.attachment; // Do not remove this line, as it's used to verify that the compilation is working well for extension types.
    });

    const xml_firstPass = parser.build({ json, instanceNs });
    const xml_secondPass = parser.build({ json: parser.parse({ xml: xml_firstPass, instanceNs }).json, instanceNs });

    expect(xml_firstPass).toStrictEqual(xml_secondPass);
  });
});
