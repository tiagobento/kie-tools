const fs = require("fs");
const path = require("path");
const { getMarshaller } = require("@kie-tools/dmn-marshaller");

const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/other/external.dmn"), "utf-8");

const { parser, builder } = getMarshaller(xml);
const json = parser.parse();

const xml2 = builder.build(json);

// console.info(xml2);

// console.info(JSON.stringify(json.definitions, undefined, 2));
