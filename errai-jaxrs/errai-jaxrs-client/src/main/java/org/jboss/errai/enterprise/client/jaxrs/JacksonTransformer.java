/*
 * Copyright 2011 JBoss, by Red Hat, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.jboss.errai.enterprise.client.jaxrs;

import static org.jboss.errai.common.client.protocols.SerializationParts.ENCODED_TYPE;
import static org.jboss.errai.common.client.protocols.SerializationParts.ENUM_STRING_VALUE;
import static org.jboss.errai.common.client.protocols.SerializationParts.NUMERIC_VALUE;
import static org.jboss.errai.common.client.protocols.SerializationParts.OBJECT_ID;
import static org.jboss.errai.common.client.protocols.SerializationParts.QUALIFIED_VALUE;

import java.util.HashMap;
import java.util.Map;

import org.jboss.errai.common.client.protocols.SerializationParts;

import com.google.gwt.json.client.JSONArray;
import com.google.gwt.json.client.JSONNumber;
import com.google.gwt.json.client.JSONObject;
import com.google.gwt.json.client.JSONParser;
import com.google.gwt.json.client.JSONString;
import com.google.gwt.json.client.JSONValue;

/**
 * Utility to transform Errai's JSON to a Jackson compatible JSON and vice versa.
 * <p>
 * Limitations:
 * <ul>
 * <li>Fields with nested parameterized types are not supported (e.g. List<List<String>>)</li>
 * </ul>
 * 
 * @author Christian Sadilek <csadilek@redhat.com>
 */
public class JacksonTransformer {
  private JacksonTransformer() {};

  /**
   * Transforms Errai JSON into a Jackson compatible JSON.
   * 
   * @param erraiJson
   *          JSON generated by Errai
   * @return jackson compatible JSON
   */
  public static String toJackson(String erraiJson) {
    JSONValue val = JSONParser.parseStrict(erraiJson);
    val = toJackson(val, null, null, new HashMap<String, JSONValue>());

    return val.toString();
  }

  /**
   * The transformation from Errai JSON to Jackson's JSON contains the following steps:
   * <ul>
   * <li>For all JSON objects, recursively remove the Errai specific OBJECT_ID and ENCODED_TYPE values</li>
   * <li>Keep a reference to the removed OBJECT_IDs, so back-references can be resolved</li>
   * <li>If an array is encountered, process all its elements, then remove the Errai specific QUALIFIED_VALUE key, by
   * associating its actual value with the object's key directly: "list": {"^Value": ["e1","e2"]} becomes "list":
   * ["e1","e2"]</li>
   * <li>If an enum is encountered, remove the Errai specific ENUM_STRING_VALUE key, by associating its actual value
   * with the object's key directly: "gender": {"^EnumStringValue": "MALE"} becomes "gender": "MALE"</li>
   * <li>If a number is encountered, remove the Errai specific NUMERIC_VALUE key, by associating its actual value with
   * the object's key directly and turning it into a JSON number, if required: "id": {"^NumValue": "1"} becomes "id": 1</li>
   * <li>If a date is encountered, remove the Errai specific QUALIFIED_VALUE key, by associating its actual value with
   * the object's key directly and turning it into a JSON number</li>
   * <li>If EMBEDDED_JSON is encountered, turn in into standard json</li>
   * </ul>
   * 
   * @param val
   *          the JSON value to transform
   * @param key
   *          the key of the JSON value to transform
   * @param parent
   *          the parent object of the current value
   * @param objectCache
   *          a cache for removed objects, that is used to resolve backreferences
   * @return the modified JSON value
   */
  private static JSONValue toJackson(JSONValue val, String key, JSONObject parent, Map<String, JSONValue> objectCache) {
    JSONObject obj;
    if ((obj = val.isObject()) != null) {
      JSONValue objectIdVal = obj.get(OBJECT_ID);
      if (objectIdVal != null) {
        String objectId = objectIdVal.isString().stringValue();
        if (!objectId.equals("-1")) {
          JSONValue backRef = objectCache.get(objectId);
          if (backRef != null) {
            if (parent != null) {
              parent.put(key, backRef);
            }
            else {
              return backRef.isObject();
            }
          }
          else {
            objectCache.put(objectId, obj);
          }
        }
      }

      JSONValue encType = obj.get(ENCODED_TYPE);
      obj.put(OBJECT_ID, null);
      obj.put(ENCODED_TYPE, null);

      for (String k : obj.keySet()) {
        JSONArray arr;
        if ((arr = obj.get(k).isArray()) != null) {
          for (int i = 0; i < arr.size(); i++) {
            if (arr.get(i).isObject() != null && arr.get(i).isObject().get(NUMERIC_VALUE) != null) {
              arr.set(i, arr.get(i).isObject().get(NUMERIC_VALUE));
            }
            else if (arr.get(i).isObject() != null) {
              arr.set(i, toJackson(arr.get(i), null, null, objectCache));
            }
          }

          if (k.equals(QUALIFIED_VALUE)) {
            if (parent != null) {
              parent.put(key, arr);
            }
            else {
              return arr;
            }
          } 
        }
        else if (k.equals(ENUM_STRING_VALUE)) {
          if (parent != null) {
            parent.put(key, obj.get(k));
          }
          else {
            return val;
          }
        }
        else if (k.equals(NUMERIC_VALUE)) {
          if (parent != null) {
            if (obj.get(k).isString() != null) {
              String numValue = obj.get(k).isString().stringValue();
              parent.put(key, new JSONNumber(Double.parseDouble(numValue)));
            }
            else {
              parent.put(key, obj.get(k));
            }
          }
        }
        else if (k.equals(QUALIFIED_VALUE)) {
          if (parent != null) {
            if (encType.isString().stringValue().equals("java.util.Date")) {
              String dateValue = obj.get(k).isString().stringValue();
              parent.put(key, new JSONNumber(Double.parseDouble(dateValue)));
            }
            else {
              parent.put(key, obj.get(k));
            }
          }
        }
        else if (k.startsWith(SerializationParts.EMBEDDED_JSON)) {
          final JSONValue newKey = JSONParser.parseStrict((k.substring(SerializationParts.EMBEDDED_JSON.length())));
          JSONValue value = obj.get(k);
          JSONObject tmpObject = new JSONObject();
          toJackson(newKey, QUALIFIED_VALUE, tmpObject, objectCache);
          obj.put(tmpObject.get(QUALIFIED_VALUE).toString(), value);
        }

        toJackson(obj.get(k), k, obj, objectCache);
      }
    }

    return cleanUpEmbeddedJson(obj);
  }

  private static JSONObject cleanUpEmbeddedJson(JSONObject obj) {
    if (obj != null) {
      for (String k : obj.keySet()) {
        if (k.startsWith(SerializationParts.EMBEDDED_JSON)) {
          obj.put(k, null);
        }
      }
    }
    return obj;
  }

  /**
   * Transforms Jackson generated JSON into Errai compatible JSON.
   * 
   * @param jackson
   *          JSON generated by Jackson
   * @return Errai compatible JSON
   */
  public static String fromJackson(String jackson) {
    JSONValue val = JSONParser.parseStrict(jackson);
    val = fromJackson(val, null, null, new int[1]);

    return val.toString();
  }

  /**
   * The transformation from Jackson's JSON to Errai JSON contains the following steps:
   * <ul>
   * <li>Recursively add an incremented OBJECT_ID to every JSON object</li>
   * <li>If a number is encountered, wrap it in a new JSON object with an OBJECT_ID and NUMERIC_VALUE property</li>
   * <li>If an array is encountered, wrap it in a new JSON object with an OBJECT_ID and QUALIFIED_VALUE property</li>
   * </ul>
   * 
   * @param val
   *          the JSON value to transform
   * @param key
   *          the key of the JSON value to transform
   * @param parent
   *          the parent object of the current value
   * @param objectId
   *          last used object id
   * @return modified JSON value
   */
  private static JSONValue fromJackson(JSONValue val, String key, JSONObject parent, int[] objectId) {
    JSONObject obj;
    JSONNumber num;
    JSONArray arr;

    if ((obj = val.isObject()) != null) {
      obj.put(OBJECT_ID, new JSONString(new Integer(++objectId[0]).toString()));

      for (String k : obj.keySet()) {
        fromJackson(obj.get(k), k, obj, objectId);
      }
    }
    else if ((num = val.isNumber()) != null) {
      JSONObject numObject = new JSONObject();
      numObject.put(OBJECT_ID, new JSONString(new Integer(++objectId[0]).toString()));
      numObject.put(NUMERIC_VALUE, num);
      if (parent != null) {
        parent.put(key, numObject);
      }
      else {
        val = numObject;
      }
    }
    else if ((arr = val.isArray()) != null) {
      JSONObject arrayObject = new JSONObject();
      arrayObject.put(OBJECT_ID, new JSONString(new Integer(++objectId[0]).toString()));
      arrayObject.put(QUALIFIED_VALUE, arr);
      if (parent != null) {
        parent.put(key, arrayObject);
      }
      else {
        val = arrayObject;
      }

      for (int i = 0; i < arr.size(); i++) {
        arr.set(i, fromJackson(arr.get(i), QUALIFIED_VALUE, null, objectId));
      }
    }

    return val;
  }
}