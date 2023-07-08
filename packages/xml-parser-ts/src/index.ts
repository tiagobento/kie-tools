import * as fxp from "fast-xml-parser";

export type XmlParserTs<T extends object> = {
  parse: (args: { xml: string | Buffer; instanceNs?: Map<string, string> }) => {
    json: T;
    instanceNs: Map<string, string>;
  };
  build: (args: { json: T; instanceNs: Map<string, string>; elements: Elements }) => string;
};

export type XmlParserTsRootElementBaseType = Partial<{ [k: `@_xmlns:${string}`]: string }> & { "@_xmlns"?: string };

export type MetaTypeDef = { type: string; isArray: boolean };

export type Meta = Record<string, Record<string, MetaTypeDef>>;

export type Root = { element: string; type: string };

export type Subs = Record<string, Record<string, string>>;

export type Elements = Record<string, string>;

export type NamespacedProperty<P extends string, K> = K extends string
  ? K extends `@_${string}` | `${string}:${string}` // @_xxx are attributes, xxx:xxx are elements referencing other namespaces;
    ? K
    : `${P}:${K}`
  : never;

export type Namespaced<P extends string, T> = {
  [K in keyof T as NamespacedProperty<P, K>]: NonNullable<T[K]> extends Array<infer R> ? Array<Namespaced<P, R>> : T[K];
};

function parseInt(attrValue: string) {
  let i: number;
  try {
    i = Number.parseInt(attrValue);
  } catch (e) {
    throw new Error(`Cannot parse integer value '${attrValue}'`);
  }

  if (Number.isNaN(i)) {
    throw new Error(`Stopping NaN from propagating. Tried to parse from (integer) '${attrValue}'`);
  }

  return i;
}

function parseFloat(attrValue: string) {
  let f: number;
  try {
    f = Number.parseFloat(attrValue);
  } catch (e) {
    throw new Error(`Cannot parse float value '${attrValue}'`);
  }

  if (Number.isNaN(f)) {
    throw new Error(`Stopping NaN from propagating. Tried to parse from (float) '${attrValue}'`);
  }

  return f;
}

//** AllNNI stands for All non-negative integers. This comes from the XSD specification. */
function parseAllNNI(attrValue: string) {
  try {
    return attrValue === "unbounded" ? "unbounded" : parseInt(attrValue);
  } catch (e) {
    throw new Error(`Cannot parse allNNI value '${attrValue}'`);
  }
}

function parseBoolean(attrValue: string) {
  if (attrValue === "true") {
    return true;
  } else if (attrValue === "false") {
    return false;
  } else {
    throw new Error(`Cannot parse boolean value '${attrValue}'`);
  }
}

/**
 * Receives a base meta and an array of prefix-meta pair. Types described by the extension metas have their properties prefixed by their corresponding prefix.
 *
 * @returns a single meta, containing the information of `base` and all extensions metas with prefixed properties.
 */
export function mergeMetas(base: Meta, extensionMetasByPrefix: [string, Meta][]) {
  const prefixedMetas = extensionMetasByPrefix.reduce((acc, [k, m]) => {
    return {
      ...acc,
      ...Object.keys(m).reduce((macc, t) => {
        macc[t] = Object.keys(m[t]).reduce((tacc, p) => {
          if (p.includes(":") || p.startsWith("@_")) {
            tacc[p] = m[t][p];
          } else {
            tacc[`${k}${p}`] = m[t][p];
          }
          return tacc;
        }, {} as any);
        return macc;
      }, {} as any),
    };
  }, {});

  return { ...base, ...prefixedMetas };
}

/**
 * Searches for a meta type information for the given jsonPath inside `meta`. `root` is used to start the traversal properly.
 *
 * @returns The corresponding meta type information for the given jsonPath, or undefined is none is found.
 */
export function traverse({
  ns,
  instanceNs,
  meta,
  subs,
  elements,
  jsonPath,
  root,
}: {
  ns: Map<string, string>;
  instanceNs: Map<string, string>;
  meta: Meta;
  subs: Subs;
  elements: Elements;
  jsonPath: string;
  root: Root;
}) {
  const jsonPathSplit = jsonPath.split(".");
  jsonPathSplit.shift(); // Discard the first, as it's always empty.

  let ret: MetaTypeDef | undefined = undefined;
  let currentType: Record<string, MetaTypeDef | undefined> = meta[root.type];
  for (const jsonPathPiece of jsonPathSplit) {
    if (!currentType) {
      return {}; // Unmapped property inside an `any`-typed element.
    }

    let pieceName = undefined;
    let pieceNs = undefined;

    // Resolve piece namespace
    const s = jsonPathPiece.split(":");
    if (s.length === 1) {
      pieceNs = ns.get(instanceNs.get("")!) ?? "";
      pieceName = s[0];
    } else if (s.length === 2) {
      pieceNs = ns.get(instanceNs.get(`${s[0]}:`)!) ?? `${s[0]}:`;
      pieceName = s[1];
    } else {
      throw new Error(jsonPathPiece);
    }

    const pieceNsed = `${pieceNs}${pieceName}`;

    // Resolve piece substituionGroups
    let pieceSubsed = pieceNsed;
    while (subs[pieceNs] && !currentType?.[pieceSubsed]) {
      if (pieceSubsed === undefined) {
        break; // Not mapped, ignore unknown element...
      }
      pieceSubsed = subs[pieceNs][pieceSubsed];
    }

    const propType = currentType[pieceSubsed] ?? currentType[pieceNsed];
    if (!propType) {
      return {}; // Unmapped property, let the default act.
    }
    ret = propType;
    currentType = meta[elements[pieceNsed]] ?? meta[propType.type];
  }

  return { propMeta: ret, type: currentType };
}

// Common options used by FXP Parsers and Builders.
const __FXP_OPTS: fxp.X2jOptionsOptional = {
  ignoreAttributes: false, // Obviously, we want the attributes to be part of the JSON too.
  alwaysCreateTextNode: false,
  textNodeName: "#text",
  trimValues: true, //
  numberParseOptions: {
    leadingZeros: true,
    hex: true,
    skipLike: /.*/, // We don't want FXP messing with values. We treat them with our meta map.
    // eNotation: false
  },
  parseAttributeValue: false, // We don't want FXP messing with values. We treat them with our meta map.
  parseTagValue: false, // We don't want FXP messing with values. We treat them with our meta map.
  processEntities: true, // Escaping characters.
  attributeNamePrefix: "@_", // Our standard. XML attributes always begin with @_ on JSON.
};

// The depth option is not documented. It works because of the local patch we have.
const __FXP_SHALLOW_PARSER = new fxp.XMLParser({ ...__FXP_OPTS, depth: 0 } as any);

// This is used to write XML strings based on the JSONs we created.
const __FXP_BUILDER = new fxp.XMLBuilder({
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  ignoreAttributes: false,
  processEntities: true,
  format: true,
  suppressBooleanAttributes: false,
});

/**
 * Returns a bi-directional map with the namespace aliases declared at the root element of a XML document pointing to their URIs and vice-versa. In this map, namespace aliases are suffixed with `:`.
 * E.g. "dmn:" => "https://www.omg.org/spec/DMN/20211108/MODEL/"
 *      "https://www.omg.org/spec/DMN/20211108/MODEL/" => "dmn:"
 */
export function getInstanceNs(xml: string | Buffer): Map<string, string> {
  // console.time("instanceNs took");

  // We don't need to parse the entire document, just the first level, as namespaces are always declared at the root element.
  const shallowXml = __FXP_SHALLOW_PARSER.parse(xml);

  // Find the root element. As there can be only one root element, we're safe looking for the first element.
  const rootElementKey: string = Object.keys(shallowXml).find((attribute) => {
    return !attribute.startsWith("?") && !attribute.startsWith("!");
  })!;

  const nsMap = new Map<string, string>(
    Object.keys(shallowXml[rootElementKey] ?? {})
      .filter((p) => p.startsWith("@_xmlns"))
      .flatMap((p) => {
        const s = p.split(":");

        const nsUri = shallowXml[rootElementKey][p];

        if (s.length === 1) {
          // That's the default namespace.
          return [
            [nsUri, ""],
            ["", nsUri],
          ];
        } else if (s.length === 2) {
          // Normal namespace mapping.
          return [
            [nsUri, `${s[1]}:`],
            [`${s[1]}:`, nsUri],
          ];
        } else {
          throw new Error(`Invalid xmlns mapping attribute '${p}'`);
        }
      })
  );

  // console.timeEnd("instanceNs took");
  return nsMap;
}

export function getParser<T extends object>(args: {
  /** Meta information about the structure of the XML. Used for deciding whether a property is array, boolean, float or integer. */
  meta: Meta;
  /** Substituion group mapping going from concrete elements to their substitution group head. */
  subs: Subs;
  /** Element types mapped by their namespaced names. */
  elements: Elements;
  /** Bi-directional namespace --> URI mapping. This is the one used to normalize the resulting JSON, independent of the namespaces declared on the XML instance. */
  ns: Map<string, string>;
  /** Information about the root element used on the XML documents */
  root: Root;
}): XmlParserTs<T> {
  const actualParser = (instanceNs: Map<string, string>) => {
    return new fxp.XMLParser({
      ...__FXP_OPTS,
      useOriginalTagNameOnJsonPath: true,
      isArray: (tagName, jsonPath, isLeafNode, isAttribute) => {
        if (isAttribute) {
          return false; // Attributes are unique per element. Thus, will never be an array.
        }
        const { propMeta } = traverse({ ...args, instanceNs, jsonPath });
        return propMeta?.isArray ?? false;
      },
      // <ns:tagName />
      transformTagName: (_tagName, jsonPath) => {
        const tagName = _tagName.endsWith("/") ? _tagName.substring(0, _tagName.length - 1) : _tagName; // This is a bug on FXP where auto-closing tags will come with an extra '/' at the end of its tagName.
        const splitTagName = tagName.split(":");

        // Treat namespaces
        let ns: string, nsedTagName: string;
        if (splitTagName.length === 1) {
          const nsKey = "";
          ns = args.ns.get(instanceNs.get(nsKey)!) ?? nsKey;
          nsedTagName = `${ns}${splitTagName[0]}`;
        } else if (splitTagName.length === 2) {
          const nsKey = `${splitTagName[0]}:`;
          ns = args.ns.get(instanceNs.get(nsKey)!) ?? nsKey;
          nsedTagName = `${ns}${splitTagName[1]}`;
        } else {
          throw new Error(`Invalid tag name '${tagName}'.`);
        }

        // Treat substitutionGroups
        const { type: parentType } = traverse({ ...args, instanceNs, jsonPath }); // jsonPath doesn't include `tagName` at the end.
        let subsedTagName = nsedTagName;
        while (args.subs[ns] && !parentType?.[subsedTagName]) {
          if (subsedTagName === undefined) {
            break; // Ignore unknown tag/attribute...
          }
          subsedTagName = args.subs[ns][subsedTagName];
        }

        // Return the tag with the correct name, plus the element descriptor if a substitution occurred.
        return subsedTagName === nsedTagName
          ? // No substitutions occurred.
            {
              newTagName: nsedTagName,
              newExtraAttrs: {},
            }
          : // Substitutions occurred. Need to save the original name of the element.
            {
              newTagName: `${subsedTagName ?? nsedTagName}`,
              newExtraAttrs: { __$$element: `${ns}${splitTagName[1]}` },
            };
      },
      // <tagName>tagValue</tagName>
      tagValueProcessor: (tagName, tagValue, jsonPath, hasAttributes, isLeaftNode) => {
        const { propMeta } = traverse({ ...args, instanceNs, jsonPath });
        if (!propMeta) {
          return tagValue;
        } else if (propMeta.type === "string") {
          return tagValue || "";
        } else if (propMeta.type === "integer") {
          return parseInt(tagValue);
        } else if (propMeta.type === "float") {
          return parseFloat(tagValue);
        } else if (propMeta.type === "boolean") {
          return parseBoolean(tagValue);
        } else if (propMeta.type === "any") {
          return tagValue || {}; // That's the empty object. The tag is there, but it doesn't have any information.
        } else {
          return tagValue || {}; // That's the empty object. The tag is there, but it doesn't have any information.
        }
      },
      // <tagName attrName="attrValue" />
      attributeValueProcessor: (attrName, attrValue, jsonPath) => {
        const { propMeta } = traverse({ ...args, instanceNs, jsonPath: `${jsonPath}.@_${attrName}` });
        if (propMeta?.type === "boolean") {
          return parseBoolean(attrValue);
        } else if (propMeta?.type === "integer") {
          return parseInt(attrValue);
        } else if (propMeta?.type === "float") {
          return parseFloat(attrValue);
        } else if (propMeta?.type === "allNNI") {
          return parseAllNNI(attrValue);
        } else {
          return attrValue;
        }
      },
    });
  };

  return {
    parse: ({ xml, instanceNs }) => {
      instanceNs = instanceNs ?? getInstanceNs(xml);

      // console.time("parsing took");
      const json = actualParser(instanceNs).parse(xml);
      // console.timeEnd("parsing took");
      return { json, instanceNs };
    },
    build: ({ json, instanceNs }) => {
      // console.time("building took");
      const xml = __FXP_BUILDER.build(applyInstanceNsMap(json, args.ns, instanceNs));
      // console.timeEnd("building took");
      return xml;
    },
  };
}

/**
 * Converts the JSON to a XML, applying the original instanceNs map on top of the generated ns map.
 *
 * @param json The data to be transformed to XML.
 * @param ns The ns map representing the data on the JSON.
 * @param instanceNs The ns map representing the data on the final XML.
 *
 * @returns a JSON that will be used to write an XML string. The type of this JSON is purposefully `any`
 *          since there's no way to type-safely know what namespace mapping was used on `instanceNs`.
 */
function applyInstanceNsMap<T extends object>(json: T, ns: Map<string, string>, instanceNs: Map<string, string>): any {
  if (typeof json !== "object") {
    return json;
  }

  if (Array.isArray(json)) {
    return json.map((element) => {
      return applyInstanceNsMap(element, ns, instanceNs);
    });
  }

  const res: any = {};

  for (const propertyName in json) {
    if (propertyName.startsWith("@_") || propertyName.startsWith("?") || propertyName === "#text") {
      res[propertyName] = json[propertyName];
      continue;
    }

    const s = propertyName.split(":");

    let newPropertyName: string = propertyName;
    if (s.length === 1) {
      const newPropertyNs = instanceNs.get(ns.get("")!) ?? "";
      newPropertyName = `${newPropertyNs}${propertyName}`;
    } else if (s.length === 2) {
      const propertyNs = `${s[0]}:`;
      const newPropertyNs = instanceNs.get(ns.get(propertyNs) ?? "obviously non-existent key") ?? propertyNs;
      newPropertyName = `${newPropertyNs}${s[1]}`;
    } else {
      throw new Error(`Invalid tag name '${propertyName}'.`);
    }

    res[newPropertyName] = applyInstanceNsMap(json[propertyName] as any, ns, instanceNs);
  }

  return res;
}
