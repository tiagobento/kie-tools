const fs = require("fs");
const path = require("path");
const { getMarshaller } = require("@kie-tools/dmn-marshaller");

console.info("Alive!");

const xml = fs.readFileSync(path.join(__dirname, "../tests-data--manual/other/attachment.dmn"), "utf-8");

const { parser } = getMarshaller(xml);
const json = parser.parse();

console.info(JSON.stringify(json.definitions, undefined, 2));
