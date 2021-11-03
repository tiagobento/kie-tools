define(
  "ace/mode/xquery",
  [
    "require",
    "exports",
    "module",
    "ace/worker/worker_client",
    "ace/lib/oop",
    "ace/mode/text",
    "ace/mode/text_highlight_rules",
    "ace/mode/xquery/xquery_lexer",
    "ace/range",
    "ace/mode/behaviour/xquery",
    "ace/mode/folding/cstyle",
    "ace/anchor",
    "ace/ext/language_tools",
  ],
  function (e, t, n) {
    var r = e("../worker/worker_client").WorkerClient,
      i = e("../lib/oop"),
      s = e("./text").Mode,
      o = e("./text_highlight_rules").TextHighlightRules,
      u = e("./xquery/xquery_lexer").XQueryLexer,
      a = e("../range").Range,
      f = e("./behaviour/xquery").XQueryBehaviour,
      l = e("./folding/cstyle").FoldMode,
      c = e("../anchor").Anchor,
      h = e("../ext/language_tools"),
      p = function () {
        (this.$tokenizer = new u()),
          (this.$behaviour = new f()),
          (this.foldingRules = new l()),
          (this.$highlightRules = new o());
      };
    i.inherits(p, s),
      function () {
        h.addCompleter({
          getCompletions: function (e, t, n, r, i) {
            t.$worker.emit("complete", { data: { pos: n, prefix: r } }),
              t.$worker.on("complete", function (e) {
                i(null, e.data);
              });
          },
        }),
          (this.getNextLineIndent = function (e, t, n) {
            var r = this.$getIndent(t),
              i = t.match(/\s*(?:then|else|return|[{\(]|<\w+>)\s*$/);
            return i && (r += n), r;
          }),
          (this.checkOutdent = function (e, t, n) {
            return /^\s+$/.test(t) ? /^\s*[\}\)]/.test(n) : !1;
          }),
          (this.autoOutdent = function (e, t, n) {
            var r = t.getLine(n),
              i = r.match(/^(\s*[\}\)])/);
            if (!i) return 0;
            var s = i[1].length,
              o = t.findMatchingBracket({ row: n, column: s });
            if (!o || o.row == n) return 0;
            var u = this.$getIndent(t.getLine(o.row));
            t.replace(new a(n, 0, n, s - 1), u);
          }),
          (this.toggleCommentLines = function (e, t, n, r) {
            var i,
              s,
              o = !0,
              u = /^\s*\(:(.*):\)/;
            for (i = n; i <= r; i++)
              if (!u.test(t.getLine(i))) {
                o = !1;
                break;
              }
            var f = new a(0, 0, 0, 0);
            for (i = n; i <= r; i++)
              (s = t.getLine(i)),
                (f.start.row = i),
                (f.end.row = i),
                (f.end.column = s.length),
                t.replace(f, o ? s.match(u)[1] : "(:" + s + ":)");
          }),
          (this.createWorker = function (e) {
            var t = new r(["ace"], "ace/mode/xquery_worker", "XQueryWorker"),
              n = this;
            return (
              t.attachToDocument(e.getDocument()),
              t.on("ok", function (t) {
                e.clearAnnotations();
              }),
              t.on("markers", function (t) {
                e.clearAnnotations(), n.addMarkers(t.data, e);
              }),
              t.on("highlight", function (t) {
                (n.$tokenizer.tokens = t.data.tokens), (n.$tokenizer.lines = e.getDocument().getAllLines());
                var r = Object.keys(n.$tokenizer.tokens);
                for (var i = 0; i < r.length; i++) {
                  var s = parseInt(r[i]);
                  delete e.bgTokenizer.lines[s], delete e.bgTokenizer.states[s], e.bgTokenizer.fireUpdateEvent(s, s);
                }
              }),
              t
            );
          }),
          (this.removeMarkers = function (e) {
            var t = e.getMarkers(!1);
            for (var n in t) t[n].clazz.indexOf("language_highlight_") === 0 && e.removeMarker(n);
            for (var r = 0; r < e.markerAnchors.length; r++) e.markerAnchors[r].detach();
            e.markerAnchors = [];
          }),
          (this.addMarkers = function (e, t) {
            var n = this;
            t.markerAnchors || (t.markerAnchors = []),
              this.removeMarkers(t),
              (t.languageAnnos = []),
              e.forEach(function (e) {
                function u(i) {
                  r && t.removeMarker(r), (o.row = n.row);
                  if (e.pos.sc !== undefined && e.pos.ec !== undefined) {
                    var s = new a(e.pos.sl, e.pos.sc, e.pos.el, e.pos.ec);
                    r = t.addMarker(s, "language_highlight_" + (e.type ? e.type : "default"));
                  }
                  i && t.setAnnotations(t.languageAnnos);
                }
                var n = new c(t.getDocument(), e.pos.sl, e.pos.sc || 0);
                t.markerAnchors.push(n);
                var r,
                  i = e.pos.ec - e.pos.sc,
                  s = e.pos.el - e.pos.sl,
                  o = { guttertext: e.message, type: e.level || "warning", text: e.message };
                u(),
                  n.on("change", function () {
                    u(!0);
                  }),
                  e.message && t.languageAnnos.push(o);
              }),
              t.setAnnotations(t.languageAnnos);
          }),
          (this.$id = "ace/mode/xquery");
      }.call(p.prototype),
      (t.Mode = p);
  }
),
  define(
    "ace/mode/behaviour/xquery",
    [
      "require",
      "exports",
      "module",
      "ace/lib/oop",
      "ace/mode/behaviour",
      "ace/mode/behaviour/cstyle",
      "ace/mode/behaviour/xml",
      "ace/token_iterator",
    ],
    function (e, t, n) {
      function a(e, t) {
        var n = !0,
          r = e.type.split("."),
          i = t.split(".");
        return (
          i.forEach(function (e) {
            if (r.indexOf(e) == -1) return (n = !1), !1;
          }),
          n
        );
      }
      var r = e("../../lib/oop"),
        i = e("../behaviour").Behaviour,
        s = e("./cstyle").CstyleBehaviour,
        o = e("../behaviour/xml").XmlBehaviour,
        u = e("../../token_iterator").TokenIterator,
        f = function () {
          this.inherit(s, ["braces", "parens", "string_dquotes"]),
            this.inherit(o),
            this.add("autoclosing", "insertion", function (e, t, n, r, i) {
              if (i == ">") {
                var s = n.getCursorPosition(),
                  o = new u(r, s.row, s.column),
                  f = o.getCurrentToken(),
                  l = !1,
                  e = JSON.parse(e).pop();
                if ((f && f.value === ">") || e !== "StartTag") return;
                if (!f || (!a(f, "meta.tag") && (!a(f, "text") || !f.value.match("/")))) {
                  do f = o.stepBackward();
                  while (
                    f &&
                    (a(f, "string") || a(f, "keyword.operator") || a(f, "entity.attribute-name") || a(f, "text"))
                  );
                } else l = !0;
                var c = o.stepBackward();
                if (!f || !a(f, "meta.tag") || (c !== null && c.value.match("/"))) return;
                var h = f.value.substring(1);
                if (l) var h = h.substring(0, s.column - f.start);
                return { text: "></" + h + ">", selection: [1, 1] };
              }
            });
        };
      r.inherits(f, i), (t.XQueryBehaviour = f);
    }
  ),
  define(
    "ace/mode/behaviour/cstyle",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator", "ace/lib/lang"],
    function (e, t, n) {
      var r = e("../../lib/oop"),
        i = e("../behaviour").Behaviour,
        s = e("../../token_iterator").TokenIterator,
        o = e("../../lib/lang"),
        u = ["text", "paren.rparen", "punctuation.operator"],
        a = ["text", "paren.rparen", "punctuation.operator", "comment"],
        f,
        l = {},
        c = function (e) {
          var t = -1;
          e.multiSelect &&
            ((t = e.selection.id),
            l.rangeCount != e.multiSelect.rangeCount && (l = { rangeCount: e.multiSelect.rangeCount }));
          if (l[t]) return (f = l[t]);
          f = l[t] = {
            autoInsertedBrackets: 0,
            autoInsertedRow: -1,
            autoInsertedLineEnd: "",
            maybeInsertedBrackets: 0,
            maybeInsertedRow: -1,
            maybeInsertedLineStart: "",
            maybeInsertedLineEnd: "",
          };
        },
        h = function () {
          this.add("braces", "insertion", function (e, t, n, r, i) {
            var s = n.getCursorPosition(),
              u = r.doc.getLine(s.row);
            if (i == "{") {
              c(n);
              var a = n.getSelectionRange(),
                l = r.doc.getTextRange(a);
              if (l !== "" && l !== "{" && n.getWrapBehavioursEnabled()) return { text: "{" + l + "}", selection: !1 };
              if (h.isSaneInsertion(n, r))
                return /[\]\}\)]/.test(u[s.column]) || n.inMultiSelectMode
                  ? (h.recordAutoInsert(n, r, "}"), { text: "{}", selection: [1, 1] })
                  : (h.recordMaybeInsert(n, r, "{"), { text: "{", selection: [1, 1] });
            } else if (i == "}") {
              c(n);
              var p = u.substring(s.column, s.column + 1);
              if (p == "}") {
                var d = r.$findOpeningBracket("}", { column: s.column + 1, row: s.row });
                if (d !== null && h.isAutoInsertedClosing(s, u, i))
                  return h.popAutoInsertedClosing(), { text: "", selection: [1, 1] };
              }
            } else {
              if (i == "\n" || i == "\r\n") {
                c(n);
                var v = "";
                h.isMaybeInsertedClosing(s, u) &&
                  ((v = o.stringRepeat("}", f.maybeInsertedBrackets)), h.clearMaybeInsertedClosing());
                var p = u.substring(s.column, s.column + 1);
                if (p === "}") {
                  var m = r.findMatchingBracket({ row: s.row, column: s.column + 1 }, "}");
                  if (!m) return null;
                  var g = this.$getIndent(r.getLine(m.row));
                } else {
                  if (!v) {
                    h.clearMaybeInsertedClosing();
                    return;
                  }
                  var g = this.$getIndent(u);
                }
                var y = g + r.getTabString();
                return { text: "\n" + y + "\n" + g + v, selection: [1, y.length, 1, y.length] };
              }
              h.clearMaybeInsertedClosing();
            }
          }),
            this.add("braces", "deletion", function (e, t, n, r, i) {
              var s = r.doc.getTextRange(i);
              if (!i.isMultiLine() && s == "{") {
                c(n);
                var o = r.doc.getLine(i.start.row),
                  u = o.substring(i.end.column, i.end.column + 1);
                if (u == "}") return i.end.column++, i;
                f.maybeInsertedBrackets--;
              }
            }),
            this.add("parens", "insertion", function (e, t, n, r, i) {
              if (i == "(") {
                c(n);
                var s = n.getSelectionRange(),
                  o = r.doc.getTextRange(s);
                if (o !== "" && n.getWrapBehavioursEnabled()) return { text: "(" + o + ")", selection: !1 };
                if (h.isSaneInsertion(n, r)) return h.recordAutoInsert(n, r, ")"), { text: "()", selection: [1, 1] };
              } else if (i == ")") {
                c(n);
                var u = n.getCursorPosition(),
                  a = r.doc.getLine(u.row),
                  f = a.substring(u.column, u.column + 1);
                if (f == ")") {
                  var l = r.$findOpeningBracket(")", { column: u.column + 1, row: u.row });
                  if (l !== null && h.isAutoInsertedClosing(u, a, i))
                    return h.popAutoInsertedClosing(), { text: "", selection: [1, 1] };
                }
              }
            }),
            this.add("parens", "deletion", function (e, t, n, r, i) {
              var s = r.doc.getTextRange(i);
              if (!i.isMultiLine() && s == "(") {
                c(n);
                var o = r.doc.getLine(i.start.row),
                  u = o.substring(i.start.column + 1, i.start.column + 2);
                if (u == ")") return i.end.column++, i;
              }
            }),
            this.add("brackets", "insertion", function (e, t, n, r, i) {
              if (i == "[") {
                c(n);
                var s = n.getSelectionRange(),
                  o = r.doc.getTextRange(s);
                if (o !== "" && n.getWrapBehavioursEnabled()) return { text: "[" + o + "]", selection: !1 };
                if (h.isSaneInsertion(n, r)) return h.recordAutoInsert(n, r, "]"), { text: "[]", selection: [1, 1] };
              } else if (i == "]") {
                c(n);
                var u = n.getCursorPosition(),
                  a = r.doc.getLine(u.row),
                  f = a.substring(u.column, u.column + 1);
                if (f == "]") {
                  var l = r.$findOpeningBracket("]", { column: u.column + 1, row: u.row });
                  if (l !== null && h.isAutoInsertedClosing(u, a, i))
                    return h.popAutoInsertedClosing(), { text: "", selection: [1, 1] };
                }
              }
            }),
            this.add("brackets", "deletion", function (e, t, n, r, i) {
              var s = r.doc.getTextRange(i);
              if (!i.isMultiLine() && s == "[") {
                c(n);
                var o = r.doc.getLine(i.start.row),
                  u = o.substring(i.start.column + 1, i.start.column + 2);
                if (u == "]") return i.end.column++, i;
              }
            }),
            this.add("string_dquotes", "insertion", function (e, t, n, r, i) {
              if (i == '"' || i == "'") {
                c(n);
                var s = i,
                  o = n.getSelectionRange(),
                  u = r.doc.getTextRange(o);
                if (u !== "" && u !== "'" && u != '"' && n.getWrapBehavioursEnabled())
                  return { text: s + u + s, selection: !1 };
                var a = n.getCursorPosition(),
                  f = r.doc.getLine(a.row),
                  l = f.substring(a.column - 1, a.column);
                if (l == "\\") return null;
                var p = r.getTokens(o.start.row),
                  d = 0,
                  v,
                  m = -1;
                for (var g = 0; g < p.length; g++) {
                  (v = p[g]), v.type == "string" ? (m = -1) : m < 0 && (m = v.value.indexOf(s));
                  if (v.value.length + d > o.start.column) break;
                  d += p[g].value.length;
                }
                if (
                  !v ||
                  (m < 0 &&
                    v.type !== "comment" &&
                    (v.type !== "string" ||
                      (o.start.column !== v.value.length + d - 1 && v.value.lastIndexOf(s) === v.value.length - 1)))
                ) {
                  if (!h.isSaneInsertion(n, r)) return;
                  return { text: s + s, selection: [1, 1] };
                }
                if (v && v.type === "string") {
                  var y = f.substring(a.column, a.column + 1);
                  if (y == s) return { text: "", selection: [1, 1] };
                }
              }
            }),
            this.add("string_dquotes", "deletion", function (e, t, n, r, i) {
              var s = r.doc.getTextRange(i);
              if (!i.isMultiLine() && (s == '"' || s == "'")) {
                c(n);
                var o = r.doc.getLine(i.start.row),
                  u = o.substring(i.start.column + 1, i.start.column + 2);
                if (u == s) return i.end.column++, i;
              }
            });
        };
      (h.isSaneInsertion = function (e, t) {
        var n = e.getCursorPosition(),
          r = new s(t, n.row, n.column);
        if (!this.$matchTokenType(r.getCurrentToken() || "text", u)) {
          var i = new s(t, n.row, n.column + 1);
          if (!this.$matchTokenType(i.getCurrentToken() || "text", u)) return !1;
        }
        return (
          r.stepForward(), r.getCurrentTokenRow() !== n.row || this.$matchTokenType(r.getCurrentToken() || "text", a)
        );
      }),
        (h.$matchTokenType = function (e, t) {
          return t.indexOf(e.type || e) > -1;
        }),
        (h.recordAutoInsert = function (e, t, n) {
          var r = e.getCursorPosition(),
            i = t.doc.getLine(r.row);
          this.isAutoInsertedClosing(r, i, f.autoInsertedLineEnd[0]) || (f.autoInsertedBrackets = 0),
            (f.autoInsertedRow = r.row),
            (f.autoInsertedLineEnd = n + i.substr(r.column)),
            f.autoInsertedBrackets++;
        }),
        (h.recordMaybeInsert = function (e, t, n) {
          var r = e.getCursorPosition(),
            i = t.doc.getLine(r.row);
          this.isMaybeInsertedClosing(r, i) || (f.maybeInsertedBrackets = 0),
            (f.maybeInsertedRow = r.row),
            (f.maybeInsertedLineStart = i.substr(0, r.column) + n),
            (f.maybeInsertedLineEnd = i.substr(r.column)),
            f.maybeInsertedBrackets++;
        }),
        (h.isAutoInsertedClosing = function (e, t, n) {
          return (
            f.autoInsertedBrackets > 0 &&
            e.row === f.autoInsertedRow &&
            n === f.autoInsertedLineEnd[0] &&
            t.substr(e.column) === f.autoInsertedLineEnd
          );
        }),
        (h.isMaybeInsertedClosing = function (e, t) {
          return (
            f.maybeInsertedBrackets > 0 &&
            e.row === f.maybeInsertedRow &&
            t.substr(e.column) === f.maybeInsertedLineEnd &&
            t.substr(0, e.column) == f.maybeInsertedLineStart
          );
        }),
        (h.popAutoInsertedClosing = function () {
          (f.autoInsertedLineEnd = f.autoInsertedLineEnd.substr(1)), f.autoInsertedBrackets--;
        }),
        (h.clearMaybeInsertedClosing = function () {
          f && ((f.maybeInsertedBrackets = 0), (f.maybeInsertedRow = -1));
        }),
        r.inherits(h, i),
        (t.CstyleBehaviour = h);
    }
  ),
  define(
    "ace/mode/behaviour/xml",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/behaviour", "ace/token_iterator"],
    function (e, t, n) {
      function o(e, t) {
        return e.type.lastIndexOf(t + ".xml") > -1;
      }
      var r = e("../../lib/oop"),
        i = e("../behaviour").Behaviour,
        s = e("../../token_iterator").TokenIterator,
        u = function () {
          this.add("string_dquotes", "insertion", function (e, t, n, r, i) {
            if (i == '"' || i == "'") {
              var u = i,
                a = r.doc.getTextRange(n.getSelectionRange());
              if (a !== "" && a !== "'" && a != '"' && n.getWrapBehavioursEnabled())
                return { text: u + a + u, selection: !1 };
              var f = n.getCursorPosition(),
                l = r.doc.getLine(f.row),
                c = l.substring(f.column, f.column + 1),
                h = new s(r, f.row, f.column),
                p = h.getCurrentToken();
              if (c == u && (o(p, "attribute-value") || o(p, "string"))) return { text: "", selection: [1, 1] };
              p || (p = h.stepBackward());
              if (!p) return;
              while (o(p, "tag-whitespace") || o(p, "whitespace")) p = h.stepBackward();
              var d = !c || c.match(/\s/);
              if ((o(p, "attribute-equals") && (d || c == ">")) || (o(p, "decl-attribute-equals") && (d || c == "?")))
                return { text: u + u, selection: [1, 1] };
            }
          }),
            this.add("string_dquotes", "deletion", function (e, t, n, r, i) {
              var s = r.doc.getTextRange(i);
              if (!i.isMultiLine() && (s == '"' || s == "'")) {
                var o = r.doc.getLine(i.start.row),
                  u = o.substring(i.start.column + 1, i.start.column + 2);
                if (u == s) return i.end.column++, i;
              }
            }),
            this.add("autoclosing", "insertion", function (e, t, n, r, i) {
              if (i == ">") {
                var u = n.getCursorPosition(),
                  a = new s(r, u.row, u.column),
                  f = a.getCurrentToken() || a.stepBackward();
                if (
                  !f ||
                  !(
                    o(f, "tag-name") ||
                    o(f, "tag-whitespace") ||
                    o(f, "attribute-name") ||
                    o(f, "attribute-equals") ||
                    o(f, "attribute-value")
                  )
                )
                  return;
                if (o(f, "reference.attribute-value")) return;
                if (o(f, "attribute-value")) {
                  var l = f.value.charAt(0);
                  if (l == '"' || l == "'") {
                    var c = f.value.charAt(f.value.length - 1),
                      h = a.getCurrentTokenColumn() + f.value.length;
                    if (h > u.column || (h == u.column && l != c)) return;
                  }
                }
                while (!o(f, "tag-name")) f = a.stepBackward();
                var p = a.getCurrentTokenRow(),
                  d = a.getCurrentTokenColumn();
                if (o(a.stepBackward(), "end-tag-open")) return;
                var v = f.value;
                p == u.row && (v = v.substring(0, u.column - d));
                if (this.voidElements.hasOwnProperty(v.toLowerCase())) return;
                return { text: "></" + v + ">", selection: [1, 1] };
              }
            }),
            this.add("autoindent", "insertion", function (e, t, n, r, i) {
              if (i == "\n") {
                var s = n.getCursorPosition(),
                  o = r.getLine(s.row),
                  u = o.substring(s.column, s.column + 2);
                if (u == "</") {
                  var a = this.$getIndent(o),
                    f = a + r.getTabString();
                  return { text: "\n" + f + "\n" + a, selection: [1, f.length, 1, f.length] };
                }
              }
            });
        };
      r.inherits(u, i), (t.XmlBehaviour = u);
    }
  ),
  define(
    "ace/mode/folding/cstyle",
    ["require", "exports", "module", "ace/lib/oop", "ace/range", "ace/mode/folding/fold_mode"],
    function (e, t, n) {
      var r = e("../../lib/oop"),
        i = e("../../range").Range,
        s = e("./fold_mode").FoldMode,
        o = (t.FoldMode = function (e) {
          e &&
            ((this.foldingStartMarker = new RegExp(this.foldingStartMarker.source.replace(/\|[^|]*?$/, "|" + e.start))),
            (this.foldingStopMarker = new RegExp(this.foldingStopMarker.source.replace(/\|[^|]*?$/, "|" + e.end))));
        });
      r.inherits(o, s),
        function () {
          (this.foldingStartMarker = /(\{|\[)[^\}\]]*$|^\s*(\/\*)/),
            (this.foldingStopMarker = /^[^\[\{]*(\}|\])|^[\s\*]*(\*\/)/),
            (this.getFoldWidgetRange = function (e, t, n, r) {
              var i = e.getLine(n),
                s = i.match(this.foldingStartMarker);
              if (s) {
                var o = s.index;
                if (s[1]) return this.openingBracketBlock(e, s[1], n, o);
                var u = e.getCommentFoldRange(n, o + s[0].length, 1);
                return u && !u.isMultiLine() && (r ? (u = this.getSectionRange(e, n)) : t != "all" && (u = null)), u;
              }
              if (t === "markbegin") return;
              var s = i.match(this.foldingStopMarker);
              if (s) {
                var o = s.index + s[0].length;
                return s[1] ? this.closingBracketBlock(e, s[1], n, o) : e.getCommentFoldRange(n, o, -1);
              }
            }),
            (this.getSectionRange = function (e, t) {
              var n = e.getLine(t),
                r = n.search(/\S/),
                s = t,
                o = n.length;
              t += 1;
              var u = t,
                a = e.getLength();
              while (++t < a) {
                n = e.getLine(t);
                var f = n.search(/\S/);
                if (f === -1) continue;
                if (r > f) break;
                var l = this.getFoldWidgetRange(e, "all", t);
                if (l) {
                  if (l.start.row <= s) break;
                  if (l.isMultiLine()) t = l.end.row;
                  else if (r == f) break;
                }
                u = t;
              }
              return new i(s, o, u, e.getLine(u).length);
            });
        }.call(o.prototype);
    }
  ),
  define("ace/mode/xquery/xquery_lexer", ["require", "exports", "module"], function (e, t, n) {
    n.exports = (function r(t, n, i) {
      function s(u, a) {
        if (!n[u]) {
          if (!t[u]) {
            var f = typeof e == "function" && e;
            if (!a && f) return f(u, !0);
            if (o) return o(u, !0);
            throw new Error("Cannot find module '" + u + "'");
          }
          var l = (n[u] = { exports: {} });
          t[u][0].call(
            l.exports,
            function (e) {
              var n = t[u][1][e];
              return s(n ? n : e);
            },
            l,
            l.exports,
            r,
            t,
            n,
            i
          );
        }
        return n[u].exports;
      }
      var o = typeof e == "function" && e;
      for (var u = 0; u < i.length; u++) s(i[u]);
      return s;
    })(
      {
        1: [
          function (e, t, n) {
            var r = (n.XQueryTokenizer = function i(e, t) {
              function r(e, t) {
                (E = t), (S = e), (x = e.length), s(0, 0, 0);
              }
              function s(e, t, n) {
                (m = t), (g = t), (y = e), (b = t), (w = n), (N = n), E.reset(S);
              }
              function o() {
                E.startNonterminal("EQName", g);
                switch (y) {
                  case 77:
                    f(77);
                    break;
                  case 91:
                    f(91);
                    break;
                  case 115:
                    f(115);
                    break;
                  case 116:
                    f(116);
                    break;
                  case 119:
                    f(119);
                    break;
                  case 140:
                    f(140);
                    break;
                  case 147:
                    f(147);
                    break;
                  case 160:
                    f(160);
                    break;
                  case 180:
                    f(180);
                    break;
                  case 186:
                    f(186);
                    break;
                  case 211:
                    f(211);
                    break;
                  case 221:
                    f(221);
                    break;
                  case 222:
                    f(222);
                    break;
                  case 238:
                    f(238);
                    break;
                  case 239:
                    f(239);
                    break;
                  case 248:
                    f(248);
                    break;
                  default:
                    u();
                }
                E.endNonterminal("EQName", g);
              }
              function u() {
                E.startNonterminal("FunctionName", g);
                switch (y) {
                  case 14:
                    f(14);
                    break;
                  case 65:
                    f(65);
                    break;
                  case 68:
                    f(68);
                    break;
                  case 69:
                    f(69);
                    break;
                  case 70:
                    f(70);
                    break;
                  case 74:
                    f(74);
                    break;
                  case 75:
                    f(75);
                    break;
                  case 79:
                    f(79);
                    break;
                  case 83:
                    f(83);
                    break;
                  case 84:
                    f(84);
                    break;
                  case 85:
                    f(85);
                    break;
                  case 88:
                    f(88);
                    break;
                  case 89:
                    f(89);
                    break;
                  case 98:
                    f(98);
                    break;
                  case 100:
                    f(100);
                    break;
                  case 103:
                    f(103);
                    break;
                  case 104:
                    f(104);
                    break;
                  case 105:
                    f(105);
                    break;
                  case 106:
                    f(106);
                    break;
                  case 107:
                    f(107);
                    break;
                  case 108:
                    f(108);
                    break;
                  case 113:
                    f(113);
                    break;
                  case 114:
                    f(114);
                    break;
                  case 117:
                    f(117);
                    break;
                  case 118:
                    f(118);
                    break;
                  case 121:
                    f(121);
                    break;
                  case 123:
                    f(123);
                    break;
                  case 124:
                    f(124);
                    break;
                  case 126:
                    f(126);
                    break;
                  case 129:
                    f(129);
                    break;
                  case 130:
                    f(130);
                    break;
                  case 131:
                    f(131);
                    break;
                  case 132:
                    f(132);
                    break;
                  case 141:
                    f(141);
                    break;
                  case 143:
                    f(143);
                    break;
                  case 145:
                    f(145);
                    break;
                  case 146:
                    f(146);
                    break;
                  case 148:
                    f(148);
                    break;
                  case 154:
                    f(154);
                    break;
                  case 155:
                    f(155);
                    break;
                  case 157:
                    f(157);
                    break;
                  case 158:
                    f(158);
                    break;
                  case 159:
                    f(159);
                    break;
                  case 165:
                    f(165);
                    break;
                  case 167:
                    f(167);
                    break;
                  case 169:
                    f(169);
                    break;
                  case 173:
                    f(173);
                    break;
                  case 175:
                    f(175);
                    break;
                  case 176:
                    f(176);
                    break;
                  case 177:
                    f(177);
                    break;
                  case 179:
                    f(179);
                    break;
                  case 181:
                    f(181);
                    break;
                  case 193:
                    f(193);
                    break;
                  case 195:
                    f(195);
                    break;
                  case 196:
                    f(196);
                    break;
                  case 197:
                    f(197);
                    break;
                  case 201:
                    f(201);
                    break;
                  case 207:
                    f(207);
                    break;
                  case 208:
                    f(208);
                    break;
                  case 213:
                    f(213);
                    break;
                  case 214:
                    f(214);
                    break;
                  case 215:
                    f(215);
                    break;
                  case 219:
                    f(219);
                    break;
                  case 224:
                    f(224);
                    break;
                  case 230:
                    f(230);
                    break;
                  case 231:
                    f(231);
                    break;
                  case 232:
                    f(232);
                    break;
                  case 243:
                    f(243);
                    break;
                  case 244:
                    f(244);
                    break;
                  case 245:
                    f(245);
                    break;
                  case 249:
                    f(249);
                    break;
                  case 251:
                    f(251);
                    break;
                  case 255:
                    f(255);
                    break;
                  case 261:
                    f(261);
                    break;
                  case 265:
                    f(265);
                    break;
                  case 269:
                    f(269);
                    break;
                  case 67:
                    f(67);
                    break;
                  case 76:
                    f(76);
                    break;
                  case 78:
                    f(78);
                    break;
                  case 80:
                    f(80);
                    break;
                  case 81:
                    f(81);
                    break;
                  case 86:
                    f(86);
                    break;
                  case 93:
                    f(93);
                    break;
                  case 96:
                    f(96);
                    break;
                  case 97:
                    f(97);
                    break;
                  case 99:
                    f(99);
                    break;
                  case 101:
                    f(101);
                    break;
                  case 120:
                    f(120);
                    break;
                  case 127:
                    f(127);
                    break;
                  case 128:
                    f(128);
                    break;
                  case 136:
                    f(136);
                    break;
                  case 149:
                    f(149);
                    break;
                  case 150:
                    f(150);
                    break;
                  case 156:
                    f(156);
                    break;
                  case 166:
                    f(166);
                    break;
                  case 187:
                    f(187);
                    break;
                  case 194:
                    f(194);
                    break;
                  case 198:
                    f(198);
                    break;
                  case 217:
                    f(217);
                    break;
                  case 220:
                    f(220);
                    break;
                  case 223:
                    f(223);
                    break;
                  case 229:
                    f(229);
                    break;
                  case 235:
                    f(235);
                    break;
                  case 246:
                    f(246);
                    break;
                  case 247:
                    f(247);
                    break;
                  case 252:
                    f(252);
                    break;
                  case 256:
                    f(256);
                    break;
                  case 257:
                    f(257);
                    break;
                  case 258:
                    f(258);
                    break;
                  case 262:
                    f(262);
                    break;
                  case 92:
                    f(92);
                    break;
                  case 171:
                    f(171);
                    break;
                  default:
                    f(216);
                }
                E.endNonterminal("FunctionName", g);
              }
              function a() {
                E.startNonterminal("NCName", g);
                switch (y) {
                  case 26:
                    f(26);
                    break;
                  case 65:
                    f(65);
                    break;
                  case 70:
                    f(70);
                    break;
                  case 74:
                    f(74);
                    break;
                  case 75:
                    f(75);
                    break;
                  case 79:
                    f(79);
                    break;
                  case 83:
                    f(83);
                    break;
                  case 84:
                    f(84);
                    break;
                  case 85:
                    f(85);
                    break;
                  case 89:
                    f(89);
                    break;
                  case 100:
                    f(100);
                    break;
                  case 104:
                    f(104);
                    break;
                  case 108:
                    f(108);
                    break;
                  case 113:
                    f(113);
                    break;
                  case 117:
                    f(117);
                    break;
                  case 118:
                    f(118);
                    break;
                  case 121:
                    f(121);
                    break;
                  case 123:
                    f(123);
                    break;
                  case 126:
                    f(126);
                    break;
                  case 132:
                    f(132);
                    break;
                  case 141:
                    f(141);
                    break;
                  case 143:
                    f(143);
                    break;
                  case 145:
                    f(145);
                    break;
                  case 146:
                    f(146);
                    break;
                  case 155:
                    f(155);
                    break;
                  case 157:
                    f(157);
                    break;
                  case 158:
                    f(158);
                    break;
                  case 159:
                    f(159);
                    break;
                  case 167:
                    f(167);
                    break;
                  case 169:
                    f(169);
                    break;
                  case 173:
                    f(173);
                    break;
                  case 175:
                    f(175);
                    break;
                  case 176:
                    f(176);
                    break;
                  case 181:
                    f(181);
                    break;
                  case 193:
                    f(193);
                    break;
                  case 195:
                    f(195);
                    break;
                  case 196:
                    f(196);
                    break;
                  case 215:
                    f(215);
                    break;
                  case 219:
                    f(219);
                    break;
                  case 231:
                    f(231);
                    break;
                  case 232:
                    f(232);
                    break;
                  case 243:
                    f(243);
                    break;
                  case 244:
                    f(244);
                    break;
                  case 249:
                    f(249);
                    break;
                  case 261:
                    f(261);
                    break;
                  case 265:
                    f(265);
                    break;
                  case 68:
                    f(68);
                    break;
                  case 69:
                    f(69);
                    break;
                  case 77:
                    f(77);
                    break;
                  case 88:
                    f(88);
                    break;
                  case 91:
                    f(91);
                    break;
                  case 98:
                    f(98);
                    break;
                  case 103:
                    f(103);
                    break;
                  case 105:
                    f(105);
                    break;
                  case 106:
                    f(106);
                    break;
                  case 107:
                    f(107);
                    break;
                  case 114:
                    f(114);
                    break;
                  case 115:
                    f(115);
                    break;
                  case 116:
                    f(116);
                    break;
                  case 119:
                    f(119);
                    break;
                  case 124:
                    f(124);
                    break;
                  case 129:
                    f(129);
                    break;
                  case 130:
                    f(130);
                    break;
                  case 131:
                    f(131);
                    break;
                  case 140:
                    f(140);
                    break;
                  case 147:
                    f(147);
                    break;
                  case 148:
                    f(148);
                    break;
                  case 154:
                    f(154);
                    break;
                  case 160:
                    f(160);
                    break;
                  case 165:
                    f(165);
                    break;
                  case 177:
                    f(177);
                    break;
                  case 179:
                    f(179);
                    break;
                  case 180:
                    f(180);
                    break;
                  case 186:
                    f(186);
                    break;
                  case 197:
                    f(197);
                    break;
                  case 201:
                    f(201);
                    break;
                  case 207:
                    f(207);
                    break;
                  case 208:
                    f(208);
                    break;
                  case 211:
                    f(211);
                    break;
                  case 213:
                    f(213);
                    break;
                  case 214:
                    f(214);
                    break;
                  case 221:
                    f(221);
                    break;
                  case 222:
                    f(222);
                    break;
                  case 224:
                    f(224);
                    break;
                  case 230:
                    f(230);
                    break;
                  case 238:
                    f(238);
                    break;
                  case 239:
                    f(239);
                    break;
                  case 245:
                    f(245);
                    break;
                  case 248:
                    f(248);
                    break;
                  case 251:
                    f(251);
                    break;
                  case 255:
                    f(255);
                    break;
                  case 257:
                    f(257);
                    break;
                  case 269:
                    f(269);
                    break;
                  case 67:
                    f(67);
                    break;
                  case 76:
                    f(76);
                    break;
                  case 78:
                    f(78);
                    break;
                  case 80:
                    f(80);
                    break;
                  case 81:
                    f(81);
                    break;
                  case 86:
                    f(86);
                    break;
                  case 93:
                    f(93);
                    break;
                  case 96:
                    f(96);
                    break;
                  case 97:
                    f(97);
                    break;
                  case 99:
                    f(99);
                    break;
                  case 101:
                    f(101);
                    break;
                  case 120:
                    f(120);
                    break;
                  case 127:
                    f(127);
                    break;
                  case 128:
                    f(128);
                    break;
                  case 136:
                    f(136);
                    break;
                  case 149:
                    f(149);
                    break;
                  case 150:
                    f(150);
                    break;
                  case 156:
                    f(156);
                    break;
                  case 166:
                    f(166);
                    break;
                  case 187:
                    f(187);
                    break;
                  case 194:
                    f(194);
                    break;
                  case 198:
                    f(198);
                    break;
                  case 217:
                    f(217);
                    break;
                  case 220:
                    f(220);
                    break;
                  case 223:
                    f(223);
                    break;
                  case 229:
                    f(229);
                    break;
                  case 235:
                    f(235);
                    break;
                  case 246:
                    f(246);
                    break;
                  case 247:
                    f(247);
                    break;
                  case 252:
                    f(252);
                    break;
                  case 256:
                    f(256);
                    break;
                  case 258:
                    f(258);
                    break;
                  case 262:
                    f(262);
                    break;
                  case 92:
                    f(92);
                    break;
                  case 171:
                    f(171);
                    break;
                  default:
                    f(216);
                }
                E.endNonterminal("NCName", g);
              }
              function f(e) {
                y == e ? (l(), E.terminal(i.TOKEN[y], b, w > x ? x : w), (m = b), (g = w), (y = 0)) : d(b, w, 0, y, e);
              }
              function l() {
                g != b && ((m = g), (g = b), E.whitespace(m, g));
              }
              function c(e) {
                var t;
                for (;;) {
                  t = C(e);
                  if (t != 28) break;
                }
                return t;
              }
              function h(e) {
                y == 0 && ((y = c(e)), (b = T), (w = N));
              }
              function p(e) {
                y == 0 && ((y = C(e)), (b = T), (w = N));
              }
              function d(e, t, r, i, s) {
                throw new n.ParseException(e, t, r, i, s);
              }
              function C(e) {
                var t = !1;
                T = N;
                var n = N,
                  r = i.INITIAL[e],
                  s = 0;
                for (var o = r & 4095; o != 0; ) {
                  var u,
                    a = n < x ? S.charCodeAt(n) : 0;
                  ++n;
                  if (a < 128) u = i.MAP0[a];
                  else if (a < 55296) {
                    var f = a >> 4;
                    u = i.MAP1[(a & 15) + i.MAP1[(f & 31) + i.MAP1[f >> 5]]];
                  } else {
                    if (a < 56320) {
                      var f = n < x ? S.charCodeAt(n) : 0;
                      f >= 56320 && f < 57344 && (++n, (a = ((a & 1023) << 10) + (f & 1023) + 65536), (t = !0));
                    }
                    var l = 0,
                      c = 5;
                    for (var h = 3; ; h = (c + l) >> 1) {
                      if (i.MAP2[h] > a) c = h - 1;
                      else {
                        if (!(i.MAP2[6 + h] < a)) {
                          u = i.MAP2[12 + h];
                          break;
                        }
                        l = h + 1;
                      }
                      if (l > c) {
                        u = 0;
                        break;
                      }
                    }
                  }
                  s = o;
                  var p = (u << 12) + o - 1;
                  (o = i.TRANSITION[(p & 15) + i.TRANSITION[p >> 4]]), o > 4095 && ((r = o), (o &= 4095), (N = n));
                }
                r >>= 12;
                if (r == 0) {
                  N = n - 1;
                  var f = N < x ? S.charCodeAt(N) : 0;
                  return f >= 56320 && f < 57344 && --N, d(T, N, s, -1, -1);
                }
                if (t)
                  for (var v = r >> 9; v > 0; --v) {
                    --N;
                    var f = N < x ? S.charCodeAt(N) : 0;
                    f >= 56320 && f < 57344 && --N;
                  }
                else N -= r >> 9;
                return (r & 511) - 1;
              }
              r(e, t);
              var n = this;
              (this.ParseException = function (e, t, n, r, i) {
                var s = e,
                  o = t,
                  u = n,
                  a = r,
                  f = i;
                (this.getBegin = function () {
                  return s;
                }),
                  (this.getEnd = function () {
                    return o;
                  }),
                  (this.getState = function () {
                    return u;
                  }),
                  (this.getExpected = function () {
                    return f;
                  }),
                  (this.getOffending = function () {
                    return a;
                  }),
                  (this.getMessage = function () {
                    return a < 0 ? "lexical analysis failed" : "syntax error";
                  });
              }),
                (this.getInput = function () {
                  return S;
                }),
                (this.getOffendingToken = function (e) {
                  var t = e.getOffending();
                  return t >= 0 ? i.TOKEN[t] : null;
                }),
                (this.getExpectedTokenSet = function (e) {
                  var t;
                  return e.getExpected() < 0 ? (t = i.getTokenSet(-e.getState())) : (t = [i.TOKEN[e.getExpected()]]), t;
                }),
                (this.getErrorMessage = function (e) {
                  var t = this.getExpectedTokenSet(e),
                    n = this.getOffendingToken(e),
                    r = S.substring(0, e.getBegin()),
                    i = r.split("\n"),
                    s = i.length,
                    o = i[s - 1].length + 1,
                    u = e.getEnd() - e.getBegin();
                  return (
                    e.getMessage() +
                    (n == null ? "" : ", found " + n) +
                    "\nwhile expecting " +
                    (t.length == 1 ? t[0] : "[" + t.join(", ") + "]") +
                    "\n" +
                    (u == 0 || n != null ? "" : "after successfully scanning " + u + " characters beginning ") +
                    "at line " +
                    s +
                    ", column " +
                    o +
                    ":\n..." +
                    S.substring(e.getBegin(), Math.min(S.length, e.getBegin() + 64)) +
                    "..."
                  );
                }),
                (this.parse_start = function () {
                  E.startNonterminal("start", g), h(14);
                  switch (y) {
                    case 55:
                      f(55);
                      break;
                    case 54:
                      f(54);
                      break;
                    case 56:
                      f(56);
                      break;
                    case 40:
                      f(40);
                      break;
                    case 42:
                      f(42);
                      break;
                    case 41:
                      f(41);
                      break;
                    case 35:
                      f(35);
                      break;
                    case 38:
                      f(38);
                      break;
                    case 274:
                      f(274);
                      break;
                    case 271:
                      f(271);
                      break;
                    case 39:
                      f(39);
                      break;
                    case 43:
                      f(43);
                      break;
                    case 49:
                      f(49);
                      break;
                    case 62:
                      f(62);
                      break;
                    case 63:
                      f(63);
                      break;
                    case 46:
                      f(46);
                      break;
                    case 48:
                      f(48);
                      break;
                    case 53:
                      f(53);
                      break;
                    case 51:
                      f(51);
                      break;
                    case 34:
                      f(34);
                      break;
                    case 273:
                      f(273);
                      break;
                    case 2:
                      f(2);
                      break;
                    case 1:
                      f(1);
                      break;
                    case 3:
                      f(3);
                      break;
                    case 12:
                      f(12);
                      break;
                    case 13:
                      f(13);
                      break;
                    case 15:
                      f(15);
                      break;
                    case 16:
                      f(16);
                      break;
                    case 17:
                      f(17);
                      break;
                    case 5:
                      f(5);
                      break;
                    case 6:
                      f(6);
                      break;
                    case 4:
                      f(4);
                      break;
                    case 33:
                      f(33);
                      break;
                    default:
                      o();
                  }
                  E.endNonterminal("start", g);
                }),
                (this.parse_StartTag = function () {
                  E.startNonterminal("StartTag", g), h(8);
                  switch (y) {
                    case 58:
                      f(58);
                      break;
                    case 50:
                      f(50);
                      break;
                    case 27:
                      f(27);
                      break;
                    case 57:
                      f(57);
                      break;
                    case 35:
                      f(35);
                      break;
                    case 38:
                      f(38);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("StartTag", g);
                }),
                (this.parse_TagContent = function () {
                  E.startNonterminal("TagContent", g), p(11);
                  switch (y) {
                    case 23:
                      f(23);
                      break;
                    case 6:
                      f(6);
                      break;
                    case 7:
                      f(7);
                      break;
                    case 55:
                      f(55);
                      break;
                    case 54:
                      f(54);
                      break;
                    case 18:
                      f(18);
                      break;
                    case 29:
                      f(29);
                      break;
                    case 272:
                      f(272);
                      break;
                    case 275:
                      f(275);
                      break;
                    case 271:
                      f(271);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("TagContent", g);
                }),
                (this.parse_AposAttr = function () {
                  E.startNonterminal("AposAttr", g), p(10);
                  switch (y) {
                    case 20:
                      f(20);
                      break;
                    case 25:
                      f(25);
                      break;
                    case 18:
                      f(18);
                      break;
                    case 29:
                      f(29);
                      break;
                    case 272:
                      f(272);
                      break;
                    case 275:
                      f(275);
                      break;
                    case 271:
                      f(271);
                      break;
                    case 38:
                      f(38);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("AposAttr", g);
                }),
                (this.parse_QuotAttr = function () {
                  E.startNonterminal("QuotAttr", g), p(9);
                  switch (y) {
                    case 19:
                      f(19);
                      break;
                    case 24:
                      f(24);
                      break;
                    case 18:
                      f(18);
                      break;
                    case 29:
                      f(29);
                      break;
                    case 272:
                      f(272);
                      break;
                    case 275:
                      f(275);
                      break;
                    case 271:
                      f(271);
                      break;
                    case 35:
                      f(35);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("QuotAttr", g);
                }),
                (this.parse_CData = function () {
                  E.startNonterminal("CData", g), p(1);
                  switch (y) {
                    case 11:
                      f(11);
                      break;
                    case 64:
                      f(64);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("CData", g);
                }),
                (this.parse_XMLComment = function () {
                  E.startNonterminal("XMLComment", g), p(0);
                  switch (y) {
                    case 9:
                      f(9);
                      break;
                    case 47:
                      f(47);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("XMLComment", g);
                }),
                (this.parse_PI = function () {
                  E.startNonterminal("PI", g), p(3);
                  switch (y) {
                    case 10:
                      f(10);
                      break;
                    case 59:
                      f(59);
                      break;
                    case 60:
                      f(60);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("PI", g);
                }),
                (this.parse_Pragma = function () {
                  E.startNonterminal("Pragma", g), p(2);
                  switch (y) {
                    case 8:
                      f(8);
                      break;
                    case 36:
                      f(36);
                      break;
                    case 37:
                      f(37);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("Pragma", g);
                }),
                (this.parse_Comment = function () {
                  E.startNonterminal("Comment", g), p(4);
                  switch (y) {
                    case 52:
                      f(52);
                      break;
                    case 41:
                      f(41);
                      break;
                    case 30:
                      f(30);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("Comment", g);
                }),
                (this.parse_CommentDoc = function () {
                  E.startNonterminal("CommentDoc", g), p(5);
                  switch (y) {
                    case 31:
                      f(31);
                      break;
                    case 32:
                      f(32);
                      break;
                    case 52:
                      f(52);
                      break;
                    case 41:
                      f(41);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("CommentDoc", g);
                }),
                (this.parse_QuotString = function () {
                  E.startNonterminal("QuotString", g), p(6);
                  switch (y) {
                    case 18:
                      f(18);
                      break;
                    case 29:
                      f(29);
                      break;
                    case 19:
                      f(19);
                      break;
                    case 21:
                      f(21);
                      break;
                    case 35:
                      f(35);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("QuotString", g);
                }),
                (this.parse_AposString = function () {
                  E.startNonterminal("AposString", g), p(7);
                  switch (y) {
                    case 18:
                      f(18);
                      break;
                    case 29:
                      f(29);
                      break;
                    case 20:
                      f(20);
                      break;
                    case 22:
                      f(22);
                      break;
                    case 38:
                      f(38);
                      break;
                    default:
                      f(33);
                  }
                  E.endNonterminal("AposString", g);
                }),
                (this.parse_Prefix = function () {
                  E.startNonterminal("Prefix", g), h(13), l(), a(), E.endNonterminal("Prefix", g);
                }),
                (this.parse__EQName = function () {
                  E.startNonterminal("_EQName", g), h(12), l(), o(), E.endNonterminal("_EQName", g);
                });
              var v, m, g, y, b, w, E, S, x, T, N;
            });
            (r.getTokenSet = function (e) {
              var t = [],
                n = e < 0 ? -e : INITIAL[e] & 4095;
              for (var i = 0; i < 276; i += 32) {
                var s = i,
                  o = (i >> 5) * 2062 + n - 1,
                  u = o >> 2,
                  a = u >> 2,
                  f = r.EXPECTED[(o & 3) + r.EXPECTED[(u & 3) + r.EXPECTED[(a & 3) + r.EXPECTED[a >> 2]]]];
                for (; f != 0; f >>>= 1, ++s) (f & 1) != 0 && t.push(r.TOKEN[s]);
              }
              return t;
            }),
              (r.MAP0 = [
                66, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3,
                4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 20, 21,
                22, 23, 24, 25, 26, 27, 28, 29, 30, 27, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 31, 31, 33, 31, 31,
                31, 31, 31, 31, 34, 35, 36, 35, 31, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 31, 46, 47, 48, 49, 50, 51,
                52, 53, 54, 55, 56, 57, 58, 59, 60, 31, 61, 62, 63, 64, 35,
              ]),
              (r.MAP1 = [
                108, 124, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 156, 181, 181, 181, 181,
                181, 214, 215, 213, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
                214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
                214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
                214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214, 214,
                214, 214, 214, 247, 261, 277, 293, 309, 347, 363, 379, 416, 416, 416, 408, 331, 323, 331, 323, 331, 331,
                331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 433, 433, 433, 433, 433, 433, 433,
                316, 331, 331, 331, 331, 331, 331, 331, 331, 394, 416, 416, 417, 415, 416, 416, 331, 331, 331, 331, 331,
                331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 416, 416, 416, 416, 416, 416, 416, 416,
                416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416, 416,
                416, 416, 416, 330, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331,
                331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 331, 416, 66, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
                13, 14, 15, 16, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
                30, 27, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 35, 31, 31, 31, 31, 31, 31, 31, 31, 31,
                31, 31, 31, 31, 31, 31, 31, 31, 32, 31, 31, 33, 31, 31, 31, 31, 31, 31, 34, 35, 36, 35, 31, 35, 37, 38,
                39, 40, 41, 42, 43, 44, 45, 31, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 31, 61, 62,
                63, 64, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 31, 31, 35, 35, 35, 35, 35, 35, 35, 65, 35, 35,
                35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65, 65,
                65, 65, 65, 65, 65,
              ]),
              (r.MAP2 = [
                57344, 63744, 64976, 65008, 65536, 983040, 63743, 64975, 65007, 65533, 983039, 1114111, 35, 31, 35, 31,
                31, 35,
              ]),
              (r.INITIAL = [1, 2, 36867, 45060, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
              (r.TRANSITION = [
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 22908, 18836, 17152, 19008, 19233, 20367, 19008, 17173, 30763, 36437, 17330, 17349, 18921, 17189,
                17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 17365, 21880, 18649, 18665, 19006, 17265, 22033,
                20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 17470, 17497, 17520, 17251,
                36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 18157, 21940,
                17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531,
                17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 17848, 17880, 18731, 17918, 36551,
                17292, 17934, 17979, 18727, 18023, 36545, 18621, 18039, 18056, 18072, 18117, 18143, 18173, 18052, 18209,
                18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816,
                32961, 17687, 18805, 18421, 18437, 18101, 17393, 18489, 18505, 18535, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 18579, 21711, 17152, 19008, 19233, 20367, 19008, 28684, 30763, 36437, 17330, 17349, 18921,
                17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 17365, 21880, 18649, 18665, 19006, 17265,
                22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 17470, 17497, 17520,
                17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 18157,
                21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223,
                36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 17848, 17880, 18731, 17918,
                36551, 17292, 17934, 17979, 18727, 18023, 36545, 18621, 18039, 18056, 18072, 18117, 18143, 18173, 18052,
                18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392,
                17816, 32961, 17687, 18805, 18421, 18437, 18101, 17393, 18489, 18505, 18535, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 20116, 18836, 18637, 19008, 19233, 21267, 19008, 17173, 30763, 36437, 17330, 17349,
                18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006,
                17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952, 17497,
                17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418,
                21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473,
                18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731,
                17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706,
                18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642,
                18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 18763, 18778, 18794, 19008, 19233, 20367, 19008, 17173, 30763, 36437, 17330,
                17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665,
                19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952,
                17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258,
                36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617,
                36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864,
                18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143,
                18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163,
                30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 18821, 22923, 18906, 19008, 19233, 17431, 19008, 17173, 30763, 36437,
                17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18937, 21880, 18649,
                18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 19054, 17311, 18658, 18999, 19008, 17447,
                32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 18953, 21887, 17504, 17527,
                17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946,
                17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156,
                17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117,
                18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796,
                17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 21843, 18836, 18987, 19008, 19233, 20367, 19008, 17173, 30763,
                36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880,
                18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008,
                17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504,
                17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737,
                21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481,
                19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072,
                18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232,
                17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 21696, 18836, 18987, 19008, 19233, 20367, 19008, 17173,
                30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452,
                21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999,
                19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887,
                17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730,
                34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620,
                17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056,
                18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403,
                19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505,
                18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22429, 20131, 18720, 19008, 19233, 20367, 19008,
                17173, 23559, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 18087, 17308, 17327, 17346, 18918,
                18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 21242, 19111, 17311, 18658,
                18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585,
                21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176,
                17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590,
                21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039,
                18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807,
                36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747,
                18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 19024, 18836, 18609, 19008, 19233, 20367,
                19008, 17173, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346,
                18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311,
                18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559,
                17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703,
                21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832,
                17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621,
                18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376,
                17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393,
                18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 19081, 22444, 18987, 19008, 19233,
                20367, 19008, 19065, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327,
                17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873,
                17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543,
                17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190,
                17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753,
                17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405,
                18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312,
                18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519,
                17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 21992, 22007, 18987, 19008,
                19233, 20367, 19008, 18690, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308,
                17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127,
                21873, 17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326,
                17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661,
                21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675,
                17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681,
                18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296,
                18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437,
                18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22414, 18836, 18987,
                19008, 19233, 30651, 19008, 17173, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 19138,
                17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192,
                18127, 19280, 17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714,
                18326, 17543, 17559, 19172, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633,
                17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892,
                17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727,
                18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963,
                18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421,
                18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 21783, 18836,
                18987, 19008, 19233, 20367, 19008, 17173, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355,
                19218, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535,
                17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682,
                17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217,
                17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860,
                17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979,
                18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266,
                17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805,
                18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 21651,
                18836, 18987, 19008, 19233, 20367, 19008, 17173, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281,
                20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421,
                20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782,
                20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467,
                18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152,
                17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934,
                17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239,
                18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645,
                18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                19249, 19265, 19307, 18888, 27857, 30536, 24401, 31444, 23357, 18888, 19351, 18888, 18890, 27211, 19370,
                27211, 27211, 19392, 24401, 31911, 24401, 24401, 25467, 18888, 18888, 18888, 18888, 18888, 25783, 27211,
                27211, 27211, 27211, 28537, 19440, 24401, 24401, 24401, 24401, 24036, 17994, 24060, 18888, 18888, 18888,
                18890, 19468, 27211, 27211, 27211, 27211, 19484, 35367, 19520, 24401, 24401, 24401, 19628, 18888, 29855,
                18888, 18888, 23086, 27211, 19538, 27211, 27211, 30756, 24012, 24401, 19560, 24401, 24401, 26750, 18888,
                18888, 19327, 27855, 27211, 27211, 19580, 17590, 24017, 24401, 24401, 19600, 25665, 18888, 18888, 28518,
                27211, 27212, 24016, 19620, 19868, 28435, 25722, 18889, 19644, 27211, 32888, 35852, 19868, 31018, 19694,
                19376, 19717, 22215, 19735, 22098, 19751, 35203, 19776, 19797, 19817, 19840, 25783, 31738, 24135, 19701,
                19856, 31015, 23516, 31008, 28311, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 21768, 18836, 19307, 18888, 27857, 27904, 24401, 29183, 28015, 18888, 18888, 18888, 18890, 27211,
                27211, 27211, 27211, 19888, 24401, 24401, 24401, 24401, 22953, 18888, 18888, 18888, 18888, 18888, 25783,
                27211, 27211, 27211, 27211, 28537, 19440, 24401, 24401, 24401, 24401, 24036, 18881, 18888, 18888, 18888,
                18888, 18890, 27211, 27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 19628, 18888,
                18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756, 24012, 24401, 24401, 24401, 24401, 26750,
                18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888, 18888,
                27211, 27211, 27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018,
                18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837,
                25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 22399, 18836, 19918, 19008, 19233, 20367, 19008, 17173, 30763, 36437, 17330, 17349, 18921,
                17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265,
                22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520,
                17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915,
                21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223,
                36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918,
                36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052,
                18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392,
                17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 21666, 18836, 19307, 18888, 27857, 27525, 24401, 29183, 21467, 18888, 18888, 18888,
                18890, 27211, 27211, 27211, 27211, 19946, 24401, 24401, 24401, 24401, 32382, 18888, 18888, 18888, 18888,
                18888, 25783, 27211, 27211, 27211, 27211, 28537, 19998, 24401, 24401, 24401, 24401, 31500, 18467, 18888,
                18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 27211, 20021, 24401, 24401, 24401, 24401, 24401,
                34271, 18888, 18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 32926, 29908, 24401, 24401, 24401,
                24401, 26095, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 20050, 22968, 24401, 24401, 24401, 18887,
                18888, 18888, 27211, 27211, 35779, 20080, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889,
                19868, 31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783,
                31738, 19837, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 20101, 19039, 20191, 20412, 20903, 17569, 20309, 20872, 25633, 20623, 20505,
                20218, 20242, 17189, 17208, 17281, 20355, 20265, 20306, 20328, 20383, 22490, 20796, 20619, 21354, 20654,
                20410, 20956, 21232, 20765, 17421, 20535, 17192, 18127, 22459, 20312, 25531, 22470, 20309, 20428, 18964,
                20466, 20491, 21342, 21070, 20521, 20682, 17714, 18326, 17543, 17559, 17585, 22497, 20559, 19504, 20279,
                20575, 20290, 20475, 20604, 20639, 20226, 20670, 17661, 21190, 17703, 21176, 17730, 19494, 20698, 20711,
                22480, 21046, 21116, 18971, 21130, 20727, 20755, 17675, 17753, 17832, 17590, 25518, 20394, 20781, 20831,
                20202, 20847, 21401, 17292, 17934, 17979, 18549, 20863, 20588, 25542, 20888, 20919, 18072, 18117, 20935,
                20972, 21032, 21062, 21086, 18239, 21102, 18563, 21146, 21162, 21206, 18351, 20949, 20902, 18340, 21222,
                21258, 21283, 18360, 20249, 17405, 21295, 21311, 21327, 20739, 20343, 21370, 21386, 21417, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 21977, 18836, 18987, 19008, 19233, 20367, 19008, 17173, 30763, 36437,
                17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 21452, 21880, 18649,
                18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 21504,
                32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527,
                17258, 36418, 36501, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 28674, 21946,
                17617, 36473, 18223, 17237, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 21575, 21534, 17481, 19156,
                17864, 18731, 17918, 36551, 17292, 17934, 21560, 30628, 18681, 18405, 18621, 18039, 18056, 18072, 18117,
                18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796,
                17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 21798, 18836, 21612, 19008, 19233, 20367, 19008, 17173, 30763,
                36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880,
                18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008,
                17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504,
                17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737,
                21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481,
                19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072,
                18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232,
                17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 21636, 18836, 18987, 19008, 19233, 17902, 19008, 17173,
                30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452,
                21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999,
                19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887,
                17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730,
                34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620,
                17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056,
                18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403,
                19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505,
                18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 21753, 19096, 21903, 19008, 19233, 20367, 19008,
                19291, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918,
                17379, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658,
                18999, 19008, 17447, 21931, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585,
                21887, 17504, 17527, 17258, 36418, 18280, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176,
                17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590,
                21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039,
                18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807,
                36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747,
                18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 21962, 18594, 18987, 19008, 19233, 22043,
                19008, 17173, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346,
                18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311,
                18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559,
                17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703,
                21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832,
                17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621,
                18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376,
                17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393,
                18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 21681, 21858, 18987, 19008, 19233,
                20367, 19008, 21544, 30763, 36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327,
                17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873,
                17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543,
                17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190,
                17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753,
                17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405,
                18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312,
                18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519,
                17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22339, 18836, 22059, 18888,
                27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 22121, 24401,
                24401, 24401, 24401, 30613, 18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211, 27211, 27211, 35072,
                22164, 24401, 24401, 24401, 24401, 31500, 31693, 18888, 18888, 18888, 18888, 18890, 27211, 27211, 27211,
                27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 32319, 18888, 18888, 18888, 18888, 23086, 27211,
                27211, 27211, 27211, 30756, 21431, 24401, 24401, 24401, 24401, 26095, 18888, 18888, 18888, 27855, 27211,
                27211, 27211, 22187, 22968, 24401, 24401, 24401, 22231, 18888, 18888, 27211, 27211, 35779, 20080, 24402,
                19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833, 19406, 19447,
                23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015, 23516, 31008,
                22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22339, 18836, 22059,
                18888, 27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 22121,
                24401, 24401, 24401, 24401, 30613, 18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211, 27211, 27211,
                35072, 22164, 24401, 24401, 24401, 24401, 31500, 31693, 18888, 18888, 18888, 18888, 18890, 27211, 27211,
                27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 31181, 18888, 18888, 18888, 18888, 23086,
                27211, 27211, 27211, 27211, 30756, 21431, 24401, 24401, 24401, 24401, 26095, 18888, 18888, 18888, 27855,
                27211, 27211, 27211, 22187, 22968, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 35779, 20080,
                24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833, 19406,
                19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015, 23516,
                31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22339, 18836,
                22059, 18888, 27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211,
                22121, 24401, 24401, 24401, 24401, 31678, 18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211, 27211,
                27211, 35072, 22164, 24401, 24401, 24401, 24401, 31500, 31693, 18888, 18888, 18888, 18888, 18890, 27211,
                27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 31181, 18888, 18888, 18888, 18888,
                23086, 27211, 27211, 27211, 27211, 30756, 21431, 24401, 24401, 24401, 24401, 26095, 18888, 18888, 18888,
                27855, 27211, 27211, 27211, 22187, 22968, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 35779,
                20080, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833,
                19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015,
                23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22339,
                18836, 22059, 18888, 27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211,
                27211, 22121, 24401, 24401, 24401, 24401, 30613, 18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211,
                27211, 27211, 35072, 22164, 24401, 24401, 24401, 24401, 33588, 31693, 18888, 18888, 18888, 18888, 18890,
                27211, 27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 31181, 18888, 18888, 18888,
                18888, 23086, 27211, 27211, 27211, 27211, 30756, 21431, 24401, 24401, 24401, 24401, 26095, 18888, 18888,
                18888, 27855, 27211, 27211, 27211, 22187, 22968, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211,
                35779, 20080, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211,
                31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760,
                31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                22339, 18836, 22059, 18888, 27857, 35019, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211, 27211,
                27211, 27211, 22248, 24401, 24401, 24401, 24401, 30613, 18888, 18888, 18888, 18888, 18888, 25783, 27211,
                27211, 27211, 27211, 35072, 22164, 24401, 24401, 24401, 24401, 31500, 31693, 18888, 18888, 18888, 18888,
                18890, 27211, 27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 31181, 18888, 18888,
                18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756, 21431, 24401, 24401, 24401, 24401, 26095, 18888,
                18888, 18888, 27855, 27211, 27211, 27211, 22187, 22968, 24401, 24401, 24401, 18887, 18888, 18888, 27211,
                27211, 35779, 20080, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890,
                27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782,
                19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 22339, 18836, 22059, 18888, 27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211,
                27211, 27211, 27211, 22121, 24401, 24401, 24401, 24401, 18866, 18888, 18888, 18888, 18888, 18888, 25783,
                27211, 27211, 27211, 27211, 35072, 22164, 24401, 24401, 24401, 24401, 24036, 31693, 18888, 18888, 18888,
                18888, 18890, 27211, 27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 19628, 18888,
                18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756, 24012, 24401, 24401, 24401, 24401, 26750,
                18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888, 18888,
                27211, 27211, 27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018,
                18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837,
                25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 22324, 18836, 22059, 18888, 27857, 30501, 24401, 29183, 22087, 18888, 18888, 18888, 18890,
                27211, 27211, 27211, 27211, 22121, 24401, 24401, 24401, 24401, 18866, 18888, 18888, 18888, 18888, 18888,
                25783, 27211, 27211, 27211, 27211, 35072, 22164, 24401, 24401, 24401, 24401, 24036, 31693, 18888, 18888,
                18888, 18888, 18890, 27211, 27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 19628,
                18888, 18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756, 24012, 24401, 24401, 24401, 24401,
                26750, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888,
                18888, 27211, 27211, 27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868,
                31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738,
                19837, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 22339, 18836, 22059, 18888, 27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888,
                18890, 27211, 27211, 27211, 27211, 22121, 24401, 24401, 24401, 24401, 18866, 18888, 18888, 18888, 18888,
                18888, 25783, 27211, 27211, 27211, 27211, 35072, 22164, 24401, 24401, 24401, 24401, 24036, 31693, 18888,
                18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401,
                19628, 18888, 18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756, 24012, 24401, 24401, 24401,
                24401, 34365, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887,
                18888, 18888, 27211, 27211, 27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889,
                19868, 31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783,
                31738, 19837, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 22354, 18836, 18987, 19008, 19233, 20367, 19008, 17173, 27086, 36437, 17330,
                17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665,
                19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952,
                17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258,
                36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617,
                36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864,
                18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 19930, 18039, 18056, 18072, 18117, 18143,
                18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163,
                30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 21828, 18836, 18987, 19008, 19233, 20367, 19008, 17173, 30763, 36437,
                17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880, 18649,
                18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447,
                32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527,
                17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946,
                17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156,
                17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117,
                18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796,
                17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 22309, 22513, 18987, 19008, 19233, 20367, 19008, 19122, 30763,
                36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 22544, 21880,
                18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008,
                17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504,
                17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737,
                21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481,
                19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072,
                18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232,
                17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 22608, 18836, 22988, 23004, 27585, 23020, 23036, 23067,
                22087, 18888, 18888, 18888, 23083, 27211, 27211, 27211, 23102, 22121, 24401, 24401, 24401, 23122, 31386,
                26154, 19674, 18888, 28119, 28232, 19424, 23705, 27211, 27211, 23142, 23173, 23189, 23212, 24401, 24401,
                23246, 34427, 31693, 23262, 18888, 23290, 23308, 27783, 27620, 23327, 35263, 35107, 33383, 23346, 18193,
                23393, 32748, 23968, 24401, 23414, 35153, 23463, 18888, 33913, 23442, 23482, 27211, 27211, 23532, 23552,
                21431, 23575, 24401, 24401, 23604, 26095, 23635, 23657, 18888, 33482, 23685, 33251, 27211, 22187, 18851,
                23721, 35536, 24401, 18887, 23750, 32641, 27211, 23769, 23787, 20080, 33012, 24384, 25659, 18888, 18889,
                27211, 27211, 19719, 23889, 23803, 31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 28224,
                31826, 23823, 26917, 34978, 23850, 26493, 25782, 23878, 23914, 23516, 31008, 22105, 19419, 27963, 19659,
                29781, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22623, 18836, 22059, 18888, 27857, 34097, 24401,
                29183, 22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 22121, 24401, 24401, 24401, 24401,
                30613, 18888, 18888, 18888, 18888, 28909, 25783, 27211, 27211, 27211, 34048, 23933, 22164, 24401, 24401,
                24401, 28409, 23949, 31693, 18888, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 27211, 19484,
                24401, 24401, 24401, 24401, 24401, 31181, 26583, 18888, 18888, 18888, 35585, 23984, 27211, 27211, 27211,
                24005, 22201, 24033, 24401, 24401, 24401, 24052, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 22187,
                22968, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 35779, 20080, 24402, 19868, 25659, 18888,
                18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828,
                31017, 27856, 31741, 26496, 24076, 24126, 24151, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963,
                19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22638, 18836, 22059, 19678, 27857, 24185,
                24401, 24201, 24217, 26592, 18888, 18888, 18890, 24252, 24268, 27211, 27211, 22121, 24287, 24303, 24401,
                24401, 30613, 19781, 35432, 36007, 32649, 18888, 25783, 24322, 28966, 23771, 27211, 35072, 22164, 24358,
                32106, 26829, 24400, 31500, 31693, 18888, 18888, 18888, 24801, 18890, 27211, 27211, 27211, 27211, 24418,
                19484, 24401, 24401, 24401, 24401, 20167, 31181, 18888, 18888, 18888, 27833, 23086, 27211, 27211, 33540,
                27211, 30756, 21431, 24401, 24401, 22972, 24401, 26095, 18888, 36131, 18888, 27855, 27211, 24440, 27211,
                22187, 22968, 24401, 24459, 24401, 31699, 28454, 18888, 34528, 34570, 35779, 24478, 24402, 24494, 25659,
                18888, 36228, 27211, 27211, 24515, 30981, 23734, 31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330,
                24538, 31017, 27856, 31741, 30059, 23377, 24563, 19837, 25782, 19760, 31015, 23516, 25374, 22105, 19419,
                29793, 24579, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22653, 18836, 22059, 25756, 19982,
                34097, 23196, 29183, 24614, 24110, 23641, 24673, 26103, 24697, 24443, 24713, 28558, 22121, 24748, 24462,
                24764, 23398, 30613, 18888, 18888, 18888, 18888, 24798, 25783, 27211, 27211, 27211, 34232, 35072, 22164,
                24401, 24401, 24401, 33302, 31500, 22559, 24106, 24232, 18888, 18888, 34970, 24817, 30411, 27211, 27211,
                32484, 19484, 29750, 35127, 24401, 24401, 19872, 31181, 24852, 18888, 18888, 24871, 29221, 27211, 27211,
                32072, 27211, 30756, 34441, 24401, 24401, 31571, 24401, 26095, 33141, 27802, 27011, 27855, 25295, 25607,
                24888, 22187, 22968, 19195, 34593, 24906, 18887, 18888, 18888, 27211, 27211, 35779, 20080, 24402, 19868,
                25659, 18888, 33663, 27211, 27211, 24924, 24947, 23588, 31018, 18890, 27211, 31833, 22135, 19447, 23086,
                23330, 19828, 30904, 31042, 24972, 19840, 25e3, 31738, 30898, 25782, 19760, 31015, 23516, 31008, 22105,
                19419, 25016, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22668, 18836, 25041, 25057,
                31320, 25073, 25089, 25105, 22087, 34796, 24236, 36138, 34870, 34125, 25121, 23106, 35497, 22248, 36613,
                25137, 30671, 27365, 30613, 25153, 26447, 25199, 25233, 22574, 23274, 25249, 25265, 25281, 25318, 25344,
                25360, 25400, 25428, 25452, 26731, 25504, 31693, 23669, 25558, 27407, 25575, 28599, 25934, 25599, 27211,
                28180, 27304, 25623, 25839, 25649, 24401, 34820, 25681, 25698, 22586, 27775, 30190, 25745, 25778, 25799,
                25817, 28995, 33569, 30756, 21518, 33443, 25837, 25855, 25893, 26095, 31254, 26677, 30136, 27855, 25930,
                25950, 27211, 22187, 22968, 25966, 25986, 24401, 23428, 27763, 36330, 26959, 26002, 26029, 26045, 26085,
                26119, 26170, 26203, 26222, 26239, 30527, 26372, 26274, 28404, 31018, 33757, 27211, 34262, 26316, 36729,
                26345, 26366, 35337, 31017, 26388, 26407, 30954, 26350, 33861, 26434, 26463, 26479, 26512, 23516, 33189,
                26531, 26547, 27963, 31293, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22683, 18836, 26568,
                26181, 26608, 34097, 26643, 29183, 22087, 26669, 18888, 18888, 18890, 26693, 27211, 27211, 27211, 22121,
                26720, 24401, 24401, 24401, 30613, 18888, 18888, 18888, 18888, 26774, 25783, 27211, 27211, 27211, 26619,
                35072, 22164, 24401, 24401, 24401, 21596, 31500, 31693, 18888, 18888, 33978, 18888, 18890, 27211, 27211,
                25801, 27211, 27211, 19484, 24401, 24401, 24401, 26792, 24401, 31181, 18888, 18888, 18888, 35464, 23086,
                27211, 27211, 27211, 26809, 30756, 21431, 24401, 24401, 24401, 26828, 26095, 18888, 18888, 18888, 27855,
                27211, 27211, 27211, 22187, 22968, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 35779, 20080,
                24402, 19868, 25659, 31948, 18889, 35707, 27211, 19719, 26845, 19868, 31018, 18890, 27211, 31833, 19406,
                19447, 23086, 23330, 26905, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015, 23516,
                24984, 31088, 19419, 26945, 27651, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22698, 18836,
                26999, 18888, 27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211,
                22121, 24401, 24401, 24401, 24401, 23051, 18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211, 27211,
                27211, 35072, 27033, 24401, 24401, 24401, 24401, 24036, 31693, 18888, 18888, 27056, 18888, 18890, 27211,
                27211, 30320, 27211, 27211, 27075, 24401, 24401, 29032, 24401, 24401, 19628, 18888, 18888, 18888, 18888,
                23086, 27211, 27211, 27211, 27211, 30756, 24012, 24401, 24401, 24401, 24401, 26750, 18888, 18888, 33986,
                27855, 27211, 27211, 27102, 17590, 24017, 24401, 24401, 27123, 27144, 36254, 27162, 27210, 27228, 28500,
                18187, 34842, 33426, 27244, 35980, 27277, 27302, 27320, 36048, 34013, 20999, 31882, 21478, 27895, 27356,
                30287, 27381, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015,
                23516, 31008, 22105, 26329, 30087, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22339,
                18836, 22059, 27406, 27423, 27445, 35294, 27461, 22087, 18888, 18888, 30140, 18890, 27211, 27211, 27989,
                27211, 22121, 24401, 24401, 25682, 24401, 18866, 18888, 18888, 18888, 18888, 18888, 34042, 27211, 27211,
                27211, 27211, 29700, 22164, 24401, 24401, 24401, 24401, 27128, 31693, 27477, 18888, 18888, 18888, 18890,
                27194, 27211, 27211, 27211, 27211, 19484, 35299, 24401, 24401, 24401, 24401, 19628, 18888, 18888, 18888,
                27059, 23086, 27211, 27211, 27211, 33366, 30756, 24012, 24401, 24401, 24401, 35044, 26750, 18888, 18888,
                18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211,
                27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 20815, 27211,
                30818, 19960, 33969, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760,
                31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                22713, 18836, 22059, 27496, 27516, 27541, 35231, 27557, 22087, 29662, 26292, 23292, 27573, 24836, 27601,
                27211, 27636, 22121, 35544, 27686, 24401, 27721, 18866, 18888, 27799, 18888, 27818, 22071, 27853, 32260,
                27211, 26013, 27873, 27920, 22164, 29419, 24401, 29946, 33413, 26742, 27751, 26881, 18888, 18888, 27261,
                36776, 27936, 27211, 27211, 27211, 27988, 28005, 28031, 28052, 24401, 24401, 28069, 28088, 28135, 25488,
                28152, 26069, 28167, 27211, 28340, 24657, 28196, 30756, 31523, 24401, 28212, 34176, 36174, 24956, 28248,
                28266, 28290, 21488, 33077, 28327, 28356, 17590, 20986, 23126, 28391, 28425, 28102, 28451, 28470, 28490,
                28516, 28534, 20034, 33728, 25868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 30241, 28274,
                28553, 28574, 19406, 28590, 23086, 23330, 19828, 19452, 28615, 28660, 26147, 25783, 31738, 19837, 25782,
                19760, 29613, 35958, 29276, 22105, 19419, 27963, 23157, 28700, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 22339, 18836, 22059, 18888, 27857, 34097, 24401, 29183, 22087, 18888, 18888, 18888, 18890, 27211,
                27211, 27211, 27211, 22121, 24401, 24401, 24401, 24401, 18866, 18888, 18888, 18888, 18888, 18888, 25783,
                27211, 27211, 27211, 27211, 35072, 22164, 24401, 24401, 24401, 24401, 24036, 22528, 18888, 18888, 18888,
                18888, 18890, 27333, 27211, 27211, 27211, 27211, 19484, 30853, 24401, 24401, 24401, 24401, 19628, 18888,
                18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756, 24012, 24401, 24401, 24401, 24401, 26750,
                18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888, 18888,
                27211, 27211, 27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018,
                18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837,
                25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 22728, 18836, 28747, 28782, 28817, 28841, 28857, 28880, 28896, 24161, 28943, 32011, 36261,
                27340, 28961, 29492, 28982, 29011, 24522, 29027, 25436, 29048, 23051, 27500, 29090, 29110, 30713, 18888,
                23512, 29130, 25183, 27211, 29155, 28927, 27033, 29173, 23230, 24401, 29199, 35373, 31693, 18888, 18888,
                25583, 32629, 29218, 27211, 27211, 31461, 30692, 29237, 27075, 24401, 24401, 24401, 29262, 29302, 19628,
                18888, 34329, 18888, 18888, 23086, 27211, 29329, 27211, 27211, 30756, 24012, 35933, 24401, 24401, 24401,
                27705, 31612, 18888, 18888, 29346, 29374, 27211, 35650, 17590, 21436, 29393, 24401, 25970, 18887, 33895,
                18888, 27211, 32528, 27212, 24016, 32769, 19868, 25659, 18888, 26889, 27211, 27211, 29412, 23889, 24371,
                31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31768, 19840, 25783, 31738,
                19837, 29435, 29508, 31102, 29550, 29606, 22105, 30300, 29462, 19659, 27951, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 22743, 18836, 22059, 29629, 29473, 34097, 33285, 29183, 29651, 27254, 18888, 29678,
                33329, 32535, 27211, 29694, 29716, 22121, 19202, 24401, 32742, 29741, 18866, 26776, 33921, 28474, 18888,
                18888, 25783, 29766, 27211, 29809, 27211, 35072, 22164, 35825, 24401, 29828, 24401, 24036, 36769, 25217,
                18888, 18888, 29848, 18890, 27211, 29871, 27211, 26258, 27211, 29894, 24401, 29929, 24401, 36587, 24401,
                19628, 18888, 18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 29725, 29962, 24401, 24401, 24401,
                24401, 26750, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18473,
                18888, 18888, 19584, 27211, 27212, 24016, 29982, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889,
                19868, 31018, 18890, 27211, 31833, 19902, 19447, 32052, 19544, 19828, 29998, 30097, 30031, 19840, 25783,
                30047, 19837, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 30075, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 22758, 18836, 30121, 30156, 30206, 30257, 30273, 30336, 22087, 35624, 32837,
                25762, 18890, 29878, 34934, 26812, 27211, 22121, 24931, 23223, 29202, 24401, 18866, 34373, 30352, 18888,
                18888, 18888, 23447, 24828, 27211, 27211, 27211, 35072, 30370, 35052, 24401, 24401, 24401, 24036, 29523,
                18888, 18888, 27146, 18888, 31308, 30386, 27211, 27211, 30405, 30558, 19484, 30427, 24401, 24401, 29938,
                35686, 19628, 28766, 30447, 34506, 35614, 23086, 28731, 30482, 30517, 30552, 30756, 24012, 20156, 30574,
                30598, 30667, 26283, 33464, 28945, 27670, 30687, 32915, 33504, 25328, 17590, 23963, 20450, 33837, 21016,
                32397, 26300, 30708, 30729, 27885, 30748, 21588, 36373, 30779, 26653, 24628, 33220, 32514, 30806, 31835,
                25412, 25906, 26515, 18890, 28825, 31833, 26133, 19447, 28304, 31730, 23834, 26057, 30869, 30885, 32181,
                30920, 30942, 32797, 25782, 30970, 31015, 23516, 31008, 30997, 31034, 27963, 19659, 29450, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 22773, 18836, 31058, 31074, 32463, 31125, 31141, 31197, 22087, 18888,
                29534, 35471, 36738, 27211, 24342, 31213, 24424, 22121, 24401, 20175, 31229, 31917, 27736, 31245, 34334,
                27175, 18888, 29094, 27286, 27211, 31278, 31336, 27211, 31355, 31371, 24401, 31402, 31418, 24401, 31437,
                31693, 18888, 31619, 32841, 18888, 18890, 27211, 27211, 31460, 31477, 27211, 19484, 24401, 24401, 31497,
                36581, 24401, 33020, 18888, 18888, 18888, 18888, 30007, 27211, 27211, 27211, 27211, 31516, 32310, 24401,
                24401, 24401, 24401, 31539, 18888, 28762, 18888, 24651, 35740, 27211, 27211, 28644, 31565, 35796, 24401,
                24401, 19318, 32188, 18888, 24334, 28366, 27212, 29966, 29832, 19868, 25659, 18888, 18889, 27211, 27211,
                19719, 31587, 19868, 31635, 32435, 33693, 30105, 31663, 20005, 31715, 31757, 31784, 31812, 30015, 31851,
                31878, 25783, 31898, 19837, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 31933, 30221, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 22788, 18836, 22059, 25729, 30466, 31968, 24306, 31984, 32e3,
                32807, 35160, 27017, 29590, 34941, 19801, 29377, 33700, 22121, 27040, 30431, 29396, 28864, 29565, 18888,
                18888, 18888, 32027, 18888, 25783, 27211, 27211, 23698, 27211, 35072, 22164, 24401, 24401, 30845, 24401,
                24036, 32045, 18888, 26929, 18888, 18888, 18890, 27211, 31481, 32068, 27211, 27211, 32088, 24401, 33058,
                32122, 24401, 24401, 33736, 18888, 18888, 33162, 18888, 23086, 27211, 27211, 29484, 27211, 28375, 32144,
                24401, 24401, 33831, 24401, 26750, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 36704, 24017, 24401,
                24401, 24401, 18887, 18888, 18888, 27211, 27211, 27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211,
                27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833, 33107, 22171, 33224, 24271, 32169, 31017, 27856,
                31741, 19840, 25783, 31738, 30234, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 22339, 18836, 32204, 32232, 32252, 32677, 33295, 29074,
                22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 22121, 24401, 24401, 24401, 24401, 23619,
                18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211, 27211, 27211, 35072, 32276, 24401, 24401, 24401,
                24401, 24036, 31693, 18888, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 27211, 32299, 24401,
                24401, 24401, 24401, 24401, 19628, 18888, 18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756,
                24012, 24401, 24401, 24401, 24401, 26750, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017,
                24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 27212, 24016, 24402, 19868, 25659, 33886, 18889,
                36065, 27211, 19719, 35326, 19868, 31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017,
                27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659,
                27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22803, 18836, 32335, 31647, 34666, 32351, 32367,
                32417, 22087, 18888, 32433, 19335, 32451, 27211, 32479, 27107, 32500, 22121, 24401, 32551, 20085, 32572,
                18866, 22287, 23753, 18888, 18888, 32602, 32665, 27211, 32693, 27211, 26972, 32713, 32729, 24401, 32764,
                24401, 25877, 32785, 34768, 18888, 27390, 32823, 24594, 24855, 32857, 24890, 32878, 32904, 27211, 32942,
                32977, 24401, 33e3, 29313, 24401, 30790, 26206, 27666, 33904, 18888, 23086, 36353, 27211, 33036, 27211,
                30756, 24012, 32153, 24401, 33056, 24401, 35861, 18888, 18888, 30354, 27972, 27211, 27211, 33800, 17590,
                20145, 24401, 24401, 34638, 20811, 18888, 18888, 33074, 27211, 27212, 36167, 24402, 19868, 25659, 18888,
                18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833, 19406, 34616, 24169, 33093, 33123,
                33157, 27856, 31741, 23862, 26552, 34302, 19837, 25782, 19760, 31015, 23516, 31008, 33178, 19973, 27963,
                23497, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22818, 18836, 33205, 28113, 33240, 34097,
                33275, 29183, 22087, 33318, 35438, 18888, 18890, 33345, 26391, 33382, 27211, 22121, 33399, 28072, 33442,
                24401, 18866, 22232, 18888, 33459, 18888, 18888, 33480, 33498, 25175, 27211, 27211, 26704, 22164, 24775,
                35239, 24401, 24401, 25914, 29580, 18888, 18888, 31109, 25211, 33520, 33539, 27211, 27211, 33556, 36284,
                19484, 33585, 24401, 24401, 33604, 32556, 19628, 18888, 18888, 31262, 33658, 23086, 27211, 27211, 33679,
                27211, 30756, 24012, 24401, 24401, 33716, 24401, 26854, 27480, 18888, 33752, 27855, 33259, 34701, 27211,
                17590, 32102, 24782, 23807, 24401, 18887, 18888, 18888, 27211, 27211, 27212, 33773, 36105, 19868, 25659,
                18888, 23368, 27211, 29157, 19719, 23889, 34454, 29286, 18890, 33794, 25302, 33816, 19447, 34079, 33853,
                31862, 31017, 27856, 31741, 33877, 28920, 33937, 19837, 30461, 34002, 22276, 36041, 34029, 22105, 19419,
                27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22833, 18836, 34064, 32616, 34113,
                34141, 34157, 34192, 34208, 32216, 36013, 31549, 31952, 34224, 34248, 34287, 29330, 34350, 34389, 34413,
                34481, 26793, 18866, 26187, 29635, 22293, 18888, 36654, 25783, 34522, 34544, 34566, 25821, 35072, 22164,
                34586, 34609, 34632, 19604, 24036, 36644, 36674, 24681, 18888, 32401, 34654, 31339, 34682, 34698, 27211,
                34717, 34753, 28053, 34812, 34836, 24401, 33619, 19628, 34858, 32236, 34906, 24598, 33523, 27612, 34890,
                34922, 24732, 29246, 36717, 33634, 34465, 32984, 34168, 26750, 34957, 18888, 18888, 34994, 35010, 27211,
                33040, 17590, 29913, 35035, 24401, 36304, 25482, 30171, 35883, 35068, 35088, 26627, 20441, 31173, 35123,
                35143, 35176, 24640, 30492, 29358, 19719, 35192, 35219, 25384, 28801, 35255, 35279, 32586, 34496, 23086,
                23330, 29061, 31017, 27856, 31741, 19840, 25783, 31738, 24547, 25164, 35315, 31796, 35353, 34316, 22105,
                19419, 27963, 24091, 28630, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22848, 18836, 22059, 34782,
                34088, 35389, 21008, 35405, 35421, 35454, 18888, 18888, 23466, 35487, 27211, 27211, 27211, 35513, 31154,
                24401, 24401, 24401, 35560, 18888, 26863, 36664, 35601, 24872, 25783, 30389, 23536, 26250, 35647, 35666,
                22164, 19522, 19564, 30582, 35682, 27697, 35575, 29114, 18888, 18888, 18888, 18890, 27211, 35702, 27211,
                27211, 27211, 35723, 24401, 35527, 24401, 24401, 24401, 19628, 30184, 18888, 18888, 18888, 23086, 35739,
                27211, 27211, 27211, 29139, 22938, 24401, 24401, 24401, 24401, 23898, 35756, 18888, 18888, 25025, 35778,
                27211, 27211, 17590, 20064, 35795, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 27212, 24016, 24402,
                19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 23917, 18890, 34550, 31833, 22262, 19447,
                23086, 23330, 26418, 31017, 27856, 31741, 19840, 25783, 35812, 19837, 27187, 35841, 33135, 23516, 31008,
                22105, 22148, 28712, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22863, 18836, 22059,
                35877, 28723, 34097, 31164, 29183, 22087, 26758, 18888, 22592, 18890, 23989, 27211, 29812, 27211, 22121,
                33778, 24401, 31421, 24401, 18866, 18888, 18888, 26872, 18888, 18888, 25783, 27211, 30732, 27211, 27211,
                35072, 22164, 24401, 24908, 24401, 24401, 24036, 31693, 18888, 18888, 18888, 18888, 18890, 27211, 27211,
                27211, 27211, 27211, 19484, 24401, 24401, 24401, 24401, 24401, 19628, 18888, 18888, 18888, 18888, 23086,
                27211, 27211, 27211, 27211, 30756, 24012, 24401, 24401, 24401, 24401, 26750, 18888, 18888, 18888, 27855,
                27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 27212, 24016,
                24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833, 19406,
                19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015, 23516,
                31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22878, 18836,
                22059, 27837, 27857, 35899, 24401, 35915, 22087, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211,
                22121, 24401, 24401, 24401, 24401, 18866, 18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211, 27211,
                27211, 35072, 22164, 24401, 24401, 24401, 24401, 24036, 31602, 18888, 18888, 18888, 18888, 26223, 27211,
                27211, 27211, 27211, 27211, 19484, 35931, 24401, 24401, 24401, 24401, 19628, 18888, 28136, 18888, 18888,
                35949, 27211, 32862, 27211, 32697, 30756, 24012, 24401, 32283, 24401, 32128, 26750, 18888, 18888, 18888,
                27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211, 27212,
                24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211, 31833,
                19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760, 31015,
                23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 22893,
                18836, 22059, 35974, 34882, 34097, 33960, 29183, 35996, 18888, 23311, 18888, 36029, 27211, 27211, 36064,
                36081, 22121, 24401, 24401, 36104, 33950, 18866, 18888, 18888, 18888, 18888, 18888, 25783, 27211, 27211,
                27211, 27211, 35072, 22164, 24401, 24401, 24401, 24401, 24036, 36121, 18888, 25559, 18888, 18888, 18890,
                27211, 27211, 30313, 27211, 27211, 36154, 24401, 24401, 34397, 24401, 24401, 19628, 28250, 18888, 18888,
                18888, 23086, 30926, 27211, 27211, 27211, 26983, 24012, 33642, 24401, 24401, 24401, 26750, 18888, 18888,
                18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 18887, 18888, 18888, 27211, 27211,
                27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211, 19719, 23889, 19868, 31018, 18890, 27211,
                31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782, 19760,
                31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                22339, 18836, 22059, 19354, 27857, 36190, 24401, 36206, 22087, 18888, 18888, 18888, 18007, 27211, 27211,
                27211, 24724, 22121, 24401, 24401, 24401, 30827, 18866, 18888, 36222, 18888, 28795, 18888, 25783, 35100,
                27211, 27429, 27211, 35072, 22164, 30836, 24401, 24499, 24401, 24036, 31693, 18888, 36244, 18888, 18888,
                18890, 27211, 36088, 27211, 27211, 27211, 19484, 24401, 28036, 24401, 24401, 24401, 19628, 18888, 18888,
                35631, 18888, 35762, 27211, 27211, 36277, 27211, 34730, 24012, 24401, 24401, 36300, 24401, 36320, 18888,
                18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401, 24401, 25712, 18888, 18888, 36346,
                27211, 27212, 19184, 24402, 19868, 25659, 32029, 18889, 27211, 33359, 19719, 23889, 36369, 31018, 18890,
                27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741, 19840, 25783, 31738, 19837, 25782,
                19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 22384, 18836, 36389, 19008, 19233, 20367, 36434, 17173, 17595, 36437, 17330, 17349, 18921, 17189,
                17208, 17281, 20355, 36453, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265, 22033,
                20765, 17421, 20535, 17192, 20362, 21726, 17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520, 17251,
                36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915, 21940,
                17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223, 36531,
                17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918, 36551,
                17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052, 18209,
                18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392, 17816,
                32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 22369, 18836, 18987, 19008, 19233, 20367, 19008, 21737, 30763, 36437, 17330, 17349, 18921,
                17189, 17208, 17281, 20355, 17949, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006, 17265,
                22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952, 17497, 17520,
                17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418, 21915,
                21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473, 18223,
                36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731, 17918,
                36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706, 18052,
                18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642, 18392,
                17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 21813, 18836, 36489, 19008, 19233, 20367, 19008, 17173, 17737, 36437, 17330, 17349,
                18921, 17189, 17208, 17281, 20355, 17768, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665, 19006,
                17265, 22033, 20765, 17421, 20535, 17192, 20543, 22022, 17311, 18658, 18999, 19008, 17447, 32952, 17497,
                17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258, 36418,
                21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617, 36473,
                18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864, 18731,
                17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143, 18706,
                18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163, 30642,
                18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 21828, 18836, 18987, 19008, 19233, 20367, 19008, 17173, 30763, 36437, 17330,
                17349, 18921, 17189, 17208, 17281, 20355, 36517, 17308, 17327, 17346, 18918, 18452, 21880, 18649, 18665,
                19006, 17265, 22033, 20765, 17421, 20535, 17192, 18127, 21873, 17311, 18658, 18999, 19008, 17447, 32952,
                17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504, 17527, 17258,
                36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737, 21946, 17617,
                36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481, 19156, 17864,
                18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072, 18117, 18143,
                18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232, 17796, 17163,
                30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 21828, 18836, 19307, 18888, 27857, 30756, 24401, 29183, 28015, 18888,
                18888, 18888, 18890, 27211, 27211, 27211, 27211, 36567, 24401, 24401, 24401, 24401, 22953, 18888, 18888,
                18888, 18888, 18888, 25783, 27211, 27211, 27211, 27211, 28537, 36603, 24401, 24401, 24401, 24401, 24036,
                18881, 18888, 18888, 18888, 18888, 18890, 27211, 27211, 27211, 27211, 27211, 19484, 24401, 24401, 24401,
                24401, 24401, 19628, 18888, 18888, 18888, 18888, 23086, 27211, 27211, 27211, 27211, 30756, 24012, 24401,
                24401, 24401, 24401, 26750, 18888, 18888, 18888, 27855, 27211, 27211, 27211, 17590, 24017, 24401, 24401,
                24401, 18887, 18888, 18888, 27211, 27211, 27212, 24016, 24402, 19868, 25659, 18888, 18889, 27211, 27211,
                19719, 23889, 19868, 31018, 18890, 27211, 31833, 19406, 19447, 23086, 23330, 19828, 31017, 27856, 31741,
                19840, 25783, 31738, 19837, 25782, 19760, 31015, 23516, 31008, 22105, 19419, 27963, 19659, 27951, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 36629, 36690, 18720, 19008, 19233, 20367, 19008, 17454, 17595,
                36437, 17330, 17349, 18921, 17189, 17208, 17281, 20355, 17223, 17308, 17327, 17346, 18918, 36754, 21880,
                18649, 18665, 19006, 17265, 22033, 20765, 17421, 20535, 17192, 20362, 21726, 17311, 18658, 18999, 19008,
                17447, 32952, 17497, 17520, 17251, 36411, 17782, 20682, 17714, 18326, 17543, 17559, 17585, 21887, 17504,
                17527, 17258, 36418, 21915, 21940, 17611, 36467, 18217, 17633, 17661, 21190, 17703, 21176, 17730, 34737,
                21946, 17617, 36473, 18223, 36531, 17477, 19152, 17860, 17892, 17675, 17753, 17832, 17590, 21620, 17481,
                19156, 17864, 18731, 17918, 36551, 17292, 17934, 17979, 18727, 18681, 18405, 18621, 18039, 18056, 18072,
                18117, 18143, 18706, 18052, 18209, 18250, 18239, 18266, 17963, 18296, 18312, 18376, 17807, 36403, 19232,
                17796, 17163, 30642, 18392, 17816, 32961, 17645, 18805, 18421, 18437, 18519, 17393, 18747, 18505, 18535,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590, 17590,
                17590, 17590, 17590, 17590, 17590, 17590, 17590, 0, 94242, 0, 118820, 0, 2211840, 102439, 0, 0, 106538,
                98347, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2482176, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 2207744, 2404352,
                2412544, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 3104768, 2605056, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2678784, 2207744, 2695168, 2207744, 2703360, 2207744, 2711552, 2752512, 2207744, 0, 0,
                0, 0, 0, 0, 2166784, 0, 0, 0, 0, 0, 0, 2158592, 2158592, 3170304, 3174400, 2158592, 0, 139, 0, 2158592,
                2158592, 2158592, 2158592, 2158592, 2424832, 2158592, 2158592, 2158592, 2748416, 2756608, 2777088,
                2801664, 2158592, 2158592, 2158592, 2863104, 2891776, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 3104768, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2207744, 2785280, 2207744, 2809856, 2207744, 2207744, 2842624, 2207744, 2207744,
                2207744, 2899968, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2473984,
                2207744, 2207744, 2494464, 2207744, 2207744, 2207744, 2523136, 2158592, 2404352, 2412544, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2564096, 2158592, 2158592, 2605056, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2678784, 2158592, 2695168, 2158592, 2703360, 2158592, 2711552, 2752512, 2158592, 2158592, 2785280,
                2158592, 2158592, 2785280, 2158592, 2809856, 2158592, 2158592, 2842624, 2158592, 2158592, 2158592,
                2899968, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 18, 0, 0, 0,
                0, 0, 0, 0, 2211840, 0, 0, 641, 0, 2158592, 0, 0, 0, 0, 0, 0, 0, 0, 2211840, 0, 0, 32768, 0, 2158592, 0,
                2158592, 2158592, 2158592, 2383872, 2158592, 2158592, 2158592, 2158592, 3006464, 2383872, 2207744,
                2207744, 2207744, 2207744, 2158877, 2158877, 2158877, 2158877, 0, 0, 0, 2158877, 2572573, 2158877,
                2158877, 0, 2207744, 2207744, 2596864, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2641920,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 0, 0, 0, 167936, 0, 0, 2162688, 0, 0,
                3104768, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 0, 0, 0, 2146304, 2146304, 2224128, 2224128, 2232320, 2232320, 2232320, 641, 0, 0, 0,
                0, 0, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2531328,
                2158592, 2158592, 2158592, 2158592, 2158592, 2617344, 2158592, 2158592, 2158592, 2158592, 2441216,
                2445312, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2502656, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2580480, 2158592, 2158592, 2158592, 2158592, 2621440,
                2158592, 2580480, 2158592, 2158592, 2158592, 2158592, 2621440, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2699264, 2158592, 2158592, 2158592, 2158592, 2158592, 2748416, 2756608, 2777088,
                2801664, 2207744, 2863104, 2891776, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 3018752, 2207744, 3043328, 2207744, 2207744, 2207744,
                2207744, 3080192, 2207744, 2207744, 3112960, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 0, 0, 0, 172310, 279, 0, 2162688, 0, 0, 2207744, 2207744, 2207744, 3186688, 2207744, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2158592, 2158592, 2158592, 2404352, 2412544, 2158592, 2510848,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2584576, 2158592, 2609152, 2158592,
                2158592, 2629632, 2158592, 2158592, 2158592, 2686976, 2158592, 2715648, 2158592, 2158592, 3121152,
                2158592, 2158592, 2158592, 3149824, 2158592, 2158592, 3170304, 3174400, 2158592, 2367488, 2207744,
                2207744, 2207744, 2207744, 2158592, 2158592, 2158592, 2158592, 0, 0, 0, 2158592, 2572288, 2158592,
                2158592, 0, 2207744, 2207744, 2207744, 2433024, 2207744, 2453504, 2461696, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2510848, 2207744, 2207744, 2207744, 2207744, 2207744, 2531328, 2207744,
                2207744, 2207744, 2207744, 2207744, 2617344, 2207744, 2207744, 2207744, 2207744, 2158592, 2158592,
                2158592, 2158592, 0, 0, 0, 2158592, 2572288, 2158592, 2158592, 1508, 2715648, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2867200, 2207744, 2904064, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2580480, 2207744, 2207744, 2207744, 2207744, 2621440, 2207744,
                2207744, 2207744, 3149824, 2207744, 2207744, 3170304, 3174400, 2207744, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                138, 2158592, 2158592, 2158592, 2404352, 2412544, 2707456, 2732032, 2207744, 2207744, 2207744, 2822144,
                2826240, 2207744, 2895872, 2207744, 2207744, 2924544, 2207744, 2207744, 2973696, 2207744, 0, 0, 0, 0, 0,
                0, 2166784, 0, 0, 0, 0, 0, 285, 2158592, 2158592, 3112960, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 3186688, 2158592, 2207744, 2207744, 2158592, 2158592, 2158592,
                2158592, 2158592, 0, 0, 0, 2158592, 2158592, 2158592, 2158592, 0, 0, 2535424, 2543616, 2158592, 2158592,
                2158592, 0, 0, 0, 2158592, 2158592, 2158592, 2990080, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2572288, 2981888, 2207744, 2207744, 3002368, 2207744, 3047424, 3063808, 3076096,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 3203072, 2708960, 2732032, 2158592,
                2158592, 2158592, 2822144, 2827748, 2158592, 2895872, 2158592, 2158592, 2924544, 2158592, 2158592,
                2973696, 2158592, 2981888, 2158592, 2158592, 3002368, 2158592, 3047424, 3063808, 3076096, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 3203072, 2981888, 2158592, 2158592, 3003876,
                2158592, 3047424, 3063808, 3076096, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                3203072, 2207744, 2207744, 2207744, 2207744, 2207744, 2424832, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 20480, 0, 0, 0, 0, 0, 2162688, 20480, 0, 2523136, 2527232, 2158592, 2158592,
                2576384, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2908160, 2527232, 2207744, 2207744, 2576384, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2908160, 2207744, 0, 0, 0, 0, 0, 0, 2166784, 0, 0, 0, 0, 0, 286,
                2158592, 2158592, 0, 0, 2158592, 2158592, 2158592, 2158592, 2633728, 2658304, 0, 0, 2740224, 2744320, 0,
                2834432, 2207744, 2207744, 2977792, 2207744, 2207744, 2207744, 2207744, 3039232, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 3158016, 0, 0, 29315, 0, 0, 0, 0, 45, 45, 45, 45, 45, 933, 45, 45,
                45, 45, 442, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 2494464, 2158592, 2158592, 2158592, 2524757,
                2527232, 2158592, 2158592, 2576384, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 1504, 2158592,
                2498560, 2158592, 2158592, 2158592, 2158592, 2568192, 2158592, 2592768, 2625536, 2158592, 2158592,
                2674688, 2736128, 2158592, 2158592, 0, 2158592, 2912256, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 3108864, 2158592, 2158592, 3133440, 3145728, 3153920, 2375680, 2379776, 2207744,
                2207744, 2420736, 2207744, 2449408, 2207744, 2207744, 2207744, 2498560, 2207744, 2207744, 2207744,
                2207744, 2568192, 2207744, 0, 0, 0, 0, 0, 0, 2166784, 0, 0, 0, 0, 0, 551, 2158592, 2158592, 2158592,
                2158592, 2207744, 2506752, 2207744, 2207744, 2207744, 2207744, 2207744, 2158592, 2506752, 0, 2020,
                2158592, 2592768, 2625536, 2207744, 2207744, 2674688, 2736128, 2207744, 2207744, 2207744, 2912256,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 0, 542, 0, 544, 2207744, 3108864, 2207744, 2207744, 3133440, 3145728, 3153920, 2375680,
                2379776, 2158592, 2158592, 2420736, 2158592, 2449408, 2158592, 2158592, 2158592, 2158592, 2158592,
                3186688, 2158592, 0, 641, 0, 0, 0, 0, 0, 0, 2367488, 2158592, 2498560, 2158592, 2158592, 1621, 2158592,
                2158592, 2568192, 2158592, 2592768, 2625536, 2158592, 2158592, 2674688, 0, 0, 0, 0, 0, 1608, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 1107, 97, 97, 1110, 97, 97, 3133440, 3145728, 3153920, 2158592, 2408448,
                2416640, 2158592, 2465792, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                3014656, 2158592, 2158592, 3051520, 2158592, 2158592, 3100672, 2158592, 2158592, 3121152, 2158592,
                2158592, 2158592, 3149824, 2416640, 2207744, 2465792, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2633728, 2658304, 2740224, 2744320, 2834432, 2949120, 2158592, 2985984,
                2158592, 2998272, 2158592, 2158592, 2158592, 3129344, 2207744, 2408448, 2949120, 2207744, 2985984,
                2207744, 2998272, 2207744, 2207744, 2207744, 3129344, 2158592, 2408448, 2416640, 2158592, 2465792,
                2158592, 2158592, 2158592, 2158592, 2158592, 3186688, 2158592, 0, 32768, 0, 0, 0, 0, 0, 0, 2367488,
                2949120, 2158592, 2985984, 2158592, 2998272, 2158592, 2158592, 2158592, 3129344, 2158592, 2158592,
                2478080, 2158592, 2158592, 2158592, 2535424, 2543616, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 3117056, 2207744, 2207744, 2478080, 2207744, 2207744, 2207744,
                2207744, 2699264, 2207744, 2207744, 2207744, 2207744, 2207744, 2748416, 2756608, 2777088, 2801664,
                2207744, 2207744, 2158877, 2158877, 2158877, 2158877, 2158877, 0, 0, 0, 2158877, 2158877, 2158877,
                2158877, 0, 0, 2535709, 2543901, 2158877, 2158877, 2158877, 0, 0, 0, 2158877, 2158877, 2158877, 2990365,
                2158877, 2158877, 2158730, 2158730, 2158730, 2158730, 2158730, 2572426, 2207744, 2535424, 2543616,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 3117056, 2158592,
                2158592, 2478080, 2207744, 2207744, 2990080, 2207744, 2207744, 2158592, 2158592, 2482176, 2158592,
                2158592, 0, 0, 0, 2158592, 2158592, 2158592, 0, 2158592, 2908160, 2158592, 2158592, 2158592, 2977792,
                2158592, 2158592, 2158592, 2158592, 3039232, 2158592, 2158592, 3010560, 2207744, 2428928, 2207744,
                2514944, 2207744, 2588672, 2207744, 2838528, 2207744, 2207744, 2207744, 3010560, 2158592, 2428928,
                2158592, 2514944, 0, 0, 2158592, 2588672, 2158592, 0, 2838528, 2158592, 2158592, 2158592, 3010560,
                2158592, 2506752, 2158592, 18, 0, 0, 0, 0, 0, 0, 0, 2211840, 0, 0, 0, 0, 2158592, 0, 0, 29315, 922, 0,
                0, 0, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1539, 45, 3006464, 2383872, 0, 2020, 2158592,
                2158592, 2158592, 2158592, 3006464, 2158592, 2637824, 2953216, 2158592, 2207744, 2637824, 2953216,
                2207744, 0, 0, 2158592, 2637824, 2953216, 2158592, 2539520, 2158592, 2539520, 2207744, 0, 0, 2539520,
                2158592, 2158592, 2158592, 2158592, 2207744, 2506752, 2207744, 2207744, 2207744, 2207744, 2207744,
                2158592, 2506752, 0, 0, 2158592, 2207744, 0, 2158592, 2158592, 2207744, 0, 2158592, 2158592, 2207744, 0,
                2158592, 2965504, 2965504, 2965504, 0, 0, 0, 0, 0, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877,
                2158877, 2158877, 2474269, 2158877, 2158877, 0, 0, 2158877, 2158877, 2158877, 2158877, 2634013, 2658589,
                0, 0, 2740509, 2744605, 0, 2834717, 40976, 18, 36884, 45078, 24, 28, 90143, 94242, 118820, 102439,
                106538, 98347, 118820, 118820, 118820, 40976, 18, 18, 36884, 0, 0, 0, 24, 24, 24, 27, 27, 27, 27, 90143,
                0, 0, 86016, 0, 0, 2211840, 102439, 0, 0, 0, 98347, 0, 2158592, 2158592, 2158592, 2158592, 2158592,
                3158016, 0, 2375680, 2379776, 2158592, 2158592, 2420736, 2158592, 2449408, 2158592, 2158592, 0, 94242,
                0, 0, 0, 2211840, 102439, 0, 0, 106538, 98347, 135, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2564096, 2158592, 2158592, 2158592, 2158592, 2158592, 2596864, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2641920, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2781184, 2793472, 2494464, 2158592, 2158592, 2158592, 2523136, 2527232,
                2158592, 2158592, 2576384, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 0, 40976, 0, 18, 18,
                24, 0, 27, 27, 0, 2158592, 2498560, 2158592, 2158592, 0, 2158592, 2158592, 2568192, 2158592, 2592768,
                2625536, 2158592, 2158592, 2674688, 0, 0, 0, 0, 0, 2211840, 0, 0, 0, 0, 0, 0, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2473984, 2158592, 2158592, 2494464, 2158592, 2158592,
                2158592, 3006464, 2383872, 0, 0, 2158592, 2158592, 2158592, 2158592, 3006464, 2158592, 2637824, 2953216,
                2158592, 2207744, 2637824, 2953216, 40976, 18, 36884, 45078, 24, 27, 147488, 94242, 147456, 147488,
                106538, 98347, 0, 0, 147456, 40976, 18, 18, 36884, 0, 45078, 0, 24, 24, 24, 27, 27, 27, 27, 0, 81920, 0,
                94242, 0, 0, 0, 2211840, 0, 0, 0, 106538, 98347, 0, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2428928, 2158592, 2514944, 2158592, 2588672, 2158592, 2838528, 2158592, 2158592, 40976, 18,
                151573, 45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 0, 40976, 18, 18, 36884, 0, 45078,
                0, 24, 24, 24, 27, 27, 27, 27, 90143, 0, 0, 1315, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1487, 97,
                18, 131427, 0, 0, 0, 0, 0, 0, 362, 0, 0, 365, 29315, 367, 0, 0, 29315, 0, 0, 0, 0, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 130, 94242, 0, 0, 0, 2211840, 102439, 0, 0, 106538,
                98347, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 3096576, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2207744, 2207744, 2158592, 18, 0, 0, 0,
                0, 0, 0, 0, 2211840, 0, 0, 0, 0, 2158592, 644, 2207744, 2207744, 2207744, 3186688, 2207744, 0, 1080, 0,
                1084, 0, 1088, 0, 0, 0, 0, 0, 0, 0, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2531466, 2158730, 2158730, 2158730, 2158730, 2158730, 2617482, 0, 94242, 0, 0, 0,
                2211840, 102439, 0, 0, 106538, 98347, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2781184, 2793472,
                2158592, 2818048, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 40976, 18, 36884, 45078, 24, 27, 90143,
                159779, 159744, 102439, 159779, 98347, 0, 0, 159744, 40976, 18, 18, 36884, 0, 45078, 0, 2224253, 172032,
                2224253, 2232448, 2232448, 172032, 2232448, 90143, 0, 0, 2170880, 0, 0, 550, 829, 2158592, 2158592,
                2158592, 2387968, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 0, 40976, 0, 18, 18, 124, 124,
                127, 127, 127, 40976, 18, 36884, 45078, 25, 29, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 163931,
                40976, 18, 18, 36884, 0, 45078, 249856, 24, 24, 24, 27, 27, 27, 27, 90143, 0, 0, 2170880, 0, 0, 827, 0,
                2158592, 2158592, 2158592, 2387968, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 0, 40976, 0,
                4243810, 4243810, 24, 24, 27, 27, 27, 2207744, 0, 0, 0, 0, 0, 0, 2166784, 0, 0, 0, 0, 57344, 286,
                2158592, 2158592, 2158592, 2158592, 2707456, 2732032, 2158592, 2158592, 2158592, 2822144, 2826240,
                2158592, 2895872, 2158592, 2158592, 2924544, 2158592, 2158592, 2973696, 2158592, 2207744, 2207744,
                2207744, 3186688, 2207744, 0, 0, 0, 0, 0, 0, 53248, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 1613, 97, 97, 97,
                97, 97, 97, 1495, 97, 97, 97, 97, 97, 97, 97, 97, 97, 566, 97, 97, 97, 97, 97, 97, 2207744, 0, 0, 0, 0,
                0, 0, 2166784, 546, 0, 0, 0, 0, 286, 2158592, 2158592, 2158592, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 17, 18, 36884,
                45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 20480, 120, 121, 18, 18, 36884, 0, 45078,
                0, 24, 24, 24, 27, 27, 27, 27, 90143, 0, 0, 2170880, 0, 53248, 550, 0, 2158592, 2158592, 2158592,
                2387968, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 0, 40976, 196608, 18, 266240, 24, 24, 27,
                27, 27, 0, 94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347, 0, 45, 45, 45, 45, 45, 45, 45, 1535, 45, 45,
                45, 45, 45, 45, 45, 1416, 45, 45, 45, 45, 45, 45, 45, 45, 424, 45, 45, 45, 45, 45, 45, 45, 45, 45, 405,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 199, 45, 45, 67, 67, 67, 67, 67, 491, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 1766, 67, 67, 67, 1767, 67, 24850, 24850, 12564, 12564, 0, 0, 2166784,
                546, 0, 53531, 53531, 0, 286, 97, 97, 0, 0, 97, 97, 97, 97, 97, 97, 0, 0, 97, 97, 0, 97, 97, 97, 45, 45,
                45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 743, 57889, 0, 2170880, 0, 0, 550, 0, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 45, 45, 1856, 45, 1858, 1859, 67, 67, 67, 1009, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 1021, 67, 67, 67, 67, 67, 25398, 0, 13112, 0, 54074, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 2367773, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2699549, 2158877, 2158877,
                2158877, 2158877, 2158877, 2748701, 2756893, 2777373, 2801949, 97, 1115, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 857, 97, 67, 67, 67, 67, 67, 1258, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                1826, 67, 97, 97, 97, 97, 97, 97, 1338, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 870, 97, 97,
                67, 67, 67, 1463, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1579, 67, 67, 97, 97, 97, 1518,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 904, 905, 97, 97, 97, 97, 1620, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 0, 921, 0, 0, 0, 0, 0, 0, 45, 1679, 67, 67, 67, 1682, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 1690, 67, 0, 0, 97, 97, 97, 97, 45, 45, 67, 67, 0, 0, 97, 97, 45, 45, 45, 669, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 189, 45, 45, 45, 1748, 45, 45, 45, 1749, 1750, 45, 45, 45, 45, 45,
                45, 45, 45, 67, 67, 67, 67, 1959, 67, 67, 67, 67, 1768, 67, 67, 67, 67, 67, 67, 67, 67, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 1791, 97, 97, 97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 1802, 67, 1817, 67,
                67, 67, 67, 67, 67, 1823, 67, 67, 67, 67, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 0, 97, 97, 97, 97,
                1848, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 659, 45, 45, 45, 45, 45, 45, 45, 1863, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 495, 67, 67, 67, 67, 67, 1878, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97,
                0, 0, 97, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67,
                67, 67, 97, 97, 97, 97, 0, 0, 0, 1973, 97, 97, 97, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 1165, 97, 1167, 67, 24850, 24850, 12564, 12564, 0, 0, 2166784, 0, 0, 53531, 53531, 0, 286, 97, 97,
                0, 0, 97, 97, 97, 97, 97, 97, 0, 0, 97, 97, 1789, 97, 0, 94242, 0, 0, 0, 2211840, 102439, 0, 0, 106538,
                98347, 136, 2158592, 2158592, 2158592, 2158592, 2158592, 3158016, 229376, 2375680, 2379776, 2158592,
                2158592, 2420736, 2158592, 2449408, 2158592, 2158592, 67, 24850, 24850, 12564, 12564, 0, 0, 280, 547, 0,
                53531, 53531, 0, 286, 97, 97, 0, 0, 97, 97, 97, 97, 97, 97, 0, 1788, 97, 97, 0, 97, 2024, 97, 45, 45,
                45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 235, 67, 67, 67, 67, 67, 57889, 547, 547, 0, 0, 550, 0,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 45, 45, 45, 1799, 45, 45, 45, 67, 67, 67, 67, 67, 25398, 0, 13112,
                0, 54074, 0, 0, 1092, 0, 0, 0, 0, 0, 97, 97, 97, 97, 1612, 97, 97, 97, 97, 1616, 97, 1297, 1472, 0, 0,
                0, 0, 1303, 1474, 0, 0, 0, 0, 1309, 1476, 0, 0, 0, 0, 97, 97, 97, 1481, 97, 97, 97, 97, 97, 97, 1488,
                97, 0, 1474, 0, 1476, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 607, 97, 97, 97, 97, 40976, 18,
                36884, 45078, 26, 30, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 213080, 40976, 18, 36884, 45078, 24,
                27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 143448, 40976, 18, 18, 36884, 0, 45078, 0, 24, 24, 24,
                27, 27, 27, 27, 0, 0, 0, 0, 97, 97, 97, 97, 1482, 97, 1483, 97, 97, 97, 97, 97, 97, 1326, 97, 97, 1329,
                1330, 97, 97, 97, 97, 97, 97, 1159, 1160, 97, 97, 97, 97, 97, 97, 97, 97, 590, 97, 97, 97, 97, 97, 97,
                97, 0, 94242, 0, 0, 0, 2211974, 102439, 0, 0, 106538, 98347, 0, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2474122, 2158730, 2158730, 2494602, 2158730, 2158730, 2158730,
                2809994, 2158730, 2158730, 2842762, 2158730, 2158730, 2158730, 2900106, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 3014794, 2158730, 2158730, 3051658, 2158730, 2158730,
                3100810, 2158730, 2158730, 2158730, 2158730, 3096714, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 2207744, 2207744, 2207744, 2207744, 2207744, 2572288,
                2207744, 2207744, 2207744, 2207744, 541, 541, 543, 543, 0, 0, 2166784, 0, 548, 549, 549, 0, 286,
                2158877, 2158877, 2158877, 2863389, 2892061, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877,
                2158877, 2158877, 2158877, 2158877, 2158877, 3186973, 2158877, 0, 0, 0, 0, 0, 0, 0, 0, 2367626, 2158877,
                2404637, 2412829, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877,
                2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2564381, 2158877, 2158877, 2605341,
                2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2679069, 2158877, 2695453, 2158877, 2703645,
                2158877, 2711837, 2752797, 2158877, 0, 2158877, 2158877, 2158877, 2384010, 2158730, 2158730, 2158730,
                2158730, 3006602, 2383872, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 3096576, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 0, 0,
                0, 0, 0, 0, 2162688, 0, 0, 2158877, 2785565, 2158877, 2810141, 2158877, 2158877, 2842909, 2158877,
                2158877, 2158877, 2900253, 2158877, 2158877, 2158877, 2158877, 2158877, 2531613, 2158877, 2158877,
                2158877, 2158877, 2158877, 2617629, 2158877, 2158877, 2158877, 2158877, 2158730, 2818186, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 3105053, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877,
                2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 0, 0, 0, 0, 0, 97, 97, 97, 1611, 97, 97, 97, 97,
                97, 97, 97, 1496, 97, 97, 1499, 97, 97, 97, 97, 97, 2441354, 2445450, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2502794, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2433162, 2158730, 2453642, 2461834, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2580618,
                2158730, 2158730, 2158730, 2158730, 2621578, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2699402, 2158730, 2158730, 2158730, 2158730, 2678922, 2158730, 2695306, 2158730, 2703498, 2158730,
                2711690, 2752650, 2158730, 2158730, 2785418, 2158730, 2158730, 2158730, 3113098, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 3186826, 2158730, 2207744, 2207744,
                2207744, 2207744, 2781184, 2793472, 2207744, 2818048, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 0, 541, 0, 543, 2158877, 2502941,
                2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2580765, 2158877, 2158877,
                2158877, 2158877, 2621725, 2158877, 3019037, 2158877, 3043613, 2158877, 2158877, 2158877, 2158877,
                3080477, 2158877, 2158877, 3113245, 2158877, 2158877, 2158877, 2158877, 0, 2158877, 2908445, 2158877,
                2158877, 2158877, 2978077, 2158877, 2158877, 2158877, 2158877, 3039517, 2158877, 2158730, 2510986,
                2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2584714, 2158730, 2609290, 2158730,
                2158730, 2629770, 2158730, 2158730, 2158730, 2388106, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2605194, 2158730, 2158730,
                2158730, 2158730, 2687114, 2158730, 2715786, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2867338, 2158730, 2904202, 2158730, 2158730, 2158730, 2642058, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2781322, 2793610, 2158730, 3121290,
                2158730, 2158730, 2158730, 3149962, 2158730, 2158730, 3170442, 3174538, 2158730, 2367488, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2441216, 2445312, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2502656, 2158877, 2433309, 2158877, 2453789, 2461981, 2158877, 2158877,
                2158877, 2158877, 2158877, 2158877, 2511133, 2158877, 2158877, 2158877, 2158877, 2584861, 2158877,
                2609437, 2158877, 2158877, 2629917, 2158877, 2158877, 2158877, 2687261, 2158877, 2715933, 2158877,
                2158730, 2158730, 2973834, 2158730, 2982026, 2158730, 2158730, 3002506, 2158730, 3047562, 3063946,
                3076234, 2158730, 2158730, 2158730, 2158730, 2207744, 2506752, 2207744, 2207744, 2207744, 2207744,
                2207744, 2158877, 2507037, 0, 0, 2158877, 2158730, 2158730, 2158730, 3203210, 2207744, 2207744, 2207744,
                2207744, 2207744, 2424832, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2564096, 2207744, 2207744, 2207744, 2707741, 2732317, 2158877,
                2158877, 2158877, 2822429, 2826525, 2158877, 2896157, 2158877, 2158877, 2924829, 2158877, 2158877,
                2973981, 2158877, 18, 0, 0, 0, 0, 0, 0, 0, 2211840, 0, 0, 642, 0, 2158592, 0, 45, 1529, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 1755, 45, 67, 67, 2982173, 2158877, 2158877, 3002653, 2158877,
                3047709, 3064093, 3076381, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 3203357,
                2523274, 2527370, 2158730, 2158730, 2576522, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2908298, 2494749, 2158877, 2158877, 2158877, 2523421, 2527517,
                2158877, 2158877, 2576669, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 0, 40976, 0, 18, 18,
                4321280, 2224253, 2232448, 4329472, 2232448, 2158730, 2498698, 2158730, 2158730, 2158730, 2158730,
                2568330, 2158730, 2592906, 2625674, 2158730, 2158730, 2674826, 2736266, 2158730, 2158730, 2158730,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                2207744, 2207744, 2207744, 2158730, 2912394, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 3109002, 2158730, 2158730, 3133578, 3145866, 3154058, 2375680, 2207744, 3108864, 2207744,
                2207744, 3133440, 3145728, 3153920, 2375965, 2380061, 2158877, 2158877, 2421021, 2158877, 2449693,
                2158877, 2158877, 2158877, 3117341, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 3104906, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158877, 2498845, 2158877, 2158877, 0, 2158877, 2158877, 2568477, 2158877, 2593053, 2625821,
                2158877, 2158877, 2674973, 0, 0, 0, 0, 97, 97, 1480, 97, 97, 97, 97, 97, 1485, 97, 97, 97, 0, 97, 97,
                1729, 97, 1731, 97, 97, 97, 97, 97, 97, 97, 311, 97, 97, 97, 97, 97, 97, 97, 97, 1520, 97, 97, 1523, 97,
                97, 1526, 97, 2736413, 2158877, 2158877, 0, 2158877, 2912541, 2158877, 2158877, 2158877, 2158877,
                2158877, 2158877, 2158877, 3109149, 2158877, 2158877, 3014941, 2158877, 2158877, 3051805, 2158877,
                2158877, 3100957, 2158877, 2158877, 3121437, 2158877, 2158877, 2158877, 3150109, 3133725, 3146013,
                3154205, 2158730, 2408586, 2416778, 2158730, 2465930, 2158730, 2158730, 2158730, 2158730, 2158730,
                2158730, 2158730, 2158730, 3018890, 2158730, 3043466, 2158730, 2158730, 2158730, 2158730, 3080330,
                2633866, 2658442, 2740362, 2744458, 2834570, 2949258, 2158730, 2986122, 2158730, 2998410, 2158730,
                2158730, 2158730, 3129482, 2207744, 2408448, 2949120, 2207744, 2985984, 2207744, 2998272, 2207744,
                2207744, 2207744, 3129344, 2158877, 2408733, 2416925, 2158877, 2466077, 2158877, 2158877, 3170589,
                3174685, 2158877, 0, 0, 0, 2158730, 2158730, 2158730, 2158730, 2158730, 2424970, 2158730, 2158730,
                2158730, 2158730, 2707594, 2732170, 2158730, 2158730, 2158730, 2822282, 2826378, 2158730, 2896010,
                2158730, 2158730, 2924682, 2949405, 2158877, 2986269, 2158877, 2998557, 2158877, 2158877, 2158877,
                3129629, 2158730, 2158730, 2478218, 2158730, 2158730, 2158730, 2535562, 2543754, 2158730, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 3117194, 2207744, 2207744, 2478080,
                2207744, 2207744, 2207744, 2207744, 3014656, 2207744, 2207744, 3051520, 2207744, 2207744, 3100672,
                2207744, 2207744, 3121152, 2207744, 2207744, 2207744, 2207744, 2207744, 2584576, 2207744, 2609152,
                2207744, 2207744, 2629632, 2207744, 2207744, 2207744, 2686976, 2207744, 2207744, 2535424, 2543616,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 3117056, 2158877,
                2158877, 2478365, 0, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158730, 2158730, 2482314,
                2158730, 2158730, 2158730, 2158730, 2158730, 2158730, 2207744, 2207744, 2207744, 2387968, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 0,
                823, 0, 825, 2158730, 2158730, 2158730, 2990218, 2158730, 2158730, 2207744, 2207744, 2482176, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 0, 0, 0, 0, 0, 0, 2162688, 135, 0, 2207744,
                2207744, 2990080, 2207744, 2207744, 2158877, 2158877, 2482461, 2158877, 2158877, 0, 0, 0, 2158877,
                2158877, 2158877, 2158877, 2158877, 2158730, 2429066, 2158730, 2515082, 2158730, 2588810, 2158730,
                2838666, 2158730, 2158730, 2158730, 3010698, 2207744, 2428928, 2207744, 2514944, 2207744, 2588672,
                2207744, 2838528, 2207744, 2207744, 2207744, 3010560, 2158877, 2429213, 2158877, 2515229, 0, 0, 2158877,
                2588957, 2158877, 0, 2838813, 2158877, 2158877, 2158877, 3010845, 2158730, 2506890, 2158730, 2158730,
                2158730, 2748554, 2756746, 2777226, 2801802, 2158730, 2158730, 2158730, 2863242, 2891914, 2158730,
                2158730, 2158730, 2158730, 2158730, 2158730, 2564234, 2158730, 2158730, 2158730, 2158730, 2158730,
                2597002, 2158730, 2158730, 2158730, 3006464, 2384157, 0, 0, 2158877, 2158877, 2158877, 2158877, 3006749,
                2158730, 2637962, 2953354, 2158730, 2207744, 2637824, 2953216, 2207744, 0, 0, 2158877, 2638109, 2953501,
                2158877, 2539658, 2158730, 2539520, 2207744, 0, 0, 2539805, 2158877, 2158730, 2158730, 2158730, 2977930,
                2158730, 2158730, 2158730, 2158730, 3039370, 2158730, 2158730, 2158730, 2158730, 2158730, 2158730,
                3158154, 2207744, 0, 2158877, 2158730, 2207744, 0, 2158877, 2158730, 2207744, 0, 2158877, 2965642,
                2965504, 2965789, 0, 0, 0, 0, 1315, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 1484, 97, 97, 97, 97,
                2158592, 18, 0, 122880, 0, 0, 0, 77824, 0, 2211840, 0, 0, 0, 0, 2158592, 0, 356, 0, 0, 0, 0, 0, 0,
                28809, 0, 139, 45, 45, 45, 45, 45, 45, 1751, 45, 45, 45, 45, 45, 45, 45, 67, 67, 1427, 67, 67, 67, 67,
                67, 1432, 67, 67, 67, 3104768, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 122880, 0, 0, 0, 0, 1315, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 1322,
                550, 0, 286, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2424832, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 0, 40976, 0, 18, 18, 24, 24, 4329472, 27, 27, 2207744, 2207744, 2977792,
                2207744, 2207744, 2207744, 2207744, 3039232, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744,
                3158016, 542, 0, 0, 0, 542, 0, 544, 0, 0, 0, 544, 0, 550, 0, 0, 0, 0, 0, 97, 97, 1610, 97, 97, 97, 97,
                97, 97, 97, 97, 898, 97, 97, 97, 97, 97, 97, 97, 0, 94242, 0, 0, 0, 2211840, 0, 0, 0, 0, 0, 0, 2158592,
                2158592, 2158592, 2158592, 2158592, 2424832, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                40976, 18, 36884, 45078, 24, 27, 90143, 94242, 237568, 102439, 106538, 98347, 0, 0, 20480, 40976, 18,
                36884, 45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 192512, 40976, 18, 36884, 45078, 24,
                27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 94, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0,
                102439, 106538, 98347, 0, 0, 96, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0, 102439, 106538,
                98347, 0, 0, 12378, 40976, 18, 18, 36884, 0, 45078, 0, 24, 24, 24, 126, 126, 126, 126, 90143, 0, 0,
                2170880, 0, 0, 0, 0, 2158592, 2158592, 2158592, 2387968, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 20480, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 40976, 18, 36884, 45078, 24, 27, 90143, 94242,
                241664, 102439, 106538, 98347, 0, 0, 20568, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0, 102439,
                106538, 98347, 0, 0, 200797, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0,
                0, 20480, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0, 0, 0, 44, 0, 0, 20575, 40976, 18, 36884,
                45078, 24, 27, 90143, 94242, 0, 41, 41, 41, 0, 0, 1126400, 40976, 18, 36884, 45078, 24, 27, 90143,
                94242, 0, 102439, 106538, 98347, 0, 0, 0, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0, 102439,
                106538, 98347, 0, 0, 89, 40976, 18, 18, 36884, 0, 45078, 0, 24, 24, 24, 27, 131201, 27, 27, 90143, 0, 0,
                2170880, 0, 0, 550, 0, 2158592, 2158592, 2158592, 2387968, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2441216, 2445312, 2158592, 2158592,
                2158592, 2158592, 2158592, 0, 94242, 0, 0, 208896, 2211840, 102439, 0, 0, 106538, 98347, 0, 2158592,
                2158592, 2158592, 2158592, 2158592, 3186688, 2158592, 0, 0, 0, 0, 0, 0, 0, 0, 2367488, 32768, 0, 0, 0,
                0, 0, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2433024,
                2158592, 2453504, 2461696, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2510848, 2158592,
                2158592, 2158592, 2158592, 40976, 18, 36884, 245783, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0,
                0, 20480, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 221184, 40976,
                18, 36884, 45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 180224, 40976, 18, 18, 36884,
                155648, 45078, 0, 24, 24, 217088, 27, 27, 27, 217088, 90143, 0, 0, 2170880, 0, 0, 828, 0, 2158592,
                2158592, 2158592, 2387968, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2207744, 2207744,
                2207744, 2387968, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 2207744, 0, 0, 0, 0, 0, 0,
                2162688, 233472, 0, 0, 94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347, 28809, 45, 45, 45, 45, 45, 718,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 727, 131427, 0, 0, 0, 0, 362, 0, 365, 28809, 367, 139, 45, 45, 45,
                45, 45, 45, 1808, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 97, 97, 0, 0, 97, 67, 24850, 24850, 12564,
                12564, 0, 57889, 0, 0, 0, 53531, 53531, 367, 286, 97, 97, 0, 0, 97, 97, 97, 97, 97, 97, 1787, 0, 97, 97,
                0, 97, 97, 97, 45, 45, 45, 45, 2029, 45, 67, 67, 67, 67, 2033, 57889, 0, 0, 54074, 54074, 550, 0, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 45, 1798, 45, 45, 1800, 45, 45, 0, 1472, 0, 0, 0, 0, 0, 1474, 0, 0, 0,
                0, 0, 1476, 0, 0, 0, 0, 1315, 0, 0, 0, 0, 97, 97, 97, 97, 1320, 97, 97, 0, 0, 97, 97, 97, 97, 1786, 97,
                0, 0, 97, 97, 0, 1790, 1527, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 663, 67, 24850,
                24850, 12564, 12564, 0, 57889, 281, 0, 0, 53531, 53531, 367, 286, 97, 97, 0, 0, 97, 97, 97, 1785, 97,
                97, 0, 0, 97, 97, 0, 97, 97, 1979, 97, 97, 45, 45, 1983, 45, 1984, 45, 45, 45, 45, 45, 652, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 690, 45, 45, 694, 45, 45, 40976, 19, 36884, 45078, 24, 27, 90143, 94242, 0,
                102439, 106538, 98347, 0, 0, 262144, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538,
                98347, 46, 67, 98, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 45, 67, 97,
                40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 258048, 40976, 18, 36884,
                45078, 24, 27, 90143, 94242, 0, 102439, 106538, 98347, 0, 0, 1122423, 40976, 18, 36884, 45078, 24, 27,
                90143, 94242, 0, 1114152, 1114152, 1114152, 0, 0, 1114112, 40976, 18, 36884, 45078, 24, 27, 90143,
                94242, 37, 102439, 106538, 98347, 0, 0, 204800, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 0,
                102439, 106538, 98347, 0, 0, 57436, 40976, 18, 36884, 45078, 24, 27, 33, 33, 0, 33, 33, 33, 0, 0, 0,
                40976, 18, 18, 36884, 0, 45078, 0, 124, 124, 124, 127, 127, 127, 127, 90143, 0, 0, 2170880, 0, 0, 550,
                0, 2158877, 2158877, 2158877, 2388253, 2158877, 2158877, 2158877, 2158877, 2158877, 2781469, 2793757,
                2158877, 2818333, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2867485, 2158877,
                2904349, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 3096861, 2158877, 2158877,
                2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2441501, 2445597, 2158877, 2158877,
                2158877, 2158877, 2158877, 40976, 122, 123, 36884, 0, 45078, 0, 24, 24, 24, 27, 27, 27, 27, 90143, 0,
                921, 29315, 0, 0, 0, 0, 45, 45, 45, 45, 45, 45, 45, 45, 936, 2158592, 4243810, 0, 0, 0, 0, 0, 0, 0,
                2211840, 0, 0, 0, 0, 2158592, 0, 921, 29315, 0, 0, 0, 0, 45, 45, 45, 45, 45, 45, 45, 935, 45, 45, 45,
                715, 45, 45, 45, 45, 45, 45, 45, 723, 45, 45, 45, 45, 45, 1182, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                430, 45, 45, 45, 45, 45, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 47,
                68, 99, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 48, 69, 100, 40976,
                18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 49, 70, 101, 40976, 18, 36884, 45078,
                24, 27, 90143, 94242, 38, 102439, 106538, 98347, 50, 71, 102, 40976, 18, 36884, 45078, 24, 27, 90143,
                94242, 38, 102439, 106538, 98347, 51, 72, 103, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38,
                102439, 106538, 98347, 52, 73, 104, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538,
                98347, 53, 74, 105, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 54, 75,
                106, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 55, 76, 107, 40976, 18,
                36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 56, 77, 108, 40976, 18, 36884, 45078, 24,
                27, 90143, 94242, 38, 102439, 106538, 98347, 57, 78, 109, 40976, 18, 36884, 45078, 24, 27, 90143, 94242,
                38, 102439, 106538, 98347, 58, 79, 110, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439,
                106538, 98347, 59, 80, 111, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347,
                60, 81, 112, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 61, 82, 113,
                40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 62, 83, 114, 40976, 18, 36884,
                45078, 24, 27, 90143, 94242, 38, 102439, 106538, 98347, 63, 84, 115, 40976, 18, 36884, 45078, 24, 27,
                90143, 94242, 38, 102439, 106538, 98347, 64, 85, 116, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38,
                102439, 106538, 98347, 65, 86, 117, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 38, 102439, 106538,
                98347, 66, 87, 118, 40976, 18, 36884, 45078, 24, 27, 90143, 94242, 118820, 102439, 106538, 98347,
                118820, 118820, 118820, 40976, 18, 18, 0, 0, 45078, 0, 24, 24, 24, 27, 27, 27, 27, 90143, 0, 0, 1314, 0,
                0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 1321, 97, 18, 131427, 0, 0, 0, 0, 0, 0, 362, 0, 0, 365, 0, 367, 0, 0,
                1315, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1360, 97, 97, 131, 94242, 0, 0, 0, 38,
                102439, 0, 0, 106538, 98347, 28809, 45, 45, 45, 145, 149, 45, 45, 45, 45, 45, 174, 45, 179, 45, 185, 45,
                188, 45, 45, 202, 67, 255, 67, 67, 269, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531, 97, 97, 97,
                292, 296, 97, 97, 97, 97, 97, 321, 97, 326, 97, 332, 97, 18, 131427, 0, 0, 0, 0, 0, 0, 362, 0, 0, 365,
                29315, 367, 646, 335, 97, 97, 349, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 437, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 523, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 511, 67, 67, 67, 97, 97, 97, 620, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                1501, 1502, 97, 793, 67, 67, 796, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 808, 67, 0, 0, 97, 97, 97, 97,
                45, 45, 67, 67, 0, 0, 97, 97, 2052, 67, 67, 67, 67, 813, 67, 67, 67, 67, 67, 67, 67, 25398, 542, 13112,
                544, 57889, 0, 0, 54074, 54074, 550, 830, 97, 97, 97, 97, 97, 97, 97, 97, 97, 315, 97, 97, 97, 97, 97,
                97, 841, 97, 97, 97, 97, 97, 97, 97, 97, 97, 854, 97, 97, 97, 97, 97, 97, 589, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 867, 97, 97, 97, 97, 97, 97, 97, 891, 97, 97, 894, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                906, 45, 937, 45, 45, 940, 45, 45, 45, 45, 45, 45, 948, 45, 45, 45, 45, 45, 734, 735, 67, 737, 67, 738,
                67, 740, 67, 67, 67, 45, 967, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 435, 45, 45, 45,
                980, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 415, 45, 45, 67, 67, 1024, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 97, 97, 97, 67, 67, 67, 67, 67, 25398, 1081, 13112, 1085, 54074, 1089,
                0, 0, 0, 0, 0, 0, 363, 0, 28809, 0, 139, 45, 45, 45, 45, 45, 45, 1674, 45, 45, 45, 45, 45, 45, 45, 45,
                67, 1913, 67, 1914, 67, 67, 67, 1918, 67, 67, 97, 97, 97, 97, 1118, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 630, 97, 97, 97, 97, 97, 1169, 97, 97, 97, 97, 97, 0, 921, 0, 1175, 0, 0, 0, 0, 45, 45, 45, 45,
                45, 45, 1534, 45, 45, 45, 45, 45, 1538, 45, 45, 45, 45, 1233, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67,
                67, 67, 67, 67, 742, 67, 45, 45, 1191, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 454, 67, 67,
                67, 67, 1243, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1251, 67, 0, 0, 97, 97, 97, 97, 45, 45, 67,
                67, 2050, 0, 97, 97, 45, 45, 45, 732, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 97, 97,
                67, 67, 67, 1284, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 772, 67, 67, 67, 1293, 67, 67, 67, 67,
                67, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 368, 2158592, 2158592, 2158592, 2404352, 2412544, 1323, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 1331, 97, 97, 97, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                1737, 97, 1364, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1373, 97, 18, 131427, 0, 0, 0, 0, 0, 0,
                362, 0, 0, 365, 29315, 367, 647, 45, 45, 1387, 45, 45, 1391, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                410, 45, 45, 45, 45, 45, 1400, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1407, 45, 45, 45, 45, 45, 941,
                45, 943, 45, 45, 45, 45, 45, 45, 951, 45, 67, 1438, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1447, 67,
                67, 67, 67, 67, 67, 782, 67, 67, 67, 67, 67, 67, 67, 67, 67, 756, 67, 67, 67, 67, 67, 67, 97, 1491, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 1500, 97, 97, 97, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1736,
                97, 45, 45, 1541, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 677, 45, 45, 67, 1581, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 791, 792, 67, 67, 67, 67, 1598, 67, 1600, 67, 67, 67, 67,
                67, 67, 67, 67, 1472, 97, 97, 97, 1727, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1513, 97,
                97, 67, 67, 97, 1879, 97, 1881, 97, 0, 1884, 0, 97, 97, 97, 97, 0, 0, 97, 97, 97, 97, 97, 0, 0, 0, 1842,
                97, 97, 67, 67, 67, 67, 67, 97, 97, 97, 97, 1928, 0, 0, 0, 97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45,
                1903, 45, 45, 45, 67, 67, 67, 67, 97, 97, 97, 97, 1971, 0, 0, 97, 97, 97, 97, 0, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 0, 0, 0, 45, 45, 45, 1381, 45, 45, 45, 45, 1976, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 1747, 809, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 25398, 542, 13112, 544,
                97, 907, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 638, 0, 0, 0, 0, 1478, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 1150, 97, 97, 97, 97, 67, 67, 67, 67, 1244, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                477, 67, 67, 67, 67, 67, 67, 1294, 67, 67, 67, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 1324, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 1374,
                97, 97, 97, 97, 0, 1175, 0, 45, 45, 45, 45, 45, 45, 45, 45, 945, 45, 45, 45, 45, 45, 45, 45, 45, 1908,
                45, 45, 1910, 45, 67, 67, 67, 67, 67, 67, 67, 67, 1919, 67, 0, 0, 97, 97, 97, 97, 45, 2048, 67, 2049, 0,
                0, 97, 2051, 45, 45, 45, 939, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 397, 45, 45, 45, 1921, 67,
                67, 1923, 67, 97, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 1947, 45, 1935, 0, 0,
                0, 97, 1939, 97, 97, 1941, 97, 45, 45, 45, 45, 45, 45, 382, 389, 45, 45, 45, 45, 45, 45, 45, 45, 1810,
                45, 45, 1812, 67, 67, 67, 67, 67, 256, 67, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531,
                336, 97, 97, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 131427, 0, 0, 0, 0, 362, 0, 365,
                28809, 367, 139, 45, 45, 371, 373, 45, 45, 45, 955, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 413,
                45, 45, 45, 457, 459, 67, 67, 67, 67, 67, 67, 67, 67, 473, 67, 478, 67, 67, 482, 67, 67, 485, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 97, 1828, 97, 554, 556, 97, 97, 97, 97, 97, 97, 97, 97, 570,
                97, 575, 97, 97, 579, 97, 97, 582, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 330, 97, 97, 67,
                746, 67, 67, 67, 67, 67, 67, 67, 67, 67, 758, 67, 67, 67, 67, 67, 67, 67, 1575, 67, 67, 67, 67, 67, 67,
                67, 67, 493, 67, 67, 67, 67, 67, 67, 67, 97, 97, 844, 97, 97, 97, 97, 97, 97, 97, 97, 97, 856, 97, 97,
                97, 0, 97, 97, 97, 97, 97, 97, 97, 97, 1735, 97, 97, 97, 0, 97, 97, 97, 97, 97, 97, 97, 1642, 97, 1644,
                97, 97, 890, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 67, 67, 67, 67, 1065,
                1066, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 532, 67, 67, 67, 67, 67, 67, 67, 1451, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 496, 67, 67, 97, 97, 1505, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 593, 97, 97, 0, 1474, 0, 1476, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1617, 97, 97, 1635, 0,
                1637, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 885, 97, 97, 97, 97, 67, 67, 1704, 67, 67, 67, 67, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 565, 572, 97, 97, 97, 97, 97, 97, 97, 97, 1832, 0, 97, 97, 97, 97, 97,
                0, 0, 0, 97, 97, 97, 97, 97, 97, 45, 45, 45, 1946, 45, 45, 67, 67, 67, 67, 67, 97, 1926, 97, 1927, 97,
                0, 0, 0, 97, 97, 1934, 2043, 0, 0, 97, 97, 97, 2047, 45, 45, 67, 67, 0, 1832, 97, 97, 45, 45, 45, 981,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1227, 45, 45, 45, 131427, 0, 0, 0, 0, 362, 0, 365,
                28809, 367, 139, 45, 45, 372, 45, 45, 45, 45, 1661, 1662, 45, 45, 45, 45, 45, 1666, 45, 45, 45, 45, 45,
                1673, 45, 1675, 45, 45, 45, 45, 45, 45, 45, 67, 1426, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1275, 67,
                67, 67, 67, 67, 45, 418, 45, 45, 420, 45, 45, 423, 45, 45, 45, 45, 45, 45, 45, 45, 959, 45, 45, 962, 45,
                45, 45, 45, 458, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 483, 67, 67, 67, 67, 504, 67,
                67, 506, 67, 67, 509, 67, 67, 67, 67, 67, 67, 67, 528, 67, 67, 67, 67, 67, 67, 67, 67, 1287, 67, 67, 67,
                67, 67, 67, 67, 555, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 580, 97, 97, 97, 97, 601,
                97, 97, 603, 97, 97, 606, 97, 97, 97, 97, 97, 97, 848, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1498, 97, 97,
                97, 97, 97, 97, 45, 45, 714, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 989, 990, 45, 67, 67,
                67, 67, 67, 1011, 67, 67, 67, 67, 1015, 67, 67, 67, 67, 67, 67, 67, 753, 67, 67, 67, 67, 67, 67, 67, 67,
                467, 67, 67, 67, 67, 67, 67, 67, 45, 45, 1179, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1003,
                1004, 67, 1217, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 728, 67, 1461, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1034, 67, 97, 1516, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 871, 97, 67, 67, 67, 1705, 67, 67, 67, 97, 97, 97, 97, 97, 97, 97, 97, 97, 567, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 1715, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0, 45, 45, 1380, 45, 45,
                45, 45, 45, 67, 67, 97, 97, 97, 97, 97, 0, 0, 0, 97, 1887, 97, 97, 0, 0, 97, 97, 97, 0, 97, 97, 97, 97,
                97, 2006, 45, 45, 1907, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1920, 67, 97, 0, 2035,
                97, 97, 97, 97, 97, 45, 45, 45, 45, 67, 67, 67, 1428, 67, 67, 67, 67, 67, 67, 1435, 67, 0, 94242, 0, 0,
                0, 38, 102439, 0, 0, 106538, 98347, 28809, 45, 45, 45, 146, 45, 152, 45, 45, 165, 45, 175, 45, 180, 45,
                45, 187, 190, 195, 45, 203, 254, 257, 262, 67, 270, 67, 67, 0, 24850, 12564, 0, 0, 0, 281, 28809, 53531,
                97, 97, 97, 293, 97, 299, 97, 97, 312, 97, 322, 97, 327, 97, 97, 334, 337, 342, 97, 350, 97, 97, 0,
                40976, 0, 18, 18, 24, 24, 27, 27, 27, 67, 484, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 499,
                97, 581, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 596, 648, 45, 650, 45, 651, 45, 653, 45,
                45, 45, 657, 45, 45, 45, 45, 45, 45, 1954, 67, 67, 67, 1958, 67, 67, 67, 67, 67, 67, 67, 768, 67, 67,
                67, 67, 67, 67, 67, 67, 769, 67, 67, 67, 67, 67, 67, 67, 680, 45, 45, 45, 45, 45, 45, 45, 45, 688, 689,
                691, 45, 45, 45, 45, 45, 983, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 947, 45, 45, 45, 45, 952, 45, 45,
                698, 699, 45, 45, 702, 703, 45, 45, 45, 45, 45, 45, 45, 711, 744, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                757, 67, 67, 67, 67, 761, 67, 67, 67, 67, 765, 67, 767, 67, 67, 67, 67, 67, 67, 67, 67, 775, 776, 778,
                67, 67, 67, 67, 67, 67, 785, 786, 67, 67, 789, 790, 67, 67, 67, 67, 67, 67, 1442, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 97, 97, 97, 1775, 97, 97, 97, 67, 67, 67, 67, 67, 798, 67, 67, 67, 802, 67, 67, 67, 67,
                67, 67, 67, 67, 1465, 67, 67, 1468, 67, 67, 1471, 67, 67, 810, 67, 67, 67, 67, 67, 67, 67, 67, 67, 821,
                25398, 542, 13112, 544, 57889, 0, 0, 54074, 54074, 550, 0, 833, 97, 835, 97, 836, 97, 838, 97, 97, 0, 0,
                97, 97, 97, 2002, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 1740, 45, 45, 45, 1744, 45, 45, 45, 97, 842,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 855, 97, 97, 97, 97, 0, 1717, 1718, 97, 97, 97, 97, 97, 1722, 97, 0,
                0, 859, 97, 97, 97, 97, 863, 97, 865, 97, 97, 97, 97, 97, 97, 97, 97, 604, 97, 97, 97, 97, 97, 97, 97,
                873, 874, 876, 97, 97, 97, 97, 97, 97, 883, 884, 97, 97, 887, 888, 97, 18, 131427, 0, 0, 0, 0, 0, 0,
                362, 225280, 0, 365, 0, 367, 0, 45, 45, 45, 1531, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1199, 45,
                45, 45, 45, 45, 97, 97, 908, 97, 97, 97, 97, 97, 97, 97, 97, 97, 919, 638, 0, 0, 0, 0, 2158877, 2158877,
                2158877, 2158877, 2158877, 2425117, 2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2597149,
                2158877, 2158877, 2158877, 2158877, 2158877, 2158877, 2642205, 2158877, 2158877, 2158877, 2158877,
                2158877, 3158301, 0, 2375818, 2379914, 2158730, 2158730, 2420874, 2158730, 2449546, 2158730, 2158730,
                953, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 965, 978, 45, 45, 45, 45, 45, 45, 985,
                45, 45, 45, 45, 45, 45, 45, 45, 971, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 1027, 67, 1029, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 1455, 67, 67, 67, 67, 67, 67, 67, 1077, 1078, 67, 67, 25398, 0, 13112,
                0, 54074, 0, 0, 0, 0, 0, 0, 0, 0, 366, 0, 139, 2158730, 2158730, 2158730, 2404490, 2412682, 1113, 97,
                97, 97, 97, 97, 97, 1121, 97, 1123, 97, 97, 97, 97, 97, 97, 0, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 1540, 1155, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 615, 1168, 97,
                97, 1171, 1172, 97, 97, 0, 921, 0, 1175, 0, 0, 0, 0, 45, 45, 45, 45, 45, 1533, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 1663, 45, 45, 45, 45, 45, 45, 45, 45, 45, 183, 45, 45, 45, 45, 201, 45, 45, 45, 1219, 45,
                45, 45, 45, 45, 45, 45, 1226, 45, 45, 45, 45, 45, 168, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 427, 45,
                45, 45, 45, 45, 45, 45, 1231, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 1242, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1046, 67, 67, 1254, 67, 1256, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 806, 807, 67, 67, 97, 1336, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 1111, 97, 97, 97, 97, 97, 1351, 97, 97, 97, 1354, 97, 97, 97, 1359, 97, 97, 97, 0,
                97, 97, 97, 97, 1640, 97, 97, 97, 97, 97, 97, 97, 897, 97, 97, 97, 902, 97, 97, 97, 97, 97, 97, 97, 97,
                1366, 97, 97, 97, 97, 97, 97, 97, 1371, 97, 97, 97, 0, 97, 97, 97, 1730, 97, 97, 97, 97, 97, 97, 97, 97,
                915, 97, 97, 97, 97, 0, 360, 0, 67, 67, 67, 1440, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1017,
                67, 1019, 67, 67, 67, 67, 67, 1453, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1459, 97, 97, 97, 1493, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1525, 97, 97, 97, 97, 97, 97, 1507, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 1514, 67, 67, 67, 67, 1584, 67, 67, 67, 67, 67, 1590, 67, 67, 67, 67, 67, 67, 67,
                783, 67, 67, 67, 788, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1599, 1601, 67, 67, 67, 1604, 67, 1606, 1607,
                67, 1472, 0, 1474, 0, 1476, 0, 97, 97, 97, 97, 97, 97, 1614, 97, 97, 97, 97, 45, 45, 1850, 45, 45, 45,
                45, 1855, 45, 45, 45, 45, 45, 1222, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1229, 97, 1618, 97, 97, 97, 97,
                97, 97, 97, 1625, 97, 97, 97, 97, 97, 0, 1175, 0, 45, 45, 45, 45, 45, 45, 45, 45, 447, 45, 45, 45, 45,
                45, 67, 67, 1633, 97, 97, 0, 97, 97, 97, 97, 97, 97, 97, 97, 1643, 1645, 97, 97, 0, 0, 97, 97, 1784, 97,
                97, 97, 0, 0, 97, 97, 0, 97, 1894, 1895, 97, 1897, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 656, 45, 45,
                45, 45, 45, 45, 97, 1648, 97, 1650, 1651, 97, 0, 45, 45, 45, 1654, 45, 45, 45, 45, 45, 169, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 658, 45, 45, 45, 45, 664, 45, 45, 1659, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 1187, 45, 45, 1669, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 1005,
                67, 67, 1681, 67, 67, 67, 67, 67, 67, 67, 1686, 67, 67, 67, 67, 67, 67, 67, 784, 67, 67, 67, 67, 67, 67,
                67, 67, 1055, 67, 67, 67, 67, 1060, 67, 67, 97, 97, 1713, 97, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0,
                0, 0, 1378, 45, 45, 45, 45, 45, 45, 45, 408, 45, 45, 45, 45, 45, 45, 45, 45, 1547, 45, 1549, 45, 45, 45,
                45, 45, 97, 97, 1780, 0, 97, 97, 97, 97, 97, 97, 0, 0, 97, 97, 0, 97, 97, 97, 45, 45, 2027, 2028, 45,
                45, 67, 67, 2031, 2032, 67, 45, 45, 1804, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 1917,
                67, 67, 67, 67, 67, 67, 67, 1819, 67, 67, 67, 67, 67, 67, 67, 67, 97, 97, 97, 1708, 97, 97, 97, 97, 97,
                45, 45, 1862, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 497, 67, 67, 67, 1877, 97, 97, 97, 97,
                97, 0, 0, 0, 97, 97, 97, 97, 0, 0, 97, 97, 97, 97, 97, 1839, 0, 0, 97, 97, 97, 97, 1936, 0, 0, 97, 97,
                97, 97, 97, 97, 1943, 1944, 1945, 45, 45, 45, 45, 670, 45, 45, 45, 45, 674, 45, 45, 45, 45, 678, 45,
                1948, 45, 1950, 45, 45, 45, 45, 1955, 1956, 1957, 67, 67, 67, 1960, 67, 1962, 67, 67, 67, 67, 1967,
                1968, 1969, 97, 0, 0, 0, 97, 97, 1974, 97, 0, 1936, 0, 97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45,
                45, 45, 1906, 0, 1977, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1746, 45, 45, 45, 45,
                2011, 67, 67, 2013, 67, 67, 67, 2017, 97, 97, 0, 0, 2021, 97, 8192, 97, 97, 2025, 45, 45, 45, 45, 45,
                45, 67, 67, 67, 67, 67, 1916, 67, 67, 67, 67, 0, 94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347, 28809,
                45, 45, 140, 45, 45, 45, 1180, 45, 45, 45, 45, 1184, 45, 45, 45, 45, 45, 45, 45, 387, 45, 392, 45, 45,
                396, 45, 45, 399, 45, 45, 67, 207, 67, 67, 67, 67, 67, 67, 236, 67, 67, 67, 67, 67, 67, 67, 800, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 1603, 67, 67, 67, 67, 67, 0, 97, 97, 287, 97, 97, 97, 97, 97, 97, 316, 97,
                97, 97, 97, 97, 97, 0, 45, 45, 45, 45, 45, 45, 45, 1656, 1657, 45, 376, 45, 45, 45, 45, 45, 388, 45, 45,
                45, 45, 45, 45, 45, 45, 1406, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 462, 67, 67, 67, 67, 67, 474,
                67, 67, 67, 67, 67, 67, 67, 817, 67, 67, 67, 67, 25398, 542, 13112, 544, 97, 97, 97, 97, 559, 97, 97,
                97, 97, 97, 571, 97, 97, 97, 97, 97, 97, 896, 97, 97, 97, 900, 97, 97, 97, 97, 97, 97, 912, 914, 97, 97,
                97, 97, 97, 0, 0, 0, 45, 45, 45, 45, 45, 45, 45, 45, 391, 45, 45, 45, 45, 45, 45, 45, 45, 713, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 662, 45, 1140, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 636, 67, 67, 1283, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 513, 67, 67,
                1363, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 889, 97, 97, 97, 1714, 0, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 0, 0, 926, 45, 45, 45, 45, 45, 45, 45, 45, 672, 45, 45, 45, 45, 45, 45, 45, 45,
                686, 45, 45, 45, 45, 45, 45, 45, 45, 944, 45, 45, 45, 45, 45, 45, 45, 45, 1676, 45, 45, 45, 45, 45, 45,
                67, 97, 97, 97, 1833, 0, 97, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 1902, 45,
                45, 45, 45, 45, 957, 45, 45, 45, 45, 961, 45, 963, 45, 45, 45, 67, 97, 2034, 0, 97, 97, 97, 97, 97,
                2040, 45, 45, 45, 2042, 67, 67, 67, 67, 67, 67, 1574, 67, 67, 67, 67, 67, 1578, 67, 67, 67, 67, 67, 67,
                799, 67, 67, 67, 804, 67, 67, 67, 67, 67, 67, 67, 1298, 0, 0, 0, 1304, 0, 0, 0, 1310, 132, 94242, 0, 0,
                0, 38, 102439, 0, 0, 106538, 98347, 28809, 45, 45, 45, 45, 45, 1414, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 428, 45, 45, 45, 45, 45, 57889, 0, 0, 54074, 54074, 550, 831, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                568, 97, 97, 97, 97, 578, 97, 45, 45, 968, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1228, 45,
                45, 67, 67, 67, 67, 67, 25398, 1082, 13112, 1086, 54074, 1090, 0, 0, 0, 0, 0, 0, 364, 0, 0, 0, 139,
                2158592, 2158592, 2158592, 2404352, 2412544, 67, 67, 67, 67, 1464, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 510, 67, 67, 67, 67, 97, 97, 97, 97, 1519, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 918, 97,
                0, 0, 0, 0, 1528, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 976, 45, 1554, 45, 45, 45, 45,
                45, 45, 45, 45, 1562, 45, 45, 1565, 45, 45, 45, 45, 683, 45, 45, 45, 687, 45, 45, 692, 45, 45, 45, 45,
                45, 1953, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1014, 67, 67, 67, 67, 67, 67, 1568, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 0, 67, 67, 67, 67, 67, 1585, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 1594, 97, 97, 1649, 97, 97, 97, 0, 45, 45, 1653, 45, 45, 45, 45, 45, 45, 383, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 986, 45, 45, 45, 45, 45, 45, 45, 45, 1670, 45, 1672, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 67, 736, 67, 67, 67, 67, 67, 741, 67, 67, 67, 1680, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 1074, 67, 67, 67, 1692, 67, 67, 67, 67, 67, 67, 67, 1697, 67, 1699, 67, 67, 67, 67, 67, 67,
                1012, 67, 67, 67, 67, 67, 67, 67, 67, 67, 468, 475, 67, 67, 67, 67, 67, 67, 1769, 67, 67, 67, 67, 67,
                67, 67, 97, 97, 97, 97, 97, 97, 97, 624, 97, 97, 97, 97, 97, 97, 634, 97, 97, 1792, 97, 97, 97, 97, 97,
                97, 97, 45, 45, 45, 45, 45, 45, 45, 958, 45, 45, 45, 45, 45, 45, 964, 45, 150, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 977, 204, 45, 67, 67, 67, 217, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 787, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 271, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531, 97,
                97, 97, 97, 351, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 45, 45, 938, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 1398, 45, 45, 45, 153, 45, 161, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                660, 661, 45, 45, 205, 45, 67, 67, 67, 67, 220, 67, 228, 67, 67, 67, 67, 67, 67, 67, 0, 0, 0, 0, 0, 280,
                94, 0, 0, 67, 67, 67, 67, 67, 272, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531, 97, 97, 97, 97, 352,
                97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 45, 439, 45, 45, 45, 45, 45, 445, 45, 45, 45, 452, 45, 45,
                67, 67, 212, 216, 67, 67, 67, 67, 67, 241, 67, 246, 67, 252, 67, 67, 486, 67, 67, 67, 67, 67, 67, 67,
                494, 67, 67, 67, 67, 67, 67, 67, 1245, 67, 67, 67, 67, 67, 67, 67, 67, 1013, 67, 67, 1016, 67, 67, 67,
                67, 67, 521, 67, 67, 525, 67, 67, 67, 67, 67, 531, 67, 67, 67, 538, 67, 0, 0, 2046, 97, 97, 97, 45, 45,
                67, 67, 0, 0, 97, 97, 45, 45, 45, 1192, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1418, 45, 45,
                1421, 97, 97, 583, 97, 97, 97, 97, 97, 97, 97, 591, 97, 97, 97, 97, 97, 97, 913, 97, 97, 97, 97, 97, 97,
                0, 0, 0, 45, 45, 45, 45, 45, 45, 45, 1384, 97, 618, 97, 97, 622, 97, 97, 97, 97, 97, 628, 97, 97, 97,
                635, 97, 18, 131427, 0, 0, 0, 639, 0, 132, 362, 0, 0, 365, 29315, 367, 0, 921, 29315, 0, 0, 0, 0, 45,
                45, 45, 45, 932, 45, 45, 45, 45, 45, 1544, 45, 45, 45, 45, 45, 1550, 45, 45, 45, 45, 45, 1194, 45, 1196,
                45, 45, 45, 45, 45, 45, 45, 45, 999, 45, 45, 45, 45, 45, 67, 67, 45, 45, 667, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 1408, 45, 45, 45, 696, 45, 45, 45, 701, 45, 45, 45, 45, 45, 45, 45, 45, 710,
                45, 45, 45, 1220, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 194, 45, 45, 45, 729, 45, 45, 45, 45,
                45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 797, 67, 67, 67, 67, 67, 67,
                805, 67, 67, 67, 67, 67, 67, 67, 1587, 67, 1589, 67, 67, 67, 67, 67, 67, 67, 67, 1763, 67, 67, 67, 67,
                67, 67, 67, 0, 0, 0, 0, 0, 0, 2162968, 0, 0, 67, 67, 67, 67, 67, 814, 816, 67, 67, 67, 67, 67, 25398,
                542, 13112, 544, 67, 67, 1008, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1020, 67, 0, 97, 45, 67, 0,
                97, 45, 67, 0, 97, 45, 67, 97, 0, 0, 97, 97, 97, 97, 97, 45, 45, 45, 45, 67, 67, 67, 67, 1429, 67, 1430,
                67, 67, 67, 67, 67, 1062, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 518, 1076, 67, 67,
                67, 67, 25398, 0, 13112, 0, 54074, 0, 0, 0, 0, 0, 0, 0, 0, 28809, 0, 139, 45, 45, 45, 45, 45, 97, 97,
                97, 97, 1102, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1124, 97, 1126, 97, 97, 1114, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1112, 97, 97, 1156, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 594, 97, 97, 97, 97, 1170, 97, 97, 97, 97, 0, 921, 0, 0, 0, 0, 0, 0, 45, 45, 45, 45, 1532,
                45, 45, 45, 45, 1536, 45, 45, 45, 45, 45, 172, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 706, 45, 45, 709,
                45, 45, 1177, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1202, 45, 1204, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 1215, 45, 45, 45, 1232, 45, 45, 45, 45, 45, 45, 45, 67, 1237, 67,
                67, 67, 67, 67, 67, 1053, 1054, 67, 67, 67, 67, 67, 67, 1061, 67, 67, 1282, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 1289, 67, 67, 67, 1292, 97, 97, 97, 97, 1339, 97, 97, 97, 97, 97, 97, 1344, 97, 97, 97, 97, 45,
                1849, 45, 1851, 45, 45, 45, 45, 45, 45, 45, 45, 721, 45, 45, 45, 45, 45, 726, 45, 1385, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1188, 45, 45, 1401, 1402, 45, 45, 45, 45, 1405, 45, 45, 45,
                45, 45, 45, 45, 45, 1752, 45, 45, 45, 45, 45, 67, 67, 1410, 45, 45, 45, 1413, 45, 1415, 45, 45, 45, 45,
                45, 45, 1419, 45, 45, 45, 45, 1806, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 97, 97, 2019, 0,
                97, 67, 67, 67, 1452, 67, 67, 67, 67, 67, 67, 67, 67, 1457, 67, 67, 67, 67, 67, 67, 1259, 67, 67, 67,
                67, 67, 67, 1264, 67, 67, 1460, 67, 1462, 67, 67, 67, 67, 67, 67, 1466, 67, 67, 67, 67, 67, 67, 67, 67,
                1588, 67, 67, 67, 67, 67, 67, 67, 0, 1300, 0, 0, 0, 1306, 0, 0, 0, 97, 97, 97, 1506, 97, 97, 97, 97, 97,
                97, 97, 97, 1512, 97, 97, 97, 0, 1728, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 901, 97, 97, 97, 97,
                1515, 97, 1517, 97, 97, 97, 97, 97, 97, 1521, 97, 97, 97, 97, 97, 97, 0, 45, 1652, 45, 45, 45, 1655, 45,
                45, 45, 45, 45, 1542, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1552, 1553, 45, 45, 45, 1556,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 693, 45, 45, 45, 67, 67, 67, 67, 1572, 67, 67, 67,
                67, 1576, 67, 67, 67, 67, 67, 67, 67, 67, 1602, 67, 67, 1605, 67, 67, 67, 0, 67, 1582, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1580, 67, 67, 1596, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 0, 542, 0, 544, 67, 67, 67, 67, 1759, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 533, 67, 67,
                67, 67, 67, 67, 67, 1770, 67, 67, 67, 67, 67, 97, 97, 97, 97, 97, 97, 1777, 97, 97, 97, 1793, 97, 97,
                97, 97, 97, 45, 45, 45, 45, 45, 45, 45, 998, 45, 45, 1001, 1002, 45, 45, 67, 67, 45, 1861, 45, 67, 67,
                67, 67, 67, 67, 67, 67, 1871, 67, 1873, 1874, 67, 0, 97, 45, 67, 0, 97, 45, 67, 16384, 97, 45, 67, 97,
                0, 0, 0, 1473, 0, 1082, 0, 0, 0, 1475, 0, 1086, 0, 0, 0, 1477, 1876, 67, 97, 97, 97, 97, 97, 1883, 0,
                1885, 97, 97, 97, 1889, 0, 0, 0, 286, 0, 0, 0, 286, 0, 2367488, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 0, 40976, 0, 18, 18, 24, 24, 126, 126, 126, 2053, 0, 2055, 45, 67, 0, 97, 45, 67, 0,
                97, 45, 67, 97, 0, 0, 97, 97, 97, 2039, 97, 45, 45, 45, 45, 67, 67, 67, 67, 67, 226, 67, 67, 67, 67, 67,
                67, 67, 67, 1246, 67, 67, 1249, 1250, 67, 67, 67, 132, 94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347,
                28809, 45, 45, 141, 45, 45, 45, 1403, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1186, 45, 45,
                1189, 45, 45, 155, 45, 45, 45, 45, 45, 45, 45, 45, 45, 191, 45, 45, 45, 45, 700, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 1753, 45, 45, 45, 67, 67, 45, 45, 67, 208, 67, 67, 67, 222, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 1764, 67, 67, 67, 67, 67, 67, 67, 258, 67, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0,
                28809, 53531, 97, 97, 288, 97, 97, 97, 302, 97, 97, 97, 97, 97, 97, 97, 97, 97, 627, 97, 97, 97, 97, 97,
                97, 338, 97, 97, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 131427, 0, 0, 0, 0, 362, 0, 365,
                28809, 367, 139, 45, 370, 45, 45, 45, 45, 716, 45, 45, 45, 45, 45, 722, 45, 45, 45, 45, 45, 45, 1912,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 819, 67, 67, 25398, 542, 13112, 544, 45, 403, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 1409, 45, 67, 67, 67, 67, 489, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 771, 67, 67, 67, 67, 520, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 534, 67, 67, 67, 67, 67,
                67, 1271, 67, 67, 67, 1274, 67, 67, 67, 1279, 67, 67, 24850, 24850, 12564, 12564, 0, 57889, 0, 0, 0,
                53531, 53531, 367, 286, 97, 553, 97, 97, 97, 97, 586, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1138,
                97, 97, 97, 97, 617, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 631, 97, 97, 97, 0, 1834, 97, 97, 97,
                97, 97, 0, 0, 0, 97, 97, 97, 97, 97, 353, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 45, 45, 668, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 724, 45, 45, 45, 45, 45, 682, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 949, 45, 45, 45, 67, 67, 747, 748, 67, 67, 67, 67, 755, 67, 67, 67, 67, 67, 67,
                67, 0, 0, 0, 1302, 0, 0, 0, 1308, 0, 67, 794, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                1701, 67, 97, 97, 97, 845, 846, 97, 97, 97, 97, 853, 97, 97, 97, 97, 97, 97, 0, 40976, 0, 18, 18, 24,
                24, 27, 27, 27, 97, 97, 892, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 610, 97, 97, 45, 992,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 1239, 67, 67, 67, 1063, 67, 67, 67, 67, 67,
                1068, 67, 67, 67, 67, 67, 67, 67, 0, 0, 1301, 0, 0, 0, 1307, 0, 0, 97, 1141, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 1152, 97, 97, 0, 0, 97, 97, 2001, 0, 97, 2003, 97, 97, 97, 45, 45, 45, 1739, 45, 45, 45,
                1742, 45, 45, 45, 45, 45, 97, 97, 97, 97, 1157, 97, 97, 97, 97, 97, 1162, 97, 97, 97, 97, 97, 97, 1145,
                97, 97, 97, 97, 97, 1151, 97, 97, 97, 1253, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                539, 45, 1423, 45, 45, 67, 67, 67, 67, 67, 67, 67, 1431, 67, 67, 67, 67, 67, 67, 67, 1695, 67, 67, 67,
                67, 67, 1700, 67, 1702, 67, 67, 1439, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 514, 67, 67,
                97, 97, 1492, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 611, 97, 97, 1703, 67, 67, 67, 67, 67,
                67, 97, 97, 97, 97, 97, 97, 97, 97, 97, 852, 97, 97, 97, 97, 97, 97, 45, 1949, 45, 1951, 45, 45, 45, 67,
                67, 67, 67, 67, 67, 67, 1961, 67, 0, 97, 45, 67, 0, 97, 2060, 2061, 0, 2062, 45, 67, 97, 0, 0, 2036, 97,
                97, 97, 97, 45, 45, 45, 45, 67, 67, 67, 67, 67, 223, 67, 67, 237, 67, 67, 67, 67, 67, 67, 67, 1272, 67,
                67, 67, 67, 67, 67, 67, 67, 507, 67, 67, 67, 67, 67, 67, 67, 1963, 67, 67, 67, 97, 97, 97, 97, 0, 1972,
                0, 97, 97, 97, 1975, 0, 921, 29315, 0, 0, 0, 0, 45, 45, 45, 931, 45, 45, 45, 45, 45, 407, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 417, 45, 45, 1989, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1996, 97, 18,
                131427, 0, 0, 360, 0, 0, 0, 362, 0, 0, 365, 29315, 367, 0, 921, 29315, 0, 0, 0, 0, 45, 45, 930, 45, 45,
                45, 45, 45, 45, 444, 45, 45, 45, 45, 45, 45, 45, 67, 67, 97, 97, 1998, 0, 97, 97, 97, 0, 97, 97, 97, 97,
                97, 45, 45, 45, 45, 45, 45, 1985, 45, 1986, 45, 45, 45, 156, 45, 45, 170, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 675, 45, 45, 45, 45, 679, 131427, 0, 358, 0, 0, 362, 0, 365, 28809, 367, 139, 45, 45, 45,
                45, 45, 381, 45, 45, 45, 45, 45, 45, 45, 45, 45, 400, 45, 45, 419, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 436, 67, 67, 67, 67, 67, 505, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 820, 67, 25398, 542,
                13112, 544, 67, 67, 522, 67, 67, 67, 67, 67, 529, 67, 67, 67, 67, 67, 67, 67, 0, 1299, 0, 0, 0, 1305, 0,
                0, 0, 97, 97, 619, 97, 97, 97, 97, 97, 626, 97, 97, 97, 97, 97, 97, 97, 1105, 97, 97, 97, 97, 1109, 97,
                97, 97, 67, 67, 67, 67, 749, 67, 67, 67, 67, 67, 67, 67, 67, 67, 760, 67, 0, 97, 45, 67, 2058, 97, 45,
                67, 0, 97, 45, 67, 97, 0, 0, 97, 97, 97, 97, 97, 45, 45, 45, 2041, 67, 67, 67, 67, 67, 780, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 516, 67, 67, 97, 97, 97, 878, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 1629, 97, 0, 45, 979, 45, 45, 45, 45, 984, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1198,
                45, 45, 45, 45, 45, 45, 67, 1023, 67, 67, 67, 67, 1028, 67, 67, 67, 67, 67, 67, 67, 67, 67, 470, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 25398, 0, 13112, 0, 54074, 0, 0, 0, 1094, 0, 0, 0, 1092, 1315, 0, 0,
                0, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1486, 97, 1489, 97, 97, 97, 1117, 97, 97, 97, 97, 1122, 97,
                97, 97, 97, 97, 97, 97, 1146, 97, 97, 97, 97, 97, 97, 97, 97, 881, 97, 97, 97, 886, 97, 97, 97, 1311, 0,
                0, 0, 0, 0, 0, 0, 0, 97, 97, 97, 97, 97, 97, 97, 1615, 97, 97, 97, 97, 97, 1619, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 1631, 97, 97, 1847, 97, 45, 45, 45, 45, 1852, 45, 45, 45, 45, 45, 45, 45, 1235,
                45, 45, 45, 67, 67, 67, 67, 67, 1868, 67, 67, 67, 1872, 67, 67, 67, 67, 67, 97, 97, 97, 97, 1882, 0, 0,
                0, 97, 97, 97, 97, 0, 1891, 67, 67, 67, 67, 67, 97, 97, 97, 97, 97, 1929, 0, 0, 97, 97, 97, 97, 97, 97,
                45, 1900, 45, 1901, 45, 45, 45, 1905, 45, 67, 2054, 97, 45, 67, 0, 97, 45, 67, 0, 97, 45, 67, 97, 0, 0,
                97, 2037, 2038, 97, 97, 45, 45, 45, 45, 67, 67, 67, 67, 1867, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1774,
                97, 97, 97, 97, 97, 97, 0, 94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347, 28809, 45, 45, 142, 45, 45,
                45, 1412, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 432, 45, 45, 45, 45, 45, 157, 45, 45, 171, 45,
                45, 45, 182, 45, 45, 45, 45, 200, 45, 45, 45, 1543, 45, 45, 45, 45, 45, 45, 45, 45, 1551, 45, 45, 45,
                45, 1181, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1211, 45, 45, 45, 1214, 45, 45, 45, 67, 209, 67,
                67, 67, 224, 67, 67, 238, 67, 67, 67, 249, 67, 0, 97, 2056, 2057, 0, 2059, 45, 67, 0, 97, 45, 67, 97, 0,
                0, 1937, 97, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 1741, 45, 45, 45, 45, 45, 45, 67, 67, 67, 267,
                67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531, 97, 97, 289, 97, 97, 97, 304, 97, 97, 318, 97,
                97, 97, 329, 97, 97, 0, 0, 97, 1783, 97, 97, 97, 97, 0, 0, 97, 97, 0, 97, 97, 97, 45, 2026, 45, 45, 45,
                45, 67, 2030, 67, 67, 67, 67, 67, 67, 1041, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1044, 67, 67, 67, 67,
                67, 67, 97, 97, 347, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 45, 666, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 1420, 45, 57889, 0, 0, 54074, 54074, 550, 0, 97, 97, 97, 97, 97, 97,
                97, 97, 840, 67, 1007, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 759, 67, 67, 67, 67, 67,
                67, 67, 1052, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1031, 67, 67, 67, 67, 67, 97, 97, 97, 1101, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 592, 97, 97, 97, 1190, 45, 45, 45, 45, 45, 1195, 45, 1197,
                45, 45, 45, 45, 1201, 45, 45, 45, 45, 1952, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 250,
                67, 67, 67, 1255, 67, 1257, 67, 67, 67, 67, 1261, 67, 67, 67, 67, 67, 67, 67, 67, 1685, 67, 67, 67, 67,
                67, 67, 67, 0, 24851, 12565, 0, 0, 0, 0, 28809, 53532, 67, 67, 1267, 67, 67, 67, 67, 67, 67, 1273, 67,
                67, 67, 67, 67, 67, 67, 67, 1696, 67, 67, 67, 67, 67, 67, 67, 0, 0, 0, 0, 0, 0, 2162688, 0, 0, 1281, 67,
                67, 67, 67, 1285, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1070, 67, 67, 67, 67, 67, 1335, 97, 1337, 97,
                97, 97, 97, 1341, 97, 97, 97, 97, 97, 97, 97, 97, 882, 97, 97, 97, 97, 97, 97, 97, 1347, 97, 97, 97, 97,
                97, 97, 1353, 97, 97, 97, 97, 97, 97, 1361, 97, 18, 131427, 0, 638, 0, 0, 0, 0, 362, 0, 0, 365, 29315,
                367, 0, 544, 0, 550, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2473984,
                2158592, 2158592, 2158592, 2990080, 2158592, 2158592, 2207744, 2207744, 2482176, 2207744, 2207744,
                2207744, 2207744, 2207744, 2207744, 2207744, 0, 0, 0, 0, 0, 0, 2162688, 0, 53530, 97, 97, 97, 1365, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 608, 97, 97, 97, 45, 45, 1424, 45, 1425, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 1058, 67, 67, 67, 67, 45, 1555, 45, 45, 1557, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 707, 45, 45, 45, 45, 67, 67, 1570, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 773,
                67, 67, 1595, 67, 67, 1597, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                139, 2158592, 2158592, 2158592, 2404352, 2412544, 97, 97, 97, 1636, 97, 97, 97, 1639, 97, 97, 1641, 97,
                97, 97, 97, 97, 97, 1173, 0, 921, 0, 0, 0, 0, 0, 0, 45, 67, 67, 67, 1693, 67, 67, 67, 67, 67, 67, 67,
                1698, 67, 67, 67, 67, 67, 67, 67, 1773, 67, 97, 97, 97, 97, 97, 97, 97, 625, 97, 97, 97, 97, 97, 97, 97,
                97, 850, 97, 97, 97, 97, 97, 97, 97, 97, 880, 97, 97, 97, 97, 97, 97, 97, 97, 1106, 97, 97, 97, 97, 97,
                97, 97, 1860, 45, 45, 67, 67, 1865, 67, 67, 67, 67, 1870, 67, 67, 67, 67, 1875, 67, 67, 97, 97, 1880,
                97, 97, 0, 0, 0, 97, 97, 1888, 97, 0, 0, 0, 1938, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 1854, 45,
                45, 45, 45, 45, 45, 45, 1909, 45, 45, 1911, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1248, 67, 67, 67,
                67, 67, 67, 1922, 67, 67, 1924, 97, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 97, 1898, 45, 45, 45, 45,
                45, 45, 1904, 45, 45, 67, 67, 67, 67, 97, 97, 97, 97, 0, 0, 16384, 97, 97, 97, 97, 0, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 0, 1724, 2008, 2009, 45, 45, 67, 67, 67, 2014, 2015, 67, 67, 97, 97, 0, 0, 97, 97,
                97, 0, 97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 2022, 0, 2023, 97, 97,
                45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 1869, 67, 67, 67, 67, 67, 67, 0, 94242, 0, 0, 0, 38,
                102439, 0, 0, 106538, 98347, 28809, 45, 45, 45, 147, 151, 154, 45, 162, 45, 45, 176, 178, 181, 45, 45,
                45, 192, 196, 45, 45, 45, 45, 2012, 67, 67, 67, 67, 67, 67, 2018, 97, 0, 0, 97, 1978, 97, 97, 97, 1982,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 972, 973, 45, 45, 45, 45, 45, 67, 259, 263, 67, 67, 67, 67, 0,
                24850, 12564, 0, 0, 0, 0, 28809, 53531, 97, 97, 97, 294, 298, 301, 97, 309, 97, 97, 323, 325, 328, 97,
                97, 97, 97, 97, 560, 97, 97, 97, 569, 97, 97, 97, 97, 97, 97, 306, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                1624, 97, 97, 97, 97, 97, 97, 97, 0, 921, 0, 1175, 0, 0, 0, 0, 45, 339, 343, 97, 97, 97, 97, 0, 40976,
                0, 18, 18, 24, 24, 27, 27, 27, 67, 67, 503, 67, 67, 67, 67, 67, 67, 67, 67, 67, 512, 67, 67, 519, 97,
                97, 600, 97, 97, 97, 97, 97, 97, 97, 97, 97, 609, 97, 97, 616, 45, 649, 45, 45, 45, 45, 45, 654, 45, 45,
                45, 45, 45, 45, 45, 45, 1393, 45, 45, 45, 45, 45, 45, 45, 45, 1209, 45, 45, 45, 45, 45, 45, 45, 67, 763,
                67, 67, 67, 67, 67, 67, 67, 67, 770, 67, 67, 67, 774, 67, 0, 2045, 97, 97, 97, 97, 45, 45, 67, 67, 0, 0,
                97, 97, 45, 45, 45, 994, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 213, 67, 219, 67, 67, 232, 67,
                242, 67, 247, 67, 67, 67, 779, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1018, 67, 67, 67,
                67, 811, 67, 67, 67, 67, 67, 67, 67, 67, 67, 25398, 542, 13112, 544, 57889, 0, 0, 54074, 54074, 550, 0,
                97, 834, 97, 97, 97, 97, 97, 839, 97, 18, 131427, 0, 638, 0, 0, 0, 0, 362, 0, 0, 365, 29315, 367, 645,
                97, 97, 861, 97, 97, 97, 97, 97, 97, 97, 97, 868, 97, 97, 97, 872, 97, 97, 877, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 613, 97, 97, 97, 97, 97, 909, 97, 97, 97, 97, 97, 97, 97, 97, 97, 0, 0, 0,
                18, 18, 24, 24, 27, 27, 27, 1036, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1047, 67,
                67, 67, 1050, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1033, 67, 67, 67, 97, 97, 1130, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 638, 0, 0, 67, 67, 67, 1295, 67, 67, 67, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 97, 1317, 97, 97, 97, 97, 97, 97, 1375, 97, 97, 97, 0, 0, 0, 45, 1379, 45, 45, 45, 45, 45, 45,
                422, 45, 45, 45, 429, 431, 45, 45, 45, 45, 0, 1090, 0, 0, 97, 1479, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 1357, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1716, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1723, 0, 921,
                29315, 0, 0, 0, 0, 45, 929, 45, 45, 45, 45, 45, 45, 45, 1392, 45, 45, 45, 45, 45, 45, 45, 45, 45, 960,
                45, 45, 45, 45, 45, 45, 97, 97, 97, 1738, 45, 45, 45, 45, 45, 45, 45, 1743, 45, 45, 45, 45, 166, 45, 45,
                45, 45, 184, 186, 45, 45, 197, 45, 45, 97, 1779, 0, 0, 97, 97, 97, 97, 97, 97, 0, 0, 97, 97, 0, 97, 18,
                131427, 0, 638, 0, 0, 0, 0, 362, 0, 640, 365, 29315, 367, 0, 921, 29315, 0, 0, 0, 0, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 1537, 45, 45, 45, 45, 45, 1803, 45, 45, 45, 45, 45, 1809, 45, 45, 45, 67, 67, 67,
                1814, 67, 67, 67, 67, 67, 67, 1821, 67, 67, 67, 67, 67, 67, 97, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97,
                0, 0, 67, 67, 67, 1818, 67, 67, 67, 67, 67, 1824, 67, 67, 67, 97, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97,
                97, 1890, 0, 1829, 97, 97, 0, 0, 97, 97, 1836, 97, 97, 0, 0, 0, 97, 97, 97, 97, 1981, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 1987, 1845, 97, 97, 97, 45, 45, 45, 45, 45, 1853, 45, 45, 45, 1857, 45, 45, 45, 67,
                1864, 67, 1866, 67, 67, 67, 67, 67, 67, 67, 67, 67, 97, 97, 97, 97, 97, 97, 97, 1710, 1711, 67, 67, 97,
                97, 97, 97, 97, 0, 0, 0, 1886, 97, 97, 97, 0, 0, 97, 97, 97, 97, 1838, 0, 0, 0, 97, 1843, 97, 0, 1893,
                97, 97, 97, 97, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1745, 45, 45, 67, 67, 67, 67, 67, 97, 97,
                97, 97, 97, 0, 0, 1931, 97, 97, 97, 97, 97, 588, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 629, 97, 97,
                97, 97, 97, 67, 2044, 0, 97, 97, 97, 97, 45, 45, 67, 67, 0, 0, 97, 97, 45, 45, 45, 1660, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 453, 45, 455, 67, 67, 67, 67, 268, 67, 67, 67, 0, 24850, 12564, 0, 0, 0,
                0, 28809, 53531, 97, 97, 348, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 131427, 0, 359, 0, 0,
                362, 0, 365, 28809, 367, 139, 45, 45, 45, 45, 45, 421, 45, 45, 45, 45, 45, 45, 45, 434, 45, 45, 695, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1667, 45, 0, 921, 29315, 0, 925, 0, 0, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 1811, 45, 67, 67, 67, 67, 67, 67, 1037, 67, 1039, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 1277, 67, 67, 67, 67, 67, 67, 67, 67, 25398, 0, 13112, 0, 54074, 0, 0, 0, 1095,
                0, 0, 0, 1096, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 869, 97, 97, 97, 97, 97, 97, 1131, 97,
                1133, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1370, 97, 97, 97, 97, 97, 1312, 0, 0, 0, 0, 1096, 0, 0, 0,
                97, 97, 97, 97, 97, 97, 97, 1327, 97, 97, 97, 97, 97, 1332, 97, 97, 97, 1830, 97, 0, 0, 97, 97, 97, 97,
                97, 0, 0, 0, 97, 97, 97, 1896, 97, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1548, 45, 45, 45, 45, 45, 45,
                133, 94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347, 28809, 45, 45, 45, 45, 380, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 401, 45, 45, 158, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1200, 45, 45,
                45, 45, 206, 67, 67, 67, 67, 67, 225, 67, 67, 67, 67, 67, 67, 67, 67, 754, 67, 67, 67, 67, 67, 67, 67,
                57889, 0, 0, 54074, 54074, 550, 832, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1342, 97, 97, 97, 97, 97, 97,
                67, 67, 67, 67, 67, 25398, 1083, 13112, 1087, 54074, 1091, 0, 0, 0, 0, 0, 0, 1316, 0, 831, 97, 97, 97,
                97, 97, 97, 97, 1174, 921, 0, 1175, 0, 0, 0, 0, 45, 0, 94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347,
                28809, 45, 45, 45, 148, 67, 67, 264, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531, 97, 97,
                97, 295, 97, 97, 97, 97, 313, 97, 97, 97, 97, 331, 333, 97, 18, 131427, 356, 638, 0, 0, 0, 0, 362, 0, 0,
                365, 0, 367, 0, 45, 45, 1530, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 988, 45, 45, 45, 97, 344,
                97, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 402, 404, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 1756, 67, 438, 45, 45, 45, 45, 45, 45, 45, 45, 449, 450, 45, 45, 45, 67, 67, 214,
                218, 221, 67, 229, 67, 67, 243, 245, 248, 67, 67, 67, 67, 67, 488, 490, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 1071, 67, 1073, 67, 67, 67, 67, 67, 524, 67, 67, 67, 67, 67, 67, 67, 67, 535, 536, 67, 67,
                67, 67, 67, 67, 1683, 1684, 67, 67, 67, 67, 1688, 1689, 67, 67, 67, 67, 67, 67, 1586, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 469, 67, 67, 67, 67, 67, 67, 97, 97, 97, 585, 587, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 1163, 97, 97, 97, 97, 97, 97, 97, 621, 97, 97, 97, 97, 97, 97, 97, 97, 632, 633, 97, 97, 0,
                0, 1782, 97, 97, 97, 97, 97, 0, 0, 97, 97, 0, 97, 712, 45, 45, 45, 717, 45, 45, 45, 45, 45, 45, 45, 45,
                725, 45, 45, 45, 163, 167, 173, 177, 45, 45, 45, 45, 45, 193, 45, 45, 45, 45, 982, 45, 45, 45, 45, 45,
                45, 987, 45, 45, 45, 45, 45, 1558, 45, 1560, 45, 45, 45, 45, 45, 45, 45, 45, 704, 705, 45, 45, 45, 45,
                45, 45, 45, 45, 731, 45, 45, 45, 67, 67, 67, 67, 67, 739, 67, 67, 67, 67, 67, 67, 273, 0, 24850, 12564,
                0, 0, 0, 0, 28809, 53531, 67, 67, 67, 764, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1290, 67, 67,
                67, 67, 67, 67, 812, 67, 67, 67, 67, 818, 67, 67, 67, 25398, 542, 13112, 544, 57889, 0, 0, 54074, 54074,
                550, 0, 97, 97, 97, 97, 97, 837, 97, 97, 97, 97, 97, 602, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1137,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 862, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1627, 97, 97, 97,
                0, 97, 97, 97, 97, 910, 97, 97, 97, 97, 916, 97, 97, 97, 0, 0, 0, 97, 97, 1940, 97, 97, 1942, 45, 45,
                45, 45, 45, 45, 385, 45, 45, 45, 45, 395, 45, 45, 45, 45, 966, 45, 969, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 975, 45, 45, 45, 406, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 974, 45, 45, 45, 67, 67,
                67, 67, 1010, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1262, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                1040, 67, 1042, 67, 1045, 67, 67, 67, 67, 67, 67, 67, 97, 1706, 97, 97, 97, 1709, 97, 97, 97, 67, 67,
                67, 67, 1051, 67, 67, 67, 67, 67, 1057, 67, 67, 67, 67, 67, 67, 67, 1443, 67, 67, 1446, 67, 67, 67, 67,
                67, 67, 67, 1297, 0, 0, 0, 1303, 0, 0, 0, 1309, 67, 67, 67, 67, 1079, 25398, 0, 13112, 0, 54074, 0, 0,
                0, 0, 0, 0, 0, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2207744,
                2207744, 2207744, 2207744, 2207744, 2572288, 2207744, 2207744, 2207744, 1098, 97, 97, 97, 97, 97, 1104,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 1356, 97, 97, 97, 97, 97, 97, 1128, 97, 97, 97, 97, 97, 97, 1134,
                97, 1136, 97, 1139, 97, 97, 97, 97, 97, 97, 1622, 97, 97, 97, 97, 97, 97, 97, 97, 0, 921, 0, 0, 0, 1176,
                0, 646, 45, 67, 67, 67, 1268, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1469, 67, 67, 67, 97,
                1348, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1127, 97, 67, 1569, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 1448, 1449, 67, 1816, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1825, 67,
                67, 1827, 97, 97, 0, 1781, 97, 97, 97, 97, 97, 97, 0, 0, 97, 97, 0, 97, 97, 97, 1831, 0, 0, 97, 97, 97,
                97, 97, 0, 0, 0, 97, 97, 97, 1980, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1395, 45, 45, 45, 45, 45,
                97, 1846, 97, 97, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1212, 45, 45, 45, 45, 45, 45, 2010,
                45, 67, 67, 67, 67, 67, 2016, 67, 97, 97, 0, 0, 97, 97, 97, 0, 97, 97, 97, 97, 97, 45, 45, 2007, 0,
                94242, 0, 0, 0, 38, 102439, 0, 0, 106538, 98347, 28809, 45, 45, 143, 45, 45, 45, 1671, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 67, 1813, 67, 67, 1815, 45, 45, 67, 210, 67, 67, 67, 67, 67, 67, 239, 67,
                67, 67, 67, 67, 67, 67, 1454, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1445, 67, 67, 67, 67, 67, 67, 97, 97,
                290, 97, 97, 97, 97, 97, 97, 319, 97, 97, 97, 97, 97, 97, 303, 97, 97, 317, 97, 97, 97, 97, 97, 97, 305,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 899, 97, 97, 97, 97, 97, 97, 375, 45, 45, 45, 379, 45, 45, 390, 45,
                45, 394, 45, 45, 45, 45, 45, 443, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 461, 67, 67, 67,
                465, 67, 67, 476, 67, 67, 480, 67, 67, 67, 67, 67, 67, 1694, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1288,
                67, 67, 67, 67, 67, 67, 500, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1075, 97, 97,
                97, 558, 97, 97, 97, 562, 97, 97, 573, 97, 97, 577, 97, 97, 97, 97, 97, 895, 97, 97, 97, 97, 97, 97,
                903, 97, 97, 97, 0, 97, 97, 1638, 97, 97, 97, 97, 97, 97, 97, 97, 1646, 597, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 1334, 45, 681, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                1396, 45, 45, 1399, 45, 45, 730, 45, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1434, 67, 67,
                67, 67, 67, 67, 750, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1456, 67, 67, 67, 67, 67, 45, 45, 993, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 1238, 67, 67, 1006, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 1280, 1048, 1049, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1059, 67, 67, 67, 67,
                67, 67, 1286, 67, 67, 67, 67, 67, 67, 67, 1291, 67, 97, 97, 1100, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 638, 0, 920, 97, 97, 1142, 1143, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1153, 97, 97,
                97, 97, 97, 1158, 97, 97, 97, 1161, 97, 97, 97, 97, 1166, 97, 97, 97, 97, 97, 1325, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 1328, 97, 97, 97, 97, 97, 97, 97, 45, 1218, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 1678, 45, 45, 45, 67, 67, 67, 67, 67, 1269, 67, 67, 67, 67, 67, 67, 67, 67, 1278, 67,
                67, 67, 67, 67, 67, 1761, 67, 67, 67, 67, 67, 67, 67, 67, 67, 530, 67, 67, 67, 67, 67, 67, 97, 97, 1349,
                97, 97, 97, 97, 97, 97, 97, 97, 1358, 97, 97, 97, 97, 97, 97, 1623, 97, 97, 97, 97, 97, 97, 97, 97, 0,
                921, 0, 0, 926, 0, 0, 0, 45, 45, 1411, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1754, 45,
                45, 67, 67, 1301, 0, 1307, 0, 1313, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 21054, 97, 97, 97, 97,
                67, 1757, 67, 67, 67, 1760, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1467, 67, 67, 67, 67, 67, 1778, 97,
                0, 0, 97, 97, 97, 97, 97, 97, 0, 0, 97, 97, 0, 97, 97, 97, 97, 97, 1352, 97, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 1511, 97, 97, 97, 97, 97, 67, 67, 67, 67, 67, 1820, 67, 1822, 67, 67, 67, 67, 67, 97, 97, 97,
                97, 97, 0, 0, 0, 97, 1933, 97, 1892, 97, 97, 97, 97, 97, 97, 1899, 45, 45, 45, 45, 45, 45, 45, 45, 1664,
                45, 45, 45, 45, 45, 45, 45, 45, 1546, 45, 45, 45, 45, 45, 45, 45, 45, 1208, 45, 45, 45, 45, 45, 45, 45,
                45, 1224, 45, 45, 45, 45, 45, 45, 45, 45, 673, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67, 1925, 97,
                97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 97, 623, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 307, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 1796, 97, 45, 45, 45, 45, 45, 45, 45, 970, 45, 45, 45, 45, 45, 45, 45, 45, 1417,
                45, 45, 45, 45, 45, 45, 45, 67, 1964, 67, 67, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 0, 97, 97, 97,
                97, 97, 97, 1721, 97, 97, 0, 0, 1997, 97, 0, 0, 2e3, 97, 97, 0, 97, 97, 97, 97, 97, 45, 45, 45, 45, 733,
                45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 803, 67, 67, 67, 67, 67, 0, 94242, 0, 0, 0, 38, 102439, 0,
                0, 106538, 98347, 28809, 45, 45, 144, 45, 45, 45, 1805, 45, 1807, 45, 45, 45, 45, 45, 67, 67, 67, 67,
                67, 67, 231, 67, 67, 67, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531, 45, 45, 67, 211, 67,
                67, 67, 67, 230, 234, 240, 244, 67, 67, 67, 67, 67, 67, 464, 67, 67, 67, 67, 67, 67, 479, 67, 67, 67,
                260, 67, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531, 97, 97, 291, 97, 97, 97, 97, 310,
                314, 320, 324, 97, 97, 97, 97, 97, 97, 1367, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1355, 97, 97, 97, 97,
                97, 97, 1362, 340, 97, 97, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 131427, 0, 0, 360, 0,
                362, 0, 365, 28809, 367, 139, 369, 45, 45, 45, 374, 67, 67, 460, 67, 67, 67, 67, 466, 67, 67, 67, 67,
                67, 67, 67, 67, 801, 67, 67, 67, 67, 67, 67, 67, 67, 67, 487, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                498, 67, 67, 67, 67, 67, 67, 1772, 67, 67, 97, 97, 97, 97, 97, 97, 97, 0, 921, 922, 1175, 0, 0, 0, 0,
                45, 67, 502, 67, 67, 67, 67, 67, 67, 67, 508, 67, 67, 67, 515, 517, 67, 67, 67, 67, 67, 97, 97, 97, 97,
                97, 0, 0, 0, 1932, 97, 97, 0, 1999, 97, 97, 97, 0, 97, 97, 2004, 2005, 97, 45, 45, 45, 45, 1193, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 676, 45, 45, 45, 45, 67, 24850, 24850, 12564, 12564, 0, 57889, 0, 0,
                0, 53531, 53531, 367, 286, 552, 97, 97, 97, 97, 97, 1377, 0, 0, 45, 45, 45, 45, 45, 45, 45, 45, 655, 45,
                45, 45, 45, 45, 45, 45, 97, 97, 557, 97, 97, 97, 97, 563, 97, 97, 97, 97, 97, 97, 97, 97, 1135, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 584, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 595, 97, 97, 97, 97, 97, 911,
                97, 97, 97, 97, 97, 97, 97, 638, 0, 0, 0, 0, 1315, 0, 0, 0, 0, 97, 97, 97, 1319, 97, 97, 97, 0, 97, 97,
                97, 97, 97, 97, 1733, 97, 97, 97, 97, 97, 97, 1340, 97, 97, 97, 1343, 97, 97, 1345, 97, 1346, 97, 599,
                97, 97, 97, 97, 97, 97, 97, 605, 97, 97, 97, 612, 614, 97, 97, 97, 97, 97, 1794, 97, 97, 97, 45, 45, 45,
                45, 45, 45, 45, 1207, 45, 45, 45, 45, 45, 45, 1213, 45, 45, 745, 67, 67, 67, 67, 751, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 1577, 67, 67, 67, 67, 67, 762, 67, 67, 67, 67, 766, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 1765, 67, 67, 67, 67, 67, 777, 67, 67, 781, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                1592, 1593, 67, 67, 97, 843, 97, 97, 97, 97, 849, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1510, 97, 97, 97,
                97, 97, 97, 97, 860, 97, 97, 97, 97, 864, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1797, 45, 45, 45, 45,
                1801, 45, 97, 875, 97, 97, 879, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1522, 97, 97, 97, 97, 97,
                991, 45, 45, 45, 45, 996, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 215, 67, 67, 67, 67, 233, 67, 67, 67,
                67, 251, 253, 1022, 67, 67, 67, 1026, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1035, 67, 67, 1038, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1458, 67, 67, 67, 67, 67, 1064, 67, 67, 67, 1067, 67,
                67, 67, 67, 1072, 67, 67, 67, 67, 67, 67, 1296, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2367488, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 67, 67, 67, 67, 67, 25398, 0, 13112, 0, 54074, 0, 0, 0, 0, 1096, 0,
                921, 29315, 0, 0, 0, 0, 928, 45, 45, 45, 45, 45, 934, 45, 45, 45, 164, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 198, 45, 45, 45, 378, 45, 45, 45, 45, 45, 45, 393, 45, 45, 45, 398, 45, 97, 97, 1116, 97, 97, 97,
                1120, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1147, 1148, 97, 97, 97, 97, 97, 97, 97, 1129, 97, 97, 1132,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1626, 97, 97, 97, 97, 0, 45, 1178, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 1185, 45, 45, 45, 45, 441, 45, 45, 45, 45, 45, 45, 451, 45, 45, 67, 67, 67, 67, 67, 227, 67,
                67, 67, 67, 67, 67, 67, 67, 1260, 67, 67, 67, 1263, 67, 67, 1265, 1203, 45, 45, 1205, 45, 1206, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 1216, 67, 1266, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1276, 67, 67, 67, 67,
                67, 67, 492, 67, 67, 67, 67, 67, 67, 67, 67, 67, 471, 67, 67, 67, 67, 481, 67, 45, 1386, 45, 1389, 45,
                45, 45, 45, 1394, 45, 45, 45, 1397, 45, 45, 45, 45, 995, 45, 997, 45, 45, 45, 45, 45, 45, 45, 67, 67,
                67, 67, 1915, 67, 67, 67, 67, 67, 1422, 45, 45, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1433, 67, 1436,
                67, 67, 67, 67, 1441, 67, 67, 67, 1444, 67, 67, 67, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 281,
                28809, 53531, 97, 97, 97, 97, 1494, 97, 97, 97, 1497, 97, 97, 97, 97, 97, 97, 97, 1368, 97, 97, 97, 97,
                97, 97, 97, 97, 851, 97, 97, 97, 97, 97, 97, 97, 67, 67, 67, 1571, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 25398, 542, 13112, 544, 67, 67, 1583, 67, 67, 67, 67, 67, 67, 67, 67, 1591, 67, 67, 67, 67,
                67, 67, 752, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1056, 67, 67, 67, 67, 67, 67, 97, 1634, 97, 0, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1125, 97, 97, 97, 1647, 97, 97, 97, 97, 97, 0, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 1183, 45, 45, 45, 45, 45, 45, 45, 45, 45, 409, 45, 45, 45, 45, 45, 45, 1658, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1668, 1712, 97, 97, 97, 0, 97, 97, 97, 97, 97, 97, 97,
                97, 97, 0, 0, 1835, 97, 97, 97, 97, 0, 0, 0, 97, 97, 1844, 97, 97, 1726, 0, 97, 97, 97, 97, 97, 1732,
                97, 1734, 97, 97, 97, 97, 97, 300, 97, 308, 97, 97, 97, 97, 97, 97, 97, 97, 866, 97, 97, 97, 97, 97, 97,
                97, 67, 67, 67, 1758, 67, 67, 67, 1762, 67, 67, 67, 67, 67, 67, 67, 67, 1043, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 67, 67, 1771, 67, 67, 67, 97, 97, 97, 97, 97, 1776, 97, 97, 97, 97, 297, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 1108, 97, 97, 97, 97, 67, 67, 67, 1966, 97, 97, 97, 1970, 0, 0, 0, 97, 97,
                97, 97, 0, 97, 97, 97, 1720, 97, 97, 97, 97, 97, 0, 0, 97, 97, 97, 1837, 97, 0, 1840, 1841, 97, 97, 97,
                1988, 45, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1994, 1995, 67, 97, 97, 97, 97, 97, 1103, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 917, 97, 97, 0, 0, 0, 67, 67, 265, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0,
                28809, 53531, 97, 345, 97, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 131427, 0, 0, 0, 361,
                362, 0, 365, 28809, 367, 139, 45, 45, 45, 45, 45, 671, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 411, 45,
                45, 414, 45, 45, 45, 45, 377, 45, 45, 45, 386, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1223, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 426, 45, 45, 433, 45, 45, 45, 67, 67, 67, 67, 67, 463, 67, 67, 67, 472, 67, 67, 67,
                67, 67, 67, 67, 527, 67, 67, 67, 67, 67, 67, 537, 67, 540, 24850, 24850, 12564, 12564, 0, 57889, 0, 0,
                0, 53531, 53531, 367, 286, 97, 97, 97, 97, 97, 1119, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1509, 97,
                97, 97, 97, 97, 97, 97, 97, 564, 97, 97, 97, 97, 97, 97, 97, 637, 18, 131427, 0, 0, 0, 0, 0, 0, 362, 0,
                0, 365, 29315, 367, 0, 921, 29315, 0, 0, 0, 927, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1234, 45, 45, 45,
                45, 67, 67, 67, 67, 1240, 45, 697, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 708, 45, 45, 45, 45, 1221,
                45, 45, 45, 45, 1225, 45, 45, 45, 45, 45, 45, 384, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1210, 45, 45, 45,
                45, 45, 45, 67, 67, 795, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1470, 67, 67, 67, 67, 67,
                67, 67, 815, 67, 67, 67, 67, 67, 67, 25398, 542, 13112, 544, 97, 97, 97, 893, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 1164, 97, 97, 97, 67, 67, 67, 1025, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 1687, 67, 67, 67, 67, 67, 67, 67, 67, 67, 25398, 0, 13112, 0, 54074, 0, 0, 0, 0, 0, 1097, 1241, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1450, 45, 45, 1388, 45, 1390, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 1236, 67, 67, 67, 67, 67, 1437, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67,
                67, 67, 67, 67, 1472, 1490, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1503, 67, 67,
                67, 67, 67, 97, 97, 97, 97, 97, 0, 1930, 0, 97, 97, 97, 97, 97, 847, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                858, 67, 67, 1965, 67, 97, 97, 97, 97, 0, 0, 0, 97, 97, 97, 97, 0, 97, 97, 1719, 97, 97, 97, 97, 97, 97,
                0, 0, 0, 45, 45, 45, 45, 1382, 45, 1383, 45, 45, 45, 159, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 1563, 45, 45, 45, 45, 45, 67, 261, 67, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809,
                53531, 341, 97, 97, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 97, 1099, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 1333, 97, 1230, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 67, 67, 67,
                67, 67, 67, 1992, 67, 1993, 67, 67, 67, 97, 97, 45, 45, 160, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 1665, 45, 45, 45, 45, 45, 131427, 357, 0, 0, 0, 362, 0, 365, 28809, 367, 139, 45, 45, 45, 45,
                45, 684, 45, 45, 45, 45, 45, 45, 45, 45, 45, 45, 412, 45, 45, 45, 416, 45, 45, 45, 440, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 67, 67, 1990, 67, 1991, 67, 67, 67, 67, 67, 67, 67, 97, 97, 1707, 97, 97,
                97, 97, 97, 97, 501, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1691, 67, 67, 67, 67,
                67, 526, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1030, 67, 1032, 67, 67, 67, 67, 598, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1632, 0, 921, 29315, 923, 0, 0, 0, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 1404, 45, 45, 45, 45, 45, 45, 45, 45, 45, 425, 45, 45, 45, 45, 45, 45, 67, 67, 67, 67, 67,
                25398, 0, 13112, 0, 54074, 0, 0, 1093, 0, 0, 0, 0, 0, 97, 1609, 97, 97, 97, 97, 97, 97, 97, 97, 97,
                1369, 97, 97, 97, 1372, 97, 97, 67, 67, 266, 67, 67, 67, 67, 0, 24850, 12564, 0, 0, 0, 0, 28809, 53531,
                97, 346, 97, 97, 97, 97, 0, 40976, 0, 18, 18, 24, 24, 27, 27, 27, 665, 45, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 45, 45, 45, 1677, 45, 45, 45, 45, 67, 45, 45, 954, 45, 956, 45, 45, 45, 45, 45, 45, 45,
                45, 45, 45, 45, 1545, 45, 45, 45, 45, 45, 45, 45, 45, 45, 448, 45, 45, 45, 45, 67, 456, 67, 67, 67, 67,
                67, 1270, 67, 67, 67, 67, 67, 67, 67, 67, 67, 67, 1069, 67, 67, 67, 67, 67, 67, 97, 97, 97, 1350, 97,
                97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1524, 97, 97, 97, 97, 97, 97, 97, 1376, 0, 0, 0, 45, 45, 45,
                45, 45, 45, 45, 45, 1559, 1561, 45, 45, 45, 1564, 45, 1566, 1567, 45, 67, 67, 67, 67, 67, 1573, 67, 67,
                67, 67, 67, 67, 67, 67, 67, 67, 1247, 67, 67, 67, 67, 67, 1252, 97, 1725, 97, 0, 97, 97, 97, 97, 97, 97,
                97, 97, 97, 97, 97, 97, 1628, 97, 1630, 0, 0, 94242, 0, 0, 0, 2211840, 0, 1118208, 0, 0, 0, 0, 2158592,
                2158731, 2158592, 2158592, 2158592, 3117056, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 3018752, 2158592, 3043328, 2158592, 2158592,
                2158592, 2158592, 3080192, 2158592, 2158592, 3112960, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158878, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2158592, 2605056, 2158592, 2158592, 2207744, 0, 542, 0, 544, 0, 0, 2166784,
                0, 0, 0, 550, 0, 0, 2158592, 2158592, 2686976, 2158592, 2715648, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 2158592, 2867200, 2158592, 2904064, 2158592, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 0, 94242, 0, 0, 0, 2211840, 0, 0, 1130496, 0, 0, 0, 2158592, 2158592, 2158592,
                2158592, 2158592, 3186688, 2158592, 0, 0, 139, 0, 0, 0, 139, 0, 2367488, 2207744, 0, 0, 0, 0, 176128, 0,
                2166784, 0, 0, 0, 0, 0, 286, 2158592, 2158592, 3170304, 3174400, 2158592, 0, 0, 0, 2158592, 2158592,
                2158592, 2158592, 2158592, 2424832, 2158592, 2158592, 2158592, 1508, 2158592, 2908160, 2158592, 2158592,
                2158592, 2977792, 2158592, 2158592, 2158592, 2158592, 3039232, 2158592, 2158592, 2158592, 2158592,
                2158592, 2158592, 3158016, 67, 24850, 24850, 12564, 12564, 0, 0, 0, 0, 0, 53531, 53531, 0, 286, 97, 97,
                97, 97, 97, 1144, 97, 97, 97, 97, 97, 97, 97, 97, 97, 97, 1149, 97, 97, 97, 97, 1154, 57889, 0, 0, 0, 0,
                550, 0, 97, 97, 97, 97, 97, 97, 97, 97, 97, 561, 97, 97, 97, 97, 97, 97, 576, 97, 97, 139264, 139264,
                139264, 139264, 139264, 139264, 139264, 139264, 139264, 139264, 139264, 139264, 0, 0, 139264, 0, 921,
                29315, 0, 0, 926, 0, 45, 45, 45, 45, 45, 45, 45, 45, 45, 719, 720, 45, 45, 45, 45, 45, 45, 45, 45, 685,
                45, 45, 45, 45, 45, 45, 45, 45, 45, 942, 45, 45, 946, 45, 45, 45, 950, 45, 45, 0, 2146304, 2146304, 0,
                0, 0, 0, 2224128, 2224128, 2224128, 2232320, 2232320, 2232320, 2232320, 0, 0, 1301, 0, 0, 0, 0, 0, 1307,
                0, 0, 0, 0, 0, 1313, 0, 0, 0, 0, 0, 0, 0, 97, 97, 1318, 97, 97, 97, 97, 97, 97, 1795, 97, 97, 45, 45,
                45, 45, 45, 45, 45, 446, 45, 45, 45, 45, 45, 45, 67, 67, 2158592, 2146304, 0, 0, 0, 0, 0, 0, 0, 2211840,
                0, 0, 0, 0, 2158592, 0, 921, 29315, 0, 924, 0, 0, 45, 45, 45, 45, 45, 45, 45, 45, 45, 1e3, 45, 45, 45,
                45, 67, 67,
              ]),
              (r.EXPECTED = [
                290, 300, 304, 353, 296, 309, 305, 319, 315, 324, 328, 352, 354, 334, 338, 330, 320, 345, 349, 293, 358,
                362, 341, 366, 312, 370, 374, 378, 382, 386, 390, 394, 398, 737, 402, 634, 439, 604, 634, 634, 634, 634,
                408, 634, 634, 634, 404, 634, 634, 634, 457, 634, 634, 963, 634, 634, 413, 634, 634, 634, 634, 634, 634,
                634, 663, 418, 422, 903, 902, 426, 431, 548, 634, 437, 521, 919, 443, 615, 409, 449, 455, 624, 731, 751,
                634, 461, 465, 672, 470, 469, 474, 481, 485, 477, 489, 493, 629, 542, 497, 505, 603, 602, 991, 648, 510,
                804, 634, 515, 958, 526, 525, 530, 768, 634, 546, 552, 711, 710, 593, 558, 562, 618, 566, 570, 574, 578,
                582, 586, 590, 608, 612, 660, 822, 821, 634, 622, 596, 444, 628, 533, 724, 633, 640, 653, 647, 652, 536,
                1008, 451, 450, 445, 657, 670, 676, 685, 689, 693, 697, 701, 704, 707, 715, 719, 798, 815, 634, 723,
                762, 996, 634, 728, 969, 730, 735, 908, 634, 741, 679, 889, 511, 747, 634, 750, 755, 499, 666, 499, 501,
                759, 772, 776, 780, 634, 787, 784, 797, 802, 809, 808, 427, 814, 1006, 517, 634, 519, 853, 634, 813,
                850, 793, 634, 819, 826, 833, 832, 837, 843, 847, 857, 861, 863, 867, 871, 875, 879, 883, 643, 887, 539,
                980, 979, 634, 893, 944, 634, 900, 896, 634, 907, 933, 506, 912, 917, 828, 433, 636, 635, 554, 961, 923,
                930, 927, 937, 941, 634, 634, 634, 974, 948, 952, 985, 913, 968, 967, 743, 634, 973, 839, 634, 978, 599,
                634, 984, 989, 765, 444, 995, 1e3, 634, 1003, 790, 955, 1012, 681, 634, 634, 634, 634, 634, 414, 1016,
                1020, 1024, 1085, 1027, 1090, 1090, 1046, 1080, 1137, 1108, 1215, 1049, 1032, 1039, 1085, 1085, 1085,
                1085, 1058, 1062, 1068, 1085, 1086, 1090, 1090, 1091, 1072, 1064, 1107, 1090, 1090, 1090, 1118, 1123,
                1138, 1078, 1074, 1084, 1085, 1085, 1085, 1087, 1090, 1062, 1052, 1060, 1114, 1062, 1104, 1085, 1085,
                1090, 1090, 1028, 1122, 1063, 1128, 1139, 1127, 1158, 1085, 1085, 1151, 1090, 1090, 1090, 1095, 1090,
                1132, 1073, 1136, 1143, 1061, 1150, 1085, 1155, 1098, 1101, 1146, 1162, 1169, 1101, 1185, 1151, 1090,
                1110, 1173, 1054, 1087, 1109, 1177, 1165, 1089, 1204, 1184, 1107, 1189, 1193, 1088, 1197, 1180, 1201,
                1208, 1042, 1212, 1219, 1223, 1227, 1231, 1235, 1245, 1777, 1527, 1686, 1686, 1238, 1686, 1254, 1686,
                1686, 1686, 1294, 1669, 1686, 1686, 1686, 1322, 1625, 1534, 1268, 1624, 1275, 1281, 1443, 1292, 1300,
                1686, 1686, 1686, 1350, 1826, 1306, 1686, 1686, 1240, 2032, 1317, 1321, 1686, 1686, 1253, 1686, 1326,
                1686, 1686, 1686, 1418, 1709, 1446, 1686, 1686, 1686, 1492, 1686, 1295, 1447, 1686, 1686, 1258, 1686,
                1736, 1686, 1686, 1520, 1355, 1686, 1288, 1348, 1361, 1686, 1359, 1686, 1364, 1498, 1368, 1302, 1362,
                1381, 1389, 1395, 1486, 1686, 1371, 1377, 1370, 1686, 1375, 1382, 1384, 1402, 1408, 1385, 1383, 1619,
                1413, 1423, 1428, 1433, 1686, 1686, 1270, 1686, 1338, 1686, 1440, 1686, 1686, 1686, 1499, 1465, 1686,
                1686, 1686, 1639, 1473, 1884, 1686, 1686, 1293, 1864, 1686, 1686, 1296, 1321, 1483, 1686, 1686, 1686,
                1646, 1686, 1748, 1496, 1686, 1418, 1675, 1686, 1418, 1702, 1686, 1418, 1981, 1686, 1429, 1409, 1427,
                1504, 1692, 1686, 1686, 1313, 1448, 1651, 1508, 1686, 1686, 1340, 1686, 1903, 1686, 1686, 1435, 1513,
                1686, 1283, 1287, 1519, 1686, 1524, 1363, 1568, 1938, 1539, 1566, 1579, 1479, 1533, 1538, 1553, 1544,
                1552, 1557, 1563, 1574, 1557, 1583, 1589, 1590, 1759, 1594, 1603, 1607, 1611, 1686, 1436, 1514, 1686,
                1434, 1656, 1686, 1434, 1680, 1686, 1453, 1686, 1686, 1686, 1559, 1617, 1686, 1770, 1418, 1623, 1769,
                1629, 1686, 1515, 1335, 1686, 1285, 1686, 1671, 1921, 1650, 1686, 1686, 1344, 1308, 1666, 1686, 1686,
                1686, 1659, 1685, 1686, 1686, 1686, 1686, 1241, 1686, 1686, 1844, 1691, 1686, 1630, 1977, 1970, 1362,
                1686, 1686, 1686, 1693, 1698, 1686, 1686, 1686, 1697, 1686, 1764, 1715, 1686, 1634, 1638, 1686, 1599,
                1585, 1686, 1271, 1686, 1269, 1686, 1721, 1686, 1686, 1354, 1686, 1801, 1686, 1799, 1686, 1640, 1686,
                1686, 1461, 1686, 1686, 1732, 1686, 1944, 1686, 1740, 1686, 1746, 1415, 1396, 1686, 1598, 1547, 1417,
                1597, 1416, 1577, 1546, 1397, 1577, 1547, 1548, 1570, 1398, 1753, 1686, 1652, 1509, 1686, 1686, 1686,
                1757, 1686, 1419, 1686, 1763, 1418, 1768, 1781, 1686, 1686, 1686, 1705, 1686, 2048, 1792, 1686, 1686,
                1686, 1735, 1686, 1797, 1686, 1686, 1404, 1686, 1639, 1815, 1686, 1686, 1418, 2017, 1820, 1686, 1686,
                1803, 1686, 1686, 1686, 1736, 1489, 1686, 1686, 1825, 1338, 1260, 1263, 1686, 1686, 1785, 1686, 1686,
                1728, 1686, 1686, 1749, 1497, 1830, 1830, 1262, 1248, 1261, 1329, 1260, 1264, 1329, 1248, 1249, 1259,
                1540, 1849, 1842, 1686, 1686, 1835, 1686, 1686, 1816, 1686, 1686, 1831, 1882, 1848, 1686, 1686, 1686,
                1774, 2071, 1854, 1686, 1686, 1469, 1884, 1686, 1821, 1859, 1686, 1686, 1350, 1883, 1686, 1686, 1686,
                1781, 1391, 1875, 1686, 1686, 1613, 1644, 1686, 1686, 1889, 1686, 1686, 1662, 1884, 1686, 1885, 1890,
                1686, 1686, 1686, 1894, 1686, 1686, 1678, 1686, 1907, 1686, 1686, 1529, 1914, 1686, 1838, 1686, 1686,
                1881, 1686, 1686, 1872, 1876, 1836, 1919, 1686, 1837, 1692, 1910, 1686, 1925, 1928, 1742, 1686, 1811,
                1811, 1930, 1810, 1929, 1935, 1928, 1900, 1942, 1867, 1868, 1931, 1035, 1788, 1948, 1952, 1956, 1960,
                1964, 1686, 1976, 1686, 1686, 1686, 2065, 1686, 1992, 2037, 1686, 1686, 1998, 2009, 1972, 2002, 1686,
                1686, 1686, 2077, 1300, 2023, 1686, 1686, 1686, 1807, 2031, 1686, 1686, 1686, 1860, 1500, 2032, 1686,
                1686, 1686, 2083, 1686, 2036, 1686, 1277, 1276, 2042, 1877, 1686, 1686, 2041, 1686, 1686, 2027, 2037,
                2012, 1686, 2012, 1855, 1850, 1686, 2046, 1686, 1686, 2054, 1996, 1686, 1897, 1309, 2059, 2052, 1686,
                2058, 1686, 1686, 2081, 1686, 1717, 1477, 1686, 1331, 1686, 1686, 1687, 1686, 1860, 1681, 1686, 1686,
                1686, 1966, 1724, 1686, 1686, 1686, 1984, 2015, 1686, 1686, 1686, 1988, 1686, 2063, 1686, 1686, 1686,
                2005, 1686, 1727, 1686, 1686, 1711, 1457, 2069, 1686, 1686, 1686, 2019, 2075, 1686, 1686, 1915, 1686,
                1686, 1793, 1874, 1686, 1686, 1491, 1362, 1449, 1686, 1686, 1460, 2098, 2087, 2091, 2095, 2184, 2102,
                2113, 2780, 2117, 2134, 2142, 2281, 2146, 2146, 2146, 2304, 2296, 2181, 2639, 2591, 2872, 2592, 2873,
                2313, 2195, 2200, 2281, 2146, 2273, 2226, 2204, 2152, 2219, 2276, 2167, 2177, 2276, 2235, 2276, 2276,
                2230, 2281, 2276, 2296, 2276, 2293, 2276, 2276, 2276, 2276, 2234, 2276, 2311, 2314, 2210, 2199, 2217,
                2222, 2276, 2276, 2276, 2240, 2276, 2294, 2276, 2276, 2173, 2276, 2198, 2281, 2281, 2281, 2281, 2282,
                2146, 2146, 2146, 2146, 2205, 2146, 2204, 2248, 2276, 2235, 2276, 2297, 2276, 2276, 2276, 2277, 2256,
                2281, 2283, 2146, 2146, 2146, 2275, 2276, 2295, 2276, 2276, 2293, 2146, 2304, 2264, 2269, 2221, 2276,
                2276, 2276, 2293, 2295, 2276, 2276, 2276, 2295, 2263, 2205, 2268, 2220, 2172, 2276, 2276, 2276, 2296,
                2276, 2276, 2296, 2294, 2276, 2276, 2278, 2281, 2281, 2280, 2281, 2281, 2281, 2283, 2206, 2223, 2276,
                2276, 2279, 2281, 2281, 2146, 2273, 2276, 2276, 2281, 2281, 2281, 2276, 2292, 2276, 2298, 2225, 2276,
                2298, 2169, 2224, 2292, 2298, 2171, 2229, 2281, 2281, 2171, 2236, 2281, 2281, 2281, 2146, 2275, 2225,
                2292, 2299, 2276, 2229, 2281, 2146, 2276, 2290, 2297, 2283, 2146, 2146, 2274, 2224, 2227, 2298, 2225,
                2297, 2276, 2230, 2170, 2230, 2282, 2146, 2147, 2151, 2156, 2288, 2276, 2230, 2303, 2308, 2236, 2284,
                2228, 2318, 2318, 2318, 2326, 2335, 2339, 2343, 2349, 2416, 2693, 2357, 2592, 2109, 2592, 2592, 2162,
                2943, 2823, 2646, 2592, 2361, 2592, 2122, 2592, 2592, 2122, 2470, 2592, 2592, 2592, 2109, 2107, 2592,
                2592, 2592, 2123, 2592, 2592, 2592, 2125, 2592, 2413, 2592, 2592, 2592, 2127, 2592, 2592, 2414, 2592,
                2592, 2592, 2130, 2952, 2592, 2594, 2592, 2592, 2212, 2609, 2252, 2592, 2592, 2592, 2446, 2434, 2592,
                2592, 2592, 2212, 2446, 2450, 2456, 2431, 2435, 2592, 2592, 2243, 2478, 2448, 2439, 2946, 2592, 2592,
                2592, 2368, 2809, 2813, 2450, 2441, 2212, 2812, 2449, 2440, 2947, 2592, 2592, 2592, 2345, 2451, 2457,
                2948, 2592, 2124, 2592, 2592, 2650, 2823, 2449, 2455, 2946, 2592, 2128, 2592, 2592, 2649, 2952, 2592,
                2810, 2448, 2461, 2991, 2467, 2592, 2592, 2329, 2817, 2474, 2990, 2466, 2592, 2592, 2373, 2447, 2992,
                2469, 2592, 2592, 2592, 2373, 2447, 2477, 2468, 2592, 2592, 2353, 2469, 2592, 2495, 2592, 2592, 2415,
                2483, 2592, 2415, 2496, 2592, 2592, 2352, 2592, 2592, 2352, 2352, 2469, 2592, 2592, 2363, 2331, 2494,
                2592, 2592, 2592, 2375, 2592, 2375, 2415, 2504, 2592, 2592, 2367, 2372, 2503, 2592, 2592, 2592, 2389,
                2418, 2415, 2592, 2592, 2373, 2592, 2592, 2592, 2593, 2732, 2417, 2415, 2592, 2417, 2520, 2592, 2592,
                2592, 2390, 2521, 2521, 2592, 2592, 2592, 2401, 2599, 2585, 2526, 2531, 2120, 2592, 2212, 2426, 2450,
                2463, 2948, 2592, 2592, 2592, 2213, 2389, 2527, 2532, 2121, 2542, 2551, 2105, 2592, 2213, 2592, 2592,
                2592, 2558, 2538, 2544, 2553, 2557, 2537, 2543, 2552, 2421, 2572, 2576, 2546, 2543, 2547, 2592, 2592,
                2373, 2615, 2575, 2545, 2105, 2592, 2244, 2479, 2592, 2129, 2592, 2592, 2628, 2690, 2469, 2562, 2566,
                2592, 2592, 2592, 2415, 2928, 2934, 2401, 2570, 2574, 2564, 2572, 2585, 2590, 2592, 2592, 2585, 2965,
                2592, 2592, 2592, 2445, 2251, 2592, 2592, 2592, 2474, 2592, 2609, 2892, 2592, 2362, 2592, 2592, 2138,
                2851, 2159, 2592, 2592, 2592, 2509, 2888, 2892, 2592, 2592, 2592, 2490, 2418, 2891, 2592, 2592, 2376,
                2592, 2592, 2374, 2592, 2889, 2388, 2592, 2373, 2373, 2890, 2592, 2592, 2387, 2592, 2887, 2505, 2892,
                2592, 2373, 2610, 2388, 2592, 2592, 2376, 2373, 2592, 2887, 2891, 2592, 2374, 2592, 2592, 2608, 2159,
                2614, 2620, 2592, 2592, 2394, 2594, 2887, 2399, 2592, 2887, 2397, 2508, 2374, 2507, 2592, 2375, 2592,
                2592, 2592, 2595, 2508, 2506, 2592, 2506, 2505, 2505, 2592, 2507, 2637, 2505, 2592, 2592, 2401, 2661,
                2592, 2643, 2592, 2592, 2417, 2592, 2655, 2592, 2592, 2592, 2510, 2414, 2656, 2592, 2592, 2592, 2516,
                2592, 2593, 2660, 2665, 2880, 2592, 2592, 2592, 2522, 2767, 2666, 2881, 2592, 2592, 2420, 2571, 2696,
                2592, 2592, 2592, 2580, 2572, 2686, 2632, 2698, 2592, 2383, 2514, 2592, 2163, 2932, 2465, 2685, 2631,
                2697, 2592, 2388, 2592, 2592, 2212, 2604, 2671, 2632, 2678, 2592, 2401, 2405, 2409, 2592, 2592, 2592,
                2679, 2592, 2592, 2592, 2592, 2108, 2677, 2591, 2592, 2592, 2592, 2419, 2592, 2683, 2187, 2191, 2469,
                2671, 2189, 2467, 2592, 2401, 2629, 2633, 2702, 2468, 2592, 2592, 2421, 2536, 2703, 2469, 2592, 2592,
                2422, 2573, 2593, 2672, 2467, 2592, 2402, 2406, 2592, 2402, 2979, 2592, 2592, 2626, 2673, 2467, 2592,
                2446, 2259, 2947, 2592, 2377, 2709, 2592, 2592, 2522, 2862, 2713, 2468, 2592, 2592, 2581, 2572, 2562,
                2374, 2374, 2592, 2376, 2721, 2724, 2592, 2592, 2624, 2373, 2731, 2592, 2592, 2592, 2626, 2732, 2592,
                2592, 2592, 2755, 2656, 2726, 2736, 2741, 2592, 2486, 2593, 2381, 2592, 2727, 2737, 2742, 2715, 2747,
                2753, 2592, 2498, 2469, 2873, 2743, 2592, 2592, 2592, 2791, 2759, 2763, 2592, 2592, 2627, 2704, 2592,
                2592, 2522, 2789, 2593, 2761, 2753, 2592, 2498, 2863, 2592, 2592, 2767, 2592, 2592, 2592, 2792, 2789,
                2592, 2592, 2592, 2803, 2126, 2592, 2592, 2592, 2811, 2122, 2592, 2592, 2592, 2834, 2777, 2592, 2592,
                2592, 2848, 2936, 2591, 2489, 2797, 2592, 2592, 2670, 2631, 2490, 2798, 2592, 2592, 2592, 2963, 2807,
                2592, 2592, 2592, 2965, 2838, 2592, 2592, 2592, 2975, 2330, 2818, 2829, 2592, 2498, 2939, 2592, 2498,
                2592, 2791, 2331, 2819, 2830, 2592, 2592, 2592, 2982, 2834, 2817, 2828, 2106, 2592, 2592, 2592, 2405,
                2405, 2817, 2828, 2592, 2592, 2415, 2849, 2842, 2592, 2522, 2773, 2592, 2522, 2868, 2592, 2580, 2600,
                2586, 2137, 2850, 2843, 2592, 2592, 2855, 2937, 2844, 2592, 2592, 2592, 2987, 2936, 2591, 2592, 2592,
                2684, 2630, 2592, 2856, 2938, 2592, 2592, 2860, 2939, 2592, 2592, 2872, 2592, 2861, 2591, 2592, 2592,
                2887, 2616, 2592, 2867, 2592, 2592, 2708, 2592, 2498, 2469, 2498, 2497, 2785, 2773, 2499, 2783, 2770,
                2877, 2877, 2877, 2772, 2592, 2592, 2345, 2885, 2592, 2592, 2592, 2715, 2762, 2515, 2896, 2592, 2592,
                2715, 2917, 2516, 2897, 2592, 2592, 2592, 2901, 2906, 2911, 2592, 2592, 2956, 2960, 2715, 2902, 2907,
                2912, 2593, 2916, 2920, 2820, 2922, 2822, 2592, 2592, 2715, 2927, 2921, 2821, 2106, 2592, 2592, 2974,
                2408, 2321, 2821, 2106, 2592, 2592, 2983, 2592, 2593, 2404, 2408, 2592, 2592, 2717, 2749, 2716, 2928,
                2322, 2822, 2593, 2926, 2919, 2820, 2934, 2823, 2592, 2592, 2592, 2651, 2824, 2592, 2592, 2592, 2130,
                2952, 2592, 2592, 2592, 2592, 2964, 2592, 2592, 2716, 2748, 2592, 2969, 2592, 2592, 2716, 2918, 2368,
                2970, 2592, 2592, 2592, 2403, 2407, 2592, 2592, 2787, 2211, 2404, 2409, 2592, 2592, 2802, 2837, 2987,
                2592, 2592, 2592, 2809, 2427, 2592, 2793, 2592, 2592, 2809, 2447, 1073741824, 2147483648, 539754496,
                542375936, 402653184, 554434560, 571736064, 545521856, 268451840, 335544320, 268693630, 512, 2048, 256,
                1024, 0, 1024, 0, 1073741824, 2147483648, 0, 0, 0, 8388608, 0, 0, 1073741824, 1073741824, 0, 2147483648,
                537133056, 4194304, 1048576, 268435456, -1073741824, 0, 0, 0, 1048576, 0, 0, 0, 1572864, 0, 0, 0,
                4194304, 0, 134217728, 16777216, 0, 0, 32, 64, 98304, 0, 33554432, 8388608, 192, 67108864, 67108864,
                67108864, 67108864, 16, 32, 4, 0, 8192, 196608, 196608, 229376, 80, 4096, 524288, 8388608, 0, 0, 32,
                128, 256, 24576, 24600, 24576, 24576, 2, 24576, 24576, 24576, 24584, 24592, 24576, 24578, 24576, 24578,
                24576, 24576, 16, 512, 2048, 2048, 256, 4096, 32768, 1048576, 4194304, 67108864, 134217728, 268435456,
                262144, 134217728, 0, 128, 128, 64, 16384, 16384, 16384, 67108864, 32, 32, 4, 4, 4096, 262144,
                134217728, 0, 0, 0, 2, 0, 8192, 131072, 131072, 4096, 4096, 4096, 4096, 24576, 24576, 24576, 8, 8,
                24576, 24576, 16384, 16384, 16384, 24576, 24584, 24576, 24576, 24576, 16384, 24576, 536870912, 262144,
                0, 0, 32, 2048, 8192, 4, 4096, 4096, 4096, 786432, 8388608, 16777216, 0, 128, 16384, 16384, 16384,
                32768, 65536, 2097152, 32, 32, 32, 32, 4, 4, 4, 4, 4, 4096, 67108864, 67108864, 67108864, 24576, 24576,
                24576, 24576, 0, 16384, 16384, 16384, 16384, 67108864, 67108864, 8, 67108864, 24576, 8, 8, 8, 24576,
                24576, 24576, 24578, 24576, 24576, 24576, 2, 2, 2, 16384, 67108864, 67108864, 67108864, 32, 67108864, 8,
                8, 24576, 2048, 2147483648, 536870912, 262144, 262144, 262144, 67108864, 8, 24576, 16384, 32768,
                1048576, 4194304, 25165824, 67108864, 24576, 32770, 2, 4, 112, 512, 98304, 524288, 50, 402653186,
                1049090, 1049091, 10, 66, 100925514, 10, 66, 12582914, 0, 0, -1678194207, -1678194207, -1041543218, 0,
                32768, 0, 0, 32, 65536, 268435456, 1, 1, 513, 1048577, 0, 12582912, 0, 0, 0, 4, 1792, 0, 0, 0, 7,
                29360128, 0, 0, 0, 8, 0, 0, 0, 12, 1, 1, 0, 0, -604102721, -604102721, 4194304, 8388608, 0, 0, 0, 31,
                925600, 997981306, 997981306, 997981306, 0, 0, 2048, 8388608, 0, 0, 1, 2, 4, 32, 64, 512, 8192, 0, 0, 0,
                245760, 997720064, 0, 0, 0, 32, 0, 0, 0, 3, 12, 16, 32, 8, 112, 3072, 12288, 16384, 32768, 65536,
                131072, 7864320, 16777216, 973078528, 0, 0, 65536, 131072, 3670016, 4194304, 16777216, 33554432, 2, 8,
                48, 2048, 8192, 16384, 32768, 65536, 131072, 524288, 131072, 524288, 3145728, 4194304, 16777216,
                33554432, 65536, 131072, 2097152, 4194304, 16777216, 33554432, 134217728, 268435456, 536870912, 0, 0, 0,
                1024, 0, 8, 48, 2048, 8192, 65536, 33554432, 268435456, 536870912, 65536, 268435456, 536870912, 0, 0,
                32768, 0, 0, 126, 623104, 65011712, 0, 32, 65536, 536870912, 0, 0, 65536, 524288, 0, 32, 65536, 0, 0, 0,
                2048, 0, 0, 0, 15482, 245760, -604102721, 0, 0, 0, 18913, 33062912, 925600, -605028352, 0, 0, 0, 65536,
                31, 8096, 131072, 786432, 3145728, 3145728, 12582912, 50331648, 134217728, 268435456, 160, 256, 512,
                7168, 131072, 786432, 131072, 786432, 1048576, 2097152, 12582912, 16777216, 268435456, 1073741824,
                2147483648, 12582912, 16777216, 33554432, 268435456, 1073741824, 2147483648, 3, 12, 16, 160, 256, 7168,
                786432, 1048576, 12582912, 16777216, 268435456, 1073741824, 0, 8, 16, 32, 128, 256, 512, 7168, 786432,
                1048576, 2097152, 0, 1, 2, 8, 16, 7168, 786432, 1048576, 8388608, 16777216, 16777216, 1073741824, 0, 0,
                0, 0, 1, 0, 0, 8, 32, 128, 256, 7168, 8, 32, 0, 3072, 0, 8, 32, 3072, 4096, 524288, 8, 32, 0, 0, 3072,
                4096, 0, 2048, 524288, 8388608, 8, 2048, 0, 0, 1, 12, 256, 4096, 32768, 262144, 1048576, 4194304,
                67108864, 0, 2048, 0, 2048, 2048, 1073741824, -58805985, -58805985, -58805985, 0, 0, 262144, 0, 0, 32,
                4194304, 16777216, 134217728, 4382, 172032, -58982400, 0, 0, 2, 28, 256, 4096, 8192, 8192, 32768,
                131072, 262144, 524288, 1, 2, 12, 256, 4096, 0, 0, 4194304, 67108864, 134217728, 805306368, 1073741824,
                0, 0, 1, 2, 12, 16, 256, 4096, 1048576, 67108864, 134217728, 268435456, 0, 512, 1048576, 4194304,
                201326592, 1879048192, 0, 0, 12, 256, 4096, 134217728, 268435456, 536870912, 12, 256, 268435456,
                536870912, 0, 12, 256, 0, 0, 1, 32, 64, 512, 0, 0, 205236961, 205236961, 0, 0, 0, 1, 96, 640, 1, 10976,
                229376, 204996608, 0, 640, 2048, 8192, 229376, 1572864, 1572864, 2097152, 201326592, 0, 0, 0, 64, 512,
                2048, 229376, 1572864, 201326592, 1572864, 201326592, 0, 0, 1, 4382, 0, 1, 32, 2048, 65536, 131072,
                1572864, 201326592, 131072, 1572864, 134217728, 0, 0, 524288, 524288, 0, 0, 0, -68582786, -68582786,
                -68582786, 0, 0, 2097152, 524288, 0, 524288, 0, 0, 65536, 131072, 1572864, 0, 0, 2, 4, 0, 0, 65011712,
                -134217728, 0, 0, 0, 0, 2, 4, 120, 512, -268435456, 0, 0, 0, 2, 8, 48, 64, 2048, 8192, 98304, 524288,
                2097152, 4194304, 25165824, 33554432, 134217728, 268435456, 2147483648, 0, 0, 25165824, 33554432,
                134217728, 1879048192, 2147483648, 0, 0, 4, 112, 512, 622592, 65011712, 134217728, -268435456, 16777216,
                33554432, 134217728, 1610612736, 0, 0, 0, 64, 98304, 524288, 4194304, 16777216, 33554432, 0, 98304,
                524288, 16777216, 33554432, 0, 65536, 524288, 33554432, 536870912, 1073741824, 0, 65536, 524288,
                536870912, 1073741824, 0, 0, 65536, 524288, 536870912, 0, 524288, 0, 524288, 524288, 1048576,
                2086666240, 2147483648, 0, -1678194207, 0, 0, 0, 8, 32, 2048, 524288, 8388608, 0, 0, 33062912,
                436207616, 2147483648, 0, 0, 32, 64, 2432, 16384, 32768, 32768, 524288, 3145728, 4194304, 25165824,
                25165824, 167772160, 268435456, 2147483648, 0, 32, 64, 384, 2048, 16384, 32768, 1048576, 2097152,
                4194304, 25165824, 32, 64, 128, 256, 2048, 16384, 2048, 16384, 1048576, 4194304, 16777216, 33554432,
                134217728, 536870912, 1073741824, 0, 0, 2048, 16384, 4194304, 16777216, 33554432, 134217728, 805306368,
                0, 0, 16777216, 134217728, 268435456, 2147483648, 0, 622592, 622592, 622592, 8807, 8807, 434791, 0, 0,
                16777216, 0, 0, 0, 7, 608, 8192, 0, 0, 0, 3, 4, 96, 512, 32, 64, 8192, 0, 0, 16777216, 134217728, 0, 0,
                2, 4, 8192, 16384, 65536, 2097152, 33554432, 268435456,
              ]),
              (r.TOKEN = [
                "(0)",
                "ModuleDecl",
                "Annotation",
                "OptionDecl",
                "Operator",
                "Variable",
                "Tag",
                "EndTag",
                "PragmaContents",
                "DirCommentContents",
                "DirPIContents",
                "CDataSectionContents",
                "AttrTest",
                "Wildcard",
                "EQName",
                "IntegerLiteral",
                "DecimalLiteral",
                "DoubleLiteral",
                "PredefinedEntityRef",
                "'\"\"'",
                "EscapeApos",
                "QuotChar",
                "AposChar",
                "ElementContentChar",
                "QuotAttrContentChar",
                "AposAttrContentChar",
                "NCName",
                "QName",
                "S",
                "CharRef",
                "CommentContents",
                "DocTag",
                "DocCommentContents",
                "EOF",
                "'!'",
                "'\"'",
                "'#'",
                "'#)'",
                "''''",
                "'('",
                "'(#'",
                "'(:'",
                "'(:~'",
                "')'",
                "'*'",
                "'*'",
                "','",
                "'-->'",
                "'.'",
                "'/'",
                "'/>'",
                "':'",
                "':)'",
                "';'",
                "'<!--'",
                "'<![CDATA['",
                "'<?'",
                "'='",
                "'>'",
                "'?'",
                "'?>'",
                "'NaN'",
                "'['",
                "']'",
                "']]>'",
                "'after'",
                "'all'",
                "'allowing'",
                "'ancestor'",
                "'ancestor-or-self'",
                "'and'",
                "'any'",
                "'append'",
                "'array'",
                "'as'",
                "'ascending'",
                "'at'",
                "'attribute'",
                "'base-uri'",
                "'before'",
                "'boundary-space'",
                "'break'",
                "'by'",
                "'case'",
                "'cast'",
                "'castable'",
                "'catch'",
                "'check'",
                "'child'",
                "'collation'",
                "'collection'",
                "'comment'",
                "'constraint'",
                "'construction'",
                "'contains'",
                "'content'",
                "'context'",
                "'continue'",
                "'copy'",
                "'copy-namespaces'",
                "'count'",
                "'decimal-format'",
                "'decimal-separator'",
                "'declare'",
                "'default'",
                "'delete'",
                "'descendant'",
                "'descendant-or-self'",
                "'descending'",
                "'diacritics'",
                "'different'",
                "'digit'",
                "'distance'",
                "'div'",
                "'document'",
                "'document-node'",
                "'element'",
                "'else'",
                "'empty'",
                "'empty-sequence'",
                "'encoding'",
                "'end'",
                "'entire'",
                "'eq'",
                "'every'",
                "'exactly'",
                "'except'",
                "'exit'",
                "'external'",
                "'first'",
                "'following'",
                "'following-sibling'",
                "'for'",
                "'foreach'",
                "'foreign'",
                "'from'",
                "'ft-option'",
                "'ftand'",
                "'ftnot'",
                "'ftor'",
                "'function'",
                "'ge'",
                "'greatest'",
                "'group'",
                "'grouping-separator'",
                "'gt'",
                "'idiv'",
                "'if'",
                "'import'",
                "'in'",
                "'index'",
                "'infinity'",
                "'inherit'",
                "'insensitive'",
                "'insert'",
                "'instance'",
                "'integrity'",
                "'intersect'",
                "'into'",
                "'is'",
                "'item'",
                "'json'",
                "'json-item'",
                "'key'",
                "'language'",
                "'last'",
                "'lax'",
                "'le'",
                "'least'",
                "'let'",
                "'levels'",
                "'loop'",
                "'lowercase'",
                "'lt'",
                "'minus-sign'",
                "'mod'",
                "'modify'",
                "'module'",
                "'most'",
                "'namespace'",
                "'namespace-node'",
                "'ne'",
                "'next'",
                "'no'",
                "'no-inherit'",
                "'no-preserve'",
                "'node'",
                "'nodes'",
                "'not'",
                "'object'",
                "'occurs'",
                "'of'",
                "'on'",
                "'only'",
                "'option'",
                "'or'",
                "'order'",
                "'ordered'",
                "'ordering'",
                "'paragraph'",
                "'paragraphs'",
                "'parent'",
                "'pattern-separator'",
                "'per-mille'",
                "'percent'",
                "'phrase'",
                "'position'",
                "'preceding'",
                "'preceding-sibling'",
                "'preserve'",
                "'previous'",
                "'processing-instruction'",
                "'relationship'",
                "'rename'",
                "'replace'",
                "'return'",
                "'returning'",
                "'revalidation'",
                "'same'",
                "'satisfies'",
                "'schema'",
                "'schema-attribute'",
                "'schema-element'",
                "'score'",
                "'self'",
                "'sensitive'",
                "'sentence'",
                "'sentences'",
                "'skip'",
                "'sliding'",
                "'some'",
                "'stable'",
                "'start'",
                "'stemming'",
                "'stop'",
                "'strict'",
                "'strip'",
                "'structured-item'",
                "'switch'",
                "'text'",
                "'then'",
                "'thesaurus'",
                "'times'",
                "'to'",
                "'treat'",
                "'try'",
                "'tumbling'",
                "'type'",
                "'typeswitch'",
                "'union'",
                "'unique'",
                "'unordered'",
                "'updating'",
                "'uppercase'",
                "'using'",
                "'validate'",
                "'value'",
                "'variable'",
                "'version'",
                "'weight'",
                "'when'",
                "'where'",
                "'while'",
                "'wildcards'",
                "'window'",
                "'with'",
                "'without'",
                "'word'",
                "'words'",
                "'xquery'",
                "'zero-digit'",
                "'{'",
                "'{{'",
                "'|'",
                "'}'",
                "'}}'",
              ]);
          },
          {},
        ],
        2: [
          function (e, t, n) {
            var r = e("./XQueryTokenizer").XQueryTokenizer,
              i = function (e) {
                var t = e;
                (this.tokens = []),
                  (this.reset = function () {
                    (t = t), (this.tokens = []);
                  }),
                  (this.startNonterminal = function () {}),
                  (this.endNonterminal = function () {}),
                  (this.terminal = function (e, n, r) {
                    this.tokens.push({ name: e, value: t.substring(n, r) });
                  }),
                  (this.whitespace = function (e, n) {
                    this.tokens.push({ name: "WS", value: t.substring(e, n) });
                  });
              },
              s =
                "after|ancestor|ancestor-or-self|and|as|ascending|attribute|before|case|cast|castable|child|collation|comment|copy|count|declare|default|delete|descendant|descendant-or-self|descending|div|document|document-node|element|else|empty|empty-sequence|end|eq|every|except|first|following|following-sibling|for|function|ge|group|gt|idiv|if|import|insert|instance|intersect|into|is|item|last|le|let|lt|mod|modify|module|namespace|namespace-node|ne|node|only|or|order|ordered|parent|preceding|preceding-sibling|processing-instruction|rename|replace|return|satisfies|schema-attribute|schema-element|self|some|stable|start|switch|text|to|treat|try|typeswitch|union|unordered|validate|where|with|xquery|contains|paragraphs|sentences|times|words|by|collectionreturn|variable|version|option|when|encoding|toswitch|catch|tumbling|sliding|window|at|using|stemming|collection|schema|while|on|nodes|index|external|then|in|updating|value|of|containsbreak|loop|continue|exit|returning|append|json|position|strict".split(
                  "|"
                ),
              o = s.map(function (e) {
                return { name: "'" + e + "'", token: "keyword" };
              }),
              u = s.map(function (e) {
                return {
                  name: "'" + e + "'",
                  token: "text",
                  next: function (e) {
                    e.pop();
                  },
                };
              }),
              a = "constant.language",
              f = "constant",
              l = "comment",
              c = "xml-pe",
              h = "constant.buildin",
              p = function (e) {
                return "'" + e + "'";
              },
              d = {
                start: [
                  {
                    name: p("(#"),
                    token: h,
                    next: function (e) {
                      e.push("Pragma");
                    },
                  },
                  {
                    name: p("(:"),
                    token: "comment",
                    next: function (e) {
                      e.push("Comment");
                    },
                  },
                  {
                    name: p("(:~"),
                    token: "comment.doc",
                    next: function (e) {
                      e.push("CommentDoc");
                    },
                  },
                  {
                    name: p("<!--"),
                    token: l,
                    next: function (e) {
                      e.push("XMLComment");
                    },
                  },
                  {
                    name: p("<?"),
                    token: c,
                    next: function (e) {
                      e.push("PI");
                    },
                  },
                  {
                    name: p("''"),
                    token: "string",
                    next: function (e) {
                      e.push("AposString");
                    },
                  },
                  {
                    name: p('"'),
                    token: "string",
                    next: function (e) {
                      e.push("QuotString");
                    },
                  },
                  { name: "Annotation", token: "support.function" },
                  {
                    name: "ModuleDecl",
                    token: "keyword",
                    next: function (e) {
                      e.push("Prefix");
                    },
                  },
                  {
                    name: "OptionDecl",
                    token: "keyword",
                    next: function (e) {
                      e.push("_EQName");
                    },
                  },
                  { name: "AttrTest", token: "support.type" },
                  { name: "Variable", token: "variable" },
                  {
                    name: p("<![CDATA["),
                    token: a,
                    next: function (e) {
                      e.push("CData");
                    },
                  },
                  { name: "IntegerLiteral", token: f },
                  { name: "DecimalLiteral", token: f },
                  { name: "DoubleLiteral", token: f },
                  { name: "Operator", token: "keyword.operator" },
                  {
                    name: "EQName",
                    token: function (e) {
                      return s.indexOf(e) !== -1 ? "keyword" : "support.function";
                    },
                  },
                  { name: p("("), token: "lparen" },
                  { name: p(")"), token: "rparen" },
                  {
                    name: "Tag",
                    token: "meta.tag",
                    next: function (e) {
                      e.push("StartTag");
                    },
                  },
                  {
                    name: p("}"),
                    token: "text",
                    next: function (e) {
                      e.length > 1 && e.pop();
                    },
                  },
                  {
                    name: p("{"),
                    token: "text",
                    next: function (e) {
                      e.push("start");
                    },
                  },
                ].concat(o),
                _EQName: [
                  {
                    name: "EQName",
                    token: "text",
                    next: function (e) {
                      e.pop();
                    },
                  },
                ].concat(u),
                Prefix: [
                  {
                    name: "NCName",
                    token: "text",
                    next: function (e) {
                      e.pop();
                    },
                  },
                ].concat(u),
                StartTag: [
                  {
                    name: p(">"),
                    token: "meta.tag",
                    next: function (e) {
                      e.push("TagContent");
                    },
                  },
                  { name: "QName", token: "entity.other.attribute-name" },
                  { name: p("="), token: "text" },
                  {
                    name: p("''"),
                    token: "string",
                    next: function (e) {
                      e.push("AposAttr");
                    },
                  },
                  {
                    name: p('"'),
                    token: "string",
                    next: function (e) {
                      e.push("QuotAttr");
                    },
                  },
                  {
                    name: p("/>"),
                    token: "meta.tag.r",
                    next: function (e) {
                      e.pop();
                    },
                  },
                ],
                TagContent: [
                  { name: "ElementContentChar", token: "text" },
                  {
                    name: p("<![CDATA["),
                    token: a,
                    next: function (e) {
                      e.push("CData");
                    },
                  },
                  {
                    name: p("<!--"),
                    token: l,
                    next: function (e) {
                      e.push("XMLComment");
                    },
                  },
                  {
                    name: "Tag",
                    token: "meta.tag",
                    next: function (e) {
                      e.push("StartTag");
                    },
                  },
                  { name: "PredefinedEntityRef", token: "constant.language.escape" },
                  { name: "CharRef", token: "constant.language.escape" },
                  { name: p("{{"), token: "text" },
                  { name: p("}}"), token: "text" },
                  {
                    name: p("{"),
                    token: "text",
                    next: function (e) {
                      e.push("start");
                    },
                  },
                  {
                    name: "EndTag",
                    token: "meta.tag",
                    next: function (e) {
                      e.pop(), e.pop();
                    },
                  },
                ],
                AposAttr: [
                  {
                    name: p("''"),
                    token: "string",
                    next: function (e) {
                      e.pop();
                    },
                  },
                  { name: "EscapeApos", token: "constant.language.escape" },
                  { name: "AposAttrContentChar", token: "string" },
                  { name: "PredefinedEntityRef", token: "constant.language.escape" },
                  { name: "CharRef", token: "constant.language.escape" },
                  { name: p("{{"), token: "string" },
                  { name: p("}}"), token: "string" },
                  {
                    name: p("{"),
                    token: "text",
                    next: function (e) {
                      e.push("start");
                    },
                  },
                ],
                QuotAttr: [
                  {
                    name: p('"'),
                    token: "string",
                    next: function (e) {
                      e.pop();
                    },
                  },
                  { name: "EscapeQuot", token: "constant.language.escape" },
                  { name: "QuotAttrContentChar", token: "string" },
                  { name: "PredefinedEntityRef", token: "constant.language.escape" },
                  { name: "CharRef", token: "constant.language.escape" },
                  { name: p("{{"), token: "string" },
                  { name: p("}}"), token: "string" },
                  {
                    name: p("{"),
                    token: "text",
                    next: function (e) {
                      e.push("start");
                    },
                  },
                ],
                Pragma: [
                  { name: "PragmaContents", token: h },
                  { name: p("#"), token: h },
                  {
                    name: p("#)"),
                    token: h,
                    next: function (e) {
                      e.pop();
                    },
                  },
                ],
                Comment: [
                  { name: "CommentContents", token: "comment" },
                  {
                    name: p("(:"),
                    token: "comment",
                    next: function (e) {
                      e.push("Comment");
                    },
                  },
                  {
                    name: p(":)"),
                    token: "comment",
                    next: function (e) {
                      e.pop();
                    },
                  },
                ],
                CommentDoc: [
                  { name: "DocCommentContents", token: "comment.doc" },
                  { name: "DocTag", token: "comment.doc.tag" },
                  {
                    name: p("(:"),
                    token: "comment.doc",
                    next: function (e) {
                      e.push("CommentDoc");
                    },
                  },
                  {
                    name: p(":)"),
                    token: "comment.doc",
                    next: function (e) {
                      e.pop();
                    },
                  },
                ],
                XMLComment: [
                  { name: "DirCommentContents", token: l },
                  {
                    name: p("-->"),
                    token: l,
                    next: function (e) {
                      e.pop();
                    },
                  },
                ],
                CData: [
                  { name: "CDataSectionContents", token: a },
                  {
                    name: p("]]>"),
                    token: a,
                    next: function (e) {
                      e.pop();
                    },
                  },
                ],
                PI: [
                  { name: "DirPIContents", token: c },
                  { name: p("?"), token: c },
                  {
                    name: p("?>"),
                    token: c,
                    next: function (e) {
                      e.pop();
                    },
                  },
                ],
                AposString: [
                  {
                    name: p("''"),
                    token: "string",
                    next: function (e) {
                      e.pop();
                    },
                  },
                  { name: "PredefinedEntityRef", token: "constant.language.escape" },
                  { name: "CharRef", token: "constant.language.escape" },
                  { name: "EscapeApos", token: "constant.language.escape" },
                  { name: "AposChar", token: "string" },
                ],
                QuotString: [
                  {
                    name: p('"'),
                    token: "string",
                    next: function (e) {
                      e.pop();
                    },
                  },
                  { name: "PredefinedEntityRef", token: "constant.language.escape" },
                  { name: "CharRef", token: "constant.language.escape" },
                  { name: "EscapeQuot", token: "constant.language.escape" },
                  { name: "QuotChar", token: "string" },
                ],
              };
            n.XQueryLexer = function () {
              function e(e) {
                e = e.slice(0).sort();
                var t, n, r;
                (t = e[0]), (r = t.length), (n = e.pop());
                while (r && n.indexOf(t) === -1) t = t.substring(0, --r);
                return t;
              }
              (this.tokens = []),
                (this.getLineTokens = function (t, n, s) {
                  n = n === "start" || !n ? '["start"]' : n;
                  var o = JSON.parse(n),
                    u = new i(t),
                    a = new r(t, u),
                    f = [];
                  for (;;) {
                    var l = o[o.length - 1];
                    try {
                      (u.tokens = []), a["parse_" + l]();
                      var c = null;
                      u.tokens.length > 1 &&
                        u.tokens[0].name === "WS" &&
                        (f.push({ type: "text", value: u.tokens[0].value }), u.tokens.splice(0, 1));
                      var h = u.tokens[0],
                        p = d[l];
                      for (var v = 0; v < p.length; v++) {
                        var m = d[l][v];
                        if ((typeof m.name == "function" && m.name(h)) || m.name === h.name) {
                          c = m;
                          break;
                        }
                      }
                      if (h.name === "EOF") break;
                      if (h.value === "") throw "Encountered empty string lexical rule.";
                      f.push({
                        type: c === null ? "text" : typeof c.token == "function" ? c.token(h.value) : c.token,
                        value: h.value,
                      }),
                        c && c.next && c.next(o);
                    } catch (g) {
                      if (g instanceof a.ParseException) {
                        var y = 0;
                        for (var b = 0; b < f.length; b++) y += f[b].value.length;
                        return (
                          f.push({ type: "text", value: t.substring(y) }),
                          { tokens: f, state: JSON.stringify(["start"]) }
                        );
                      }
                      throw g;
                    }
                  }
                  if (this.tokens[s] !== undefined) {
                    var w = this.lines[s],
                      E = e([t, w]),
                      S = w.length - t.length,
                      x = 0,
                      T = 0;
                    for (var b = 0; b < f.length; b++) {
                      var N = f[b];
                      for (var C = 0; C < this.tokens[s].length; C++) {
                        var k = this.tokens[s][C];
                        if (
                          (T + N.value.length <= E.length && k.sc === T && k.ec === T + N.value.length) ||
                          (k.sc === T + S && k.ec === T + N.value.length + S)
                        )
                          (x = b), (N.type = k.type);
                      }
                      T += N.value.length;
                    }
                  }
                  return { tokens: f, state: JSON.stringify(o) };
                });
            };
          },
          { "./XQueryTokenizer": 1 },
        ],
      },
      {},
      [2]
    )(2);
  }),
  define(
    "ace/snippets",
    [
      "require",
      "exports",
      "module",
      "ace/lib/oop",
      "ace/lib/event_emitter",
      "ace/lib/lang",
      "ace/range",
      "ace/anchor",
      "ace/keyboard/hash_handler",
      "ace/tokenizer",
      "ace/lib/dom",
      "ace/editor",
    ],
    function (e, t, n) {
      var r = e("./lib/oop"),
        i = e("./lib/event_emitter").EventEmitter,
        s = e("./lib/lang"),
        o = e("./range").Range,
        u = e("./anchor").Anchor,
        a = e("./keyboard/hash_handler").HashHandler,
        f = e("./tokenizer").Tokenizer,
        l = o.comparePoints,
        c = function () {
          (this.snippetMap = {}), (this.snippetNameMap = {});
        };
      (function () {
        r.implement(this, i),
          (this.getTokenizer = function () {
            function e(e, t, n) {
              return (
                (e = e.substr(1)),
                /^\d+$/.test(e) && !n.inFormatString ? [{ tabstopId: parseInt(e, 10) }] : [{ text: e }]
              );
            }
            function t(e) {
              return "(?:[^\\\\" + e + "]|\\\\.)";
            }
            return (
              (c.$tokenizer = new f({
                start: [
                  {
                    regex: /:/,
                    onMatch: function (e, t, n) {
                      return n.length && n[0].expectIf ? ((n[0].expectIf = !1), (n[0].elseBranch = n[0]), [n[0]]) : ":";
                    },
                  },
                  {
                    regex: /\\./,
                    onMatch: function (e, t, n) {
                      var r = e[1];
                      return (
                        r == "}" && n.length
                          ? (e = r)
                          : "`$\\".indexOf(r) != -1
                          ? (e = r)
                          : n.inFormatString &&
                            (r == "n"
                              ? (e = "\n")
                              : r == "t"
                              ? (e = "\n")
                              : "ulULE".indexOf(r) != -1 && (e = { changeCase: r, local: r > "a" })),
                        [e]
                      );
                    },
                  },
                  {
                    regex: /}/,
                    onMatch: function (e, t, n) {
                      return [n.length ? n.shift() : e];
                    },
                  },
                  { regex: /\$(?:\d+|\w+)/, onMatch: e },
                  {
                    regex: /\$\{[\dA-Z_a-z]+/,
                    onMatch: function (t, n, r) {
                      var i = e(t.substr(1), n, r);
                      return r.unshift(i[0]), i;
                    },
                    next: "snippetVar",
                  },
                  { regex: /\n/, token: "newline", merge: !1 },
                ],
                snippetVar: [
                  {
                    regex: "\\|" + t("\\|") + "*\\|",
                    onMatch: function (e, t, n) {
                      n[0].choices = e.slice(1, -1).split(",");
                    },
                    next: "start",
                  },
                  {
                    regex: "/(" + t("/") + "+)/(?:(" + t("/") + "*)/)(\\w*):?",
                    onMatch: function (e, t, n) {
                      var r = n[0];
                      return (
                        (r.fmtString = e),
                        (e = this.splitRegex.exec(e)),
                        (r.guard = e[1]),
                        (r.fmt = e[2]),
                        (r.flag = e[3]),
                        ""
                      );
                    },
                    next: "start",
                  },
                  {
                    regex: "`" + t("`") + "*`",
                    onMatch: function (e, t, n) {
                      return (n[0].code = e.splice(1, -1)), "";
                    },
                    next: "start",
                  },
                  {
                    regex: "\\?",
                    onMatch: function (e, t, n) {
                      n[0] && (n[0].expectIf = !0);
                    },
                    next: "start",
                  },
                  { regex: "([^:}\\\\]|\\\\.)*:?", token: "", next: "start" },
                ],
                formatString: [
                  { regex: "/(" + t("/") + "+)/", token: "regex" },
                  {
                    regex: "",
                    onMatch: function (e, t, n) {
                      n.inFormatString = !0;
                    },
                    next: "start",
                  },
                ],
              })),
              (c.prototype.getTokenizer = function () {
                return c.$tokenizer;
              }),
              c.$tokenizer
            );
          }),
          (this.tokenizeTmSnippet = function (e, t) {
            return this.getTokenizer()
              .getLineTokens(e, t)
              .tokens.map(function (e) {
                return e.value || e;
              });
          }),
          (this.$getDefaultValue = function (e, t) {
            if (/^[A-Z]\d+$/.test(t)) {
              var n = t.substr(1);
              return (this.variables[t[0] + "__"] || {})[n];
            }
            if (/^\d+$/.test(t)) return (this.variables.__ || {})[t];
            t = t.replace(/^TM_/, "");
            if (!e) return;
            var r = e.session;
            switch (t) {
              case "CURRENT_WORD":
                var i = r.getWordRange();
              case "SELECTION":
              case "SELECTED_TEXT":
                return r.getTextRange(i);
              case "CURRENT_LINE":
                return r.getLine(e.getCursorPosition().row);
              case "PREV_LINE":
                return r.getLine(e.getCursorPosition().row - 1);
              case "LINE_INDEX":
                return e.getCursorPosition().column;
              case "LINE_NUMBER":
                return e.getCursorPosition().row + 1;
              case "SOFT_TABS":
                return r.getUseSoftTabs() ? "YES" : "NO";
              case "TAB_SIZE":
                return r.getTabSize();
              case "FILENAME":
              case "FILEPATH":
                return "";
              case "FULLNAME":
                return "Ace";
            }
          }),
          (this.variables = {}),
          (this.getVariableValue = function (e, t) {
            return this.variables.hasOwnProperty(t) ? this.variables[t](e, t) || "" : this.$getDefaultValue(e, t) || "";
          }),
          (this.tmStrFormat = function (e, t, n) {
            var r = t.flag || "",
              i = t.guard;
            i = new RegExp(i, r.replace(/[^gi]/, ""));
            var s = this.tokenizeTmSnippet(t.fmt, "formatString"),
              o = this,
              u = e.replace(i, function () {
                o.variables.__ = arguments;
                var e = o.resolveVariables(s, n),
                  t = "E";
                for (var r = 0; r < e.length; r++) {
                  var i = e[r];
                  if (typeof i == "object") {
                    e[r] = "";
                    if (i.changeCase && i.local) {
                      var u = e[r + 1];
                      u &&
                        typeof u == "string" &&
                        (i.changeCase == "u" ? (e[r] = u[0].toUpperCase()) : (e[r] = u[0].toLowerCase()),
                        (e[r + 1] = u.substr(1)));
                    } else i.changeCase && (t = i.changeCase);
                  } else t == "U" ? (e[r] = i.toUpperCase()) : t == "L" && (e[r] = i.toLowerCase());
                }
                return e.join("");
              });
            return (this.variables.__ = null), u;
          }),
          (this.resolveVariables = function (e, t) {
            function o(t) {
              var n = e.indexOf(t, r + 1);
              n != -1 && (r = n);
            }
            var n = [];
            for (var r = 0; r < e.length; r++) {
              var i = e[r];
              if (typeof i == "string") n.push(i);
              else {
                if (typeof i != "object") continue;
                if (i.skip) o(i);
                else {
                  if (i.processed < r) continue;
                  if (i.text) {
                    var s = this.getVariableValue(t, i.text);
                    s && i.fmtString && (s = this.tmStrFormat(s, i)),
                      (i.processed = r),
                      i.expectIf == null ? s && (n.push(s), o(i)) : s ? (i.skip = i.elseBranch) : o(i);
                  } else i.tabstopId != null ? n.push(i) : i.changeCase != null && n.push(i);
                }
              }
            }
            return n;
          }),
          (this.insertSnippetForSelection = function (e, t) {
            function f(e) {
              var t = [];
              for (var n = 0; n < e.length; n++) {
                var r = e[n];
                if (typeof r == "object") {
                  if (a[r.tabstopId]) continue;
                  var i = e.lastIndexOf(r, n - 1);
                  r = t[i] || { tabstopId: r.tabstopId };
                }
                t[n] = r;
              }
              return t;
            }
            var n = e.getCursorPosition(),
              r = e.session.getLine(n.row),
              i = e.session.getTabString(),
              s = r.match(/^\s*/)[0];
            n.column < s.length && (s = s.slice(0, n.column));
            var o = this.tokenizeTmSnippet(t);
            (o = this.resolveVariables(o, e)),
              (o = o.map(function (e) {
                return e == "\n" ? e + s : typeof e == "string" ? e.replace(/\t/g, i) : e;
              }));
            var u = [];
            o.forEach(function (e, t) {
              if (typeof e != "object") return;
              var n = e.tabstopId,
                r = u[n];
              r || ((r = u[n] = []), (r.index = n), (r.value = ""));
              if (r.indexOf(e) !== -1) return;
              r.push(e);
              var i = o.indexOf(e, t + 1);
              if (i === -1) return;
              var s = o.slice(t + 1, i),
                a = s.some(function (e) {
                  return typeof e == "object";
                });
              a && !r.value
                ? (r.value = s)
                : s.length && (!r.value || typeof r.value != "string") && (r.value = s.join(""));
            }),
              u.forEach(function (e) {
                e.length = 0;
              });
            var a = {};
            for (var l = 0; l < o.length; l++) {
              var c = o[l];
              if (typeof c != "object") continue;
              var p = c.tabstopId,
                d = o.indexOf(c, l + 1);
              if (a[p]) {
                a[p] === c && (a[p] = null);
                continue;
              }
              var v = u[p],
                m = typeof v.value == "string" ? [v.value] : f(v.value);
              m.unshift(l + 1, Math.max(0, d - l)),
                m.push(c),
                (a[p] = c),
                o.splice.apply(o, m),
                v.indexOf(c) === -1 && v.push(c);
            }
            var g = 0,
              y = 0,
              b = "";
            o.forEach(function (e) {
              typeof e == "string"
                ? (e[0] === "\n" ? ((y = e.length - 1), g++) : (y += e.length), (b += e))
                : e.start
                ? (e.end = { row: g, column: y })
                : (e.start = { row: g, column: y });
            });
            var w = e.getSelectionRange(),
              E = e.session.replace(w, b),
              S = new h(e),
              x = e.inVirtualSelectionMode && e.selection.index;
            S.addTabstops(u, w.start, E, x);
          }),
          (this.insertSnippet = function (e, t) {
            var n = this;
            if (e.inVirtualSelectionMode) return n.insertSnippetForSelection(e, t);
            e.forEachSelection(
              function () {
                n.insertSnippetForSelection(e, t);
              },
              null,
              { keepOrder: !0 }
            ),
              e.tabstopManager && e.tabstopManager.tabNext();
          }),
          (this.$getScope = function (e) {
            var t = e.session.$mode.$id || "";
            t = t.split("/").pop();
            if (t === "html" || t === "php") {
              t === "php" && !e.session.$mode.inlinePhp && (t = "html");
              var n = e.getCursorPosition(),
                r = e.session.getState(n.row);
              typeof r == "object" && (r = r[0]),
                r.substring &&
                  (r.substring(0, 3) == "js-"
                    ? (t = "javascript")
                    : r.substring(0, 4) == "css-"
                    ? (t = "css")
                    : r.substring(0, 4) == "php-" && (t = "php"));
            }
            return t;
          }),
          (this.getActiveScopes = function (e) {
            var t = this.$getScope(e),
              n = [t],
              r = this.snippetMap;
            return r[t] && r[t].includeScopes && n.push.apply(n, r[t].includeScopes), n.push("_"), n;
          }),
          (this.expandWithTab = function (e, t) {
            var n = this,
              r = e.forEachSelection(
                function () {
                  return n.expandSnippetForSelection(e, t);
                },
                null,
                { keepOrder: !0 }
              );
            return r && e.tabstopManager && e.tabstopManager.tabNext(), r;
          }),
          (this.expandSnippetForSelection = function (e, t) {
            var n = e.getCursorPosition(),
              r = e.session.getLine(n.row),
              i = r.substring(0, n.column),
              s = r.substr(n.column),
              o = this.snippetMap,
              u;
            return (
              this.getActiveScopes(e).some(function (e) {
                var t = o[e];
                return t && (u = this.findMatchingSnippet(t, i, s)), !!u;
              }, this),
              u
                ? t && t.dryRun
                  ? !0
                  : (e.session.doc.removeInLine(
                      n.row,
                      n.column - u.replaceBefore.length,
                      n.column + u.replaceAfter.length
                    ),
                    (this.variables.M__ = u.matchBefore),
                    (this.variables.T__ = u.matchAfter),
                    this.insertSnippetForSelection(e, u.content),
                    (this.variables.M__ = this.variables.T__ = null),
                    !0)
                : !1
            );
          }),
          (this.findMatchingSnippet = function (e, t, n) {
            for (var r = e.length; r--; ) {
              var i = e[r];
              if (i.startRe && !i.startRe.test(t)) continue;
              if (i.endRe && !i.endRe.test(n)) continue;
              if (!i.startRe && !i.endRe) continue;
              return (
                (i.matchBefore = i.startRe ? i.startRe.exec(t) : [""]),
                (i.matchAfter = i.endRe ? i.endRe.exec(n) : [""]),
                (i.replaceBefore = i.triggerRe ? i.triggerRe.exec(t)[0] : ""),
                (i.replaceAfter = i.endTriggerRe ? i.endTriggerRe.exec(n)[0] : ""),
                i
              );
            }
          }),
          (this.snippetMap = {}),
          (this.snippetNameMap = {}),
          (this.register = function (e, t) {
            function o(e) {
              return e && !/^\^?\(.*\)\$?$|^\\b$/.test(e) && (e = "(?:" + e + ")"), e || "";
            }
            function u(e, t, n) {
              return (
                (e = o(e)),
                (t = o(t)),
                n
                  ? ((e = t + e), e && e[e.length - 1] != "$" && (e += "$"))
                  : ((e += t), e && e[0] != "^" && (e = "^" + e)),
                new RegExp(e)
              );
            }
            function a(e) {
              e.scope || (e.scope = t || "_"), (t = e.scope), n[t] || ((n[t] = []), (r[t] = {}));
              var o = r[t];
              if (e.name) {
                var a = o[e.name];
                a && i.unregister(a), (o[e.name] = e);
              }
              n[t].push(e),
                e.tabTrigger &&
                  !e.trigger &&
                  (!e.guard && /^\w/.test(e.tabTrigger) && (e.guard = "\\b"),
                  (e.trigger = s.escapeRegExp(e.tabTrigger))),
                (e.startRe = u(e.trigger, e.guard, !0)),
                (e.triggerRe = new RegExp(e.trigger, "", !0)),
                (e.endRe = u(e.endTrigger, e.endGuard, !0)),
                (e.endTriggerRe = new RegExp(e.endTrigger, "", !0));
            }
            var n = this.snippetMap,
              r = this.snippetNameMap,
              i = this;
            e.content ? a(e) : Array.isArray(e) && e.forEach(a), this._signal("registerSnippets", { scope: t });
          }),
          (this.unregister = function (e, t) {
            function i(e) {
              var i = r[e.scope || t];
              if (i && i[e.name]) {
                delete i[e.name];
                var s = n[e.scope || t],
                  o = s && s.indexOf(e);
                o >= 0 && s.splice(o, 1);
              }
            }
            var n = this.snippetMap,
              r = this.snippetNameMap;
            e.content ? i(e) : Array.isArray(e) && e.forEach(i);
          }),
          (this.parseSnippetFile = function (e) {
            e = e.replace(/\r/g, "");
            var t = [],
              n = {},
              r = /^#.*|^({[\s\S]*})\s*$|^(\S+) (.*)$|^((?:\n*\t.*)+)/gm,
              i;
            while ((i = r.exec(e))) {
              if (i[1])
                try {
                  (n = JSON.parse(i[1])), t.push(n);
                } catch (s) {}
              if (i[4]) (n.content = i[4].replace(/^\t/gm, "")), t.push(n), (n = {});
              else {
                var o = i[2],
                  u = i[3];
                if (o == "regex") {
                  var a = /\/((?:[^\/\\]|\\.)*)|$/g;
                  (n.guard = a.exec(u)[1]),
                    (n.trigger = a.exec(u)[1]),
                    (n.endTrigger = a.exec(u)[1]),
                    (n.endGuard = a.exec(u)[1]);
                } else o == "snippet" ? ((n.tabTrigger = u.match(/^\S*/)[0]), n.name || (n.name = u)) : (n[o] = u);
              }
            }
            return t;
          }),
          (this.getSnippetByName = function (e, t) {
            var n = this.snippetNameMap,
              r;
            return (
              this.getActiveScopes(t).some(function (t) {
                var i = n[t];
                return i && (r = i[e]), !!r;
              }, this),
              r
            );
          });
      }.call(c.prototype));
      var h = function (e) {
        if (e.tabstopManager) return e.tabstopManager;
        (e.tabstopManager = this),
          (this.$onChange = this.onChange.bind(this)),
          (this.$onChangeSelection = s.delayedCall(this.onChangeSelection.bind(this)).schedule),
          (this.$onChangeSession = this.onChangeSession.bind(this)),
          (this.$onAfterExec = this.onAfterExec.bind(this)),
          this.attach(e);
      };
      (function () {
        (this.attach = function (e) {
          (this.index = 0),
            (this.ranges = []),
            (this.tabstops = []),
            (this.$openTabstops = null),
            (this.selectedTabstop = null),
            (this.editor = e),
            this.editor.on("change", this.$onChange),
            this.editor.on("changeSelection", this.$onChangeSelection),
            this.editor.on("changeSession", this.$onChangeSession),
            this.editor.commands.on("afterExec", this.$onAfterExec),
            this.editor.keyBinding.addKeyboardHandler(this.keyboardHandler);
        }),
          (this.detach = function () {
            this.tabstops.forEach(this.removeTabstopMarkers, this),
              (this.ranges = null),
              (this.tabstops = null),
              (this.selectedTabstop = null),
              this.editor.removeListener("change", this.$onChange),
              this.editor.removeListener("changeSelection", this.$onChangeSelection),
              this.editor.removeListener("changeSession", this.$onChangeSession),
              this.editor.commands.removeListener("afterExec", this.$onAfterExec),
              this.editor.keyBinding.removeKeyboardHandler(this.keyboardHandler),
              (this.editor.tabstopManager = null),
              (this.editor = null);
          }),
          (this.onChange = function (e) {
            var t = e.data.range,
              n = e.data.action[0] == "r",
              r = t.start,
              i = t.end,
              s = r.row,
              o = i.row,
              u = o - s,
              a = i.column - r.column;
            n && ((u = -u), (a = -a));
            if (!this.$inChange && n) {
              var f = this.selectedTabstop,
                c =
                  f &&
                  !f.some(function (e) {
                    return l(e.start, r) <= 0 && l(e.end, i) >= 0;
                  });
              if (c) return this.detach();
            }
            var h = this.ranges;
            for (var p = 0; p < h.length; p++) {
              var d = h[p];
              if (d.end.row < r.row) continue;
              if (n && l(r, d.start) < 0 && l(i, d.end) > 0) {
                this.removeRange(d), p--;
                continue;
              }
              d.start.row == s && d.start.column > r.column && (d.start.column += a),
                d.end.row == s && d.end.column >= r.column && (d.end.column += a),
                d.start.row >= s && (d.start.row += u),
                d.end.row >= s && (d.end.row += u),
                l(d.start, d.end) > 0 && this.removeRange(d);
            }
            h.length || this.detach();
          }),
          (this.updateLinkedFields = function () {
            var e = this.selectedTabstop;
            if (!e || !e.hasLinkedRanges) return;
            this.$inChange = !0;
            var n = this.editor.session,
              r = n.getTextRange(e.firstNonLinked);
            for (var i = e.length; i--; ) {
              var s = e[i];
              if (!s.linked) continue;
              var o = t.snippetManager.tmStrFormat(r, s.original);
              n.replace(s, o);
            }
            this.$inChange = !1;
          }),
          (this.onAfterExec = function (e) {
            e.command && !e.command.readOnly && this.updateLinkedFields();
          }),
          (this.onChangeSelection = function () {
            if (!this.editor) return;
            var e = this.editor.selection.lead,
              t = this.editor.selection.anchor,
              n = this.editor.selection.isEmpty();
            for (var r = this.ranges.length; r--; ) {
              if (this.ranges[r].linked) continue;
              var i = this.ranges[r].contains(e.row, e.column),
                s = n || this.ranges[r].contains(t.row, t.column);
              if (i && s) return;
            }
            this.detach();
          }),
          (this.onChangeSession = function () {
            this.detach();
          }),
          (this.tabNext = function (e) {
            var t = this.tabstops.length,
              n = this.index + (e || 1);
            (n = Math.min(Math.max(n, 1), t)), n == t && (n = 0), this.selectTabstop(n), n === 0 && this.detach();
          }),
          (this.selectTabstop = function (e) {
            this.$openTabstops = null;
            var t = this.tabstops[this.index];
            t && this.addTabstopMarkers(t), (this.index = e), (t = this.tabstops[this.index]);
            if (!t || !t.length) return;
            this.selectedTabstop = t;
            if (!this.editor.inVirtualSelectionMode) {
              var n = this.editor.multiSelect;
              n.toSingleRange(t.firstNonLinked.clone());
              for (var r = t.length; r--; ) {
                if (t.hasLinkedRanges && t[r].linked) continue;
                n.addRange(t[r].clone(), !0);
              }
              n.ranges[0] && n.addRange(n.ranges[0].clone());
            } else this.editor.selection.setRange(t.firstNonLinked);
            this.editor.keyBinding.addKeyboardHandler(this.keyboardHandler);
          }),
          (this.addTabstops = function (e, t, n) {
            this.$openTabstops || (this.$openTabstops = []);
            if (!e[0]) {
              var r = o.fromPoints(n, n);
              v(r.start, t), v(r.end, t), (e[0] = [r]), (e[0].index = 0);
            }
            var i = this.index,
              s = [i + 1, 0],
              u = this.ranges;
            e.forEach(function (e, n) {
              var r = this.$openTabstops[n] || e;
              for (var i = e.length; i--; ) {
                var a = e[i],
                  f = o.fromPoints(a.start, a.end || a.start);
                d(f.start, t),
                  d(f.end, t),
                  (f.original = a),
                  (f.tabstop = r),
                  u.push(f),
                  r != e ? r.unshift(f) : (r[i] = f),
                  a.fmtString
                    ? ((f.linked = !0), (r.hasLinkedRanges = !0))
                    : r.firstNonLinked || (r.firstNonLinked = f);
              }
              r.firstNonLinked || (r.hasLinkedRanges = !1),
                r === e && (s.push(r), (this.$openTabstops[n] = r)),
                this.addTabstopMarkers(r);
            }, this),
              s.length > 2 &&
                (this.tabstops.length && s.push(s.splice(2, 1)[0]), this.tabstops.splice.apply(this.tabstops, s));
          }),
          (this.addTabstopMarkers = function (e) {
            var t = this.editor.session;
            e.forEach(function (e) {
              e.markerId || (e.markerId = t.addMarker(e, "ace_snippet-marker", "text"));
            });
          }),
          (this.removeTabstopMarkers = function (e) {
            var t = this.editor.session;
            e.forEach(function (e) {
              t.removeMarker(e.markerId), (e.markerId = null);
            });
          }),
          (this.removeRange = function (e) {
            var t = e.tabstop.indexOf(e);
            e.tabstop.splice(t, 1),
              (t = this.ranges.indexOf(e)),
              this.ranges.splice(t, 1),
              this.editor.session.removeMarker(e.markerId),
              e.tabstop.length ||
                ((t = this.tabstops.indexOf(e.tabstop)),
                t != -1 && this.tabstops.splice(t, 1),
                this.tabstops.length || this.detach());
          }),
          (this.keyboardHandler = new a()),
          this.keyboardHandler.bindKeys({
            Tab: function (e) {
              if (t.snippetManager && t.snippetManager.expandWithTab(e)) return;
              e.tabstopManager.tabNext(1);
            },
            "Shift-Tab": function (e) {
              e.tabstopManager.tabNext(-1);
            },
            Esc: function (e) {
              e.tabstopManager.detach();
            },
            Return: function (e) {
              return !1;
            },
          });
      }.call(h.prototype));
      var p = {};
      (p.onChange = u.prototype.onChange),
        (p.setPosition = function (e, t) {
          (this.pos.row = e), (this.pos.column = t);
        }),
        (p.update = function (e, t, n) {
          (this.$insertRight = n), (this.pos = e), this.onChange(t);
        });
      var d = function (e, t) {
          e.row == 0 && (e.column += t.column), (e.row += t.row);
        },
        v = function (e, t) {
          e.row == t.row && (e.column -= t.column), (e.row -= t.row);
        };
      e("./lib/dom").importCssString(
        ".ace_snippet-marker {    -moz-box-sizing: border-box;    box-sizing: border-box;    background: rgba(194, 193, 208, 0.09);    border: 1px dotted rgba(211, 208, 235, 0.62);    position: absolute;}"
      ),
        (t.snippetManager = new c());
      var m = e("./editor").Editor;
      (function () {
        (this.insertSnippet = function (e, n) {
          return t.snippetManager.insertSnippet(this, e, n);
        }),
          (this.expandSnippet = function (e) {
            return t.snippetManager.expandWithTab(this, e);
          });
      }.call(m.prototype));
    }
  ),
  define(
    "ace/autocomplete",
    [
      "require",
      "exports",
      "module",
      "ace/keyboard/hash_handler",
      "ace/autocomplete/popup",
      "ace/autocomplete/util",
      "ace/lib/event",
      "ace/lib/lang",
      "ace/snippets",
    ],
    function (e, t, n) {
      var r = e("./keyboard/hash_handler").HashHandler,
        i = e("./autocomplete/popup").AcePopup,
        s = e("./autocomplete/util"),
        o = e("./lib/event"),
        u = e("./lib/lang"),
        a = e("./snippets").snippetManager,
        f = function () {
          (this.autoInsert = !0),
            (this.autoSelect = !0),
            (this.keyboardHandler = new r()),
            this.keyboardHandler.bindKeys(this.commands),
            (this.blurListener = this.blurListener.bind(this)),
            (this.changeListener = this.changeListener.bind(this)),
            (this.mousedownListener = this.mousedownListener.bind(this)),
            (this.mousewheelListener = this.mousewheelListener.bind(this)),
            (this.changeTimer = u.delayedCall(
              function () {
                this.updateCompletions(!0);
              }.bind(this)
            ));
        };
      (function () {
        (this.gatherCompletionsId = 0),
          (this.$init = function () {
            (this.popup = new i(document.body || document.documentElement)),
              this.popup.on(
                "click",
                function (e) {
                  this.insertMatch(), e.stop();
                }.bind(this)
              ),
              (this.popup.focus = this.editor.focus.bind(this.editor));
          }),
          (this.openPopup = function (e, t, n) {
            this.popup || this.$init(), this.popup.setData(this.completions.filtered);
            var r = e.renderer;
            this.popup.setRow(this.autoSelect ? 0 : -1);
            if (!n) {
              this.popup.setTheme(e.getTheme()), this.popup.setFontSize(e.getFontSize());
              var i = r.layerConfig.lineHeight,
                s = r.$cursorLayer.getPixelPosition(this.base, !0);
              s.left -= this.popup.getTextLeftOffset();
              var o = e.container.getBoundingClientRect();
              (s.top += o.top - r.layerConfig.offset),
                (s.left += o.left - e.renderer.scrollLeft),
                (s.left += r.$gutterLayer.gutterWidth),
                this.popup.show(s, i);
            }
          }),
          (this.detach = function () {
            this.editor.keyBinding.removeKeyboardHandler(this.keyboardHandler),
              this.editor.off("changeSelection", this.changeListener),
              this.editor.off("blur", this.blurListener),
              this.editor.off("mousedown", this.mousedownListener),
              this.editor.off("mousewheel", this.mousewheelListener),
              this.changeTimer.cancel(),
              this.popup && this.popup.isOpen && (this.gatherCompletionsId = this.gatherCompletionsId + 1),
              this.popup && this.popup.hide(),
              (this.activated = !1),
              (this.completions = this.base = null);
          }),
          (this.changeListener = function (e) {
            var t = this.editor.selection.lead;
            (t.row != this.base.row || t.column < this.base.column) && this.detach(),
              this.activated ? this.changeTimer.schedule() : this.detach();
          }),
          (this.blurListener = function () {
            var e = document.activeElement;
            e != this.editor.textInput.getElement() && e.parentNode != this.popup.container && this.detach();
          }),
          (this.mousedownListener = function (e) {
            this.detach();
          }),
          (this.mousewheelListener = function (e) {
            this.detach();
          }),
          (this.goTo = function (e) {
            var t = this.popup.getRow(),
              n = this.popup.session.getLength() - 1;
            switch (e) {
              case "up":
                t = t <= 0 ? n : t - 1;
                break;
              case "down":
                t = t >= n ? -1 : t + 1;
                break;
              case "start":
                t = 0;
                break;
              case "end":
                t = n;
            }
            this.popup.setRow(t);
          }),
          (this.insertMatch = function (e) {
            e || (e = this.popup.getData(this.popup.getRow()));
            if (!e) return !1;
            if (e.completer && e.completer.insertMatch) e.completer.insertMatch(this.editor);
            else {
              if (this.completions.filterText) {
                var t = this.editor.selection.getAllRanges();
                for (var n = 0, r; (r = t[n]); n++)
                  (r.start.column -= this.completions.filterText.length), this.editor.session.remove(r);
              }
              e.snippet
                ? a.insertSnippet(this.editor, e.snippet)
                : this.editor.execCommand("insertstring", e.value || e);
            }
            this.detach();
          }),
          (this.commands = {
            Up: function (e) {
              e.completer.goTo("up");
            },
            Down: function (e) {
              e.completer.goTo("down");
            },
            "Ctrl-Up|Ctrl-Home": function (e) {
              e.completer.goTo("start");
            },
            "Ctrl-Down|Ctrl-End": function (e) {
              e.completer.goTo("end");
            },
            Esc: function (e) {
              e.completer.detach();
            },
            Space: function (e) {
              e.completer.detach(), e.insert(" ");
            },
            Return: function (e) {
              return e.completer.insertMatch();
            },
            "Shift-Return": function (e) {
              e.completer.insertMatch(!0);
            },
            Tab: function (e) {
              var t = e.completer.insertMatch();
              if (!!t || !!e.tabstopManager) return t;
              e.completer.goTo("down");
            },
            PageUp: function (e) {
              e.completer.popup.gotoPageUp();
            },
            PageDown: function (e) {
              e.completer.popup.gotoPageDown();
            },
          }),
          (this.gatherCompletions = function (e, t) {
            var n = e.getSession(),
              r = e.getCursorPosition(),
              i = n.getLine(r.row),
              o = s.retrievePrecedingIdentifier(i, r.column);
            (this.base = e.getCursorPosition()), (this.base.column -= o.length);
            var u = [],
              a = e.completers.length;
            return (
              e.completers.forEach(function (i, f) {
                i.getCompletions(e, n, r, o, function (r, i) {
                  r || (u = u.concat(i));
                  var o = e.getCursorPosition(),
                    f = n.getLine(o.row);
                  t(null, {
                    prefix: s.retrievePrecedingIdentifier(f, o.column, i[0] && i[0].identifierRegex),
                    matches: u,
                    finished: --a === 0,
                  });
                });
              }),
              !0
            );
          }),
          (this.showPopup = function (e) {
            this.editor && this.detach(),
              (this.activated = !0),
              (this.editor = e),
              e.completer != this && (e.completer && e.completer.detach(), (e.completer = this)),
              e.keyBinding.addKeyboardHandler(this.keyboardHandler),
              e.on("changeSelection", this.changeListener),
              e.on("blur", this.blurListener),
              e.on("mousedown", this.mousedownListener),
              e.on("mousewheel", this.mousewheelListener),
              this.updateCompletions();
          }),
          (this.updateCompletions = function (e) {
            if (e && this.base && this.completions) {
              var t = this.editor.getCursorPosition(),
                n = this.editor.session.getTextRange({ start: this.base, end: t });
              if (n == this.completions.filterText) return;
              this.completions.setFilter(n);
              if (!this.completions.filtered.length) return this.detach();
              if (
                this.completions.filtered.length == 1 &&
                this.completions.filtered[0].value == n &&
                !this.completions.filtered[0].snippet
              )
                return this.detach();
              this.openPopup(this.editor, n, e);
              return;
            }
            var r = this.gatherCompletionsId;
            this.gatherCompletions(
              this.editor,
              function (t, n) {
                var i = function () {
                    if (!n.finished) return;
                    return this.detach();
                  }.bind(this),
                  s = n.prefix,
                  o = n && n.matches;
                if (!o || !o.length) return i();
                if (s.indexOf(n.prefix) !== 0 || r != this.gatherCompletionsId) return;
                (this.completions = new l(o)), this.completions.setFilter(s);
                var u = this.completions.filtered;
                if (!u.length) return i();
                if (u.length == 1 && u[0].value == s && !u[0].snippet) return i();
                if (this.autoInsert && u.length == 1) return this.insertMatch(u[0]);
                this.openPopup(this.editor, s, e);
              }.bind(this)
            );
          }),
          (this.cancelContextMenu = function () {
            var e = function (t) {
              this.editor.off("nativecontextmenu", e), t && t.domEvent && o.stopEvent(t.domEvent);
            }.bind(this);
            setTimeout(e, 10), this.editor.on("nativecontextmenu", e);
          });
      }.call(f.prototype),
        (f.startCommand = {
          name: "startAutocomplete",
          exec: function (e) {
            e.completer || (e.completer = new f()),
              (e.completer.autoInsert = e.completer.autoSelect = !0),
              e.completer.showPopup(e),
              e.completer.cancelContextMenu();
          },
          bindKey: "Ctrl-Space|Ctrl-Shift-Space|Alt-Space",
        }));
      var l = function (e, t, n) {
        (this.all = e), (this.filtered = e), (this.filterText = t || "");
      };
      (function () {
        (this.setFilter = function (e) {
          if (e.length > this.filterText && e.lastIndexOf(this.filterText, 0) === 0) var t = this.filtered;
          else var t = this.all;
          (this.filterText = e),
            (t = this.filterCompletions(t, this.filterText)),
            (t = t.sort(function (e, t) {
              return t.exactMatch - e.exactMatch || t.score - e.score;
            }));
          var n = null;
          (t = t.filter(function (e) {
            var t = e.value || e.caption || e.snippet;
            return t === n ? !1 : ((n = t), !0);
          })),
            (this.filtered = t);
        }),
          (this.filterCompletions = function (e, t) {
            var n = [],
              r = t.toUpperCase(),
              i = t.toLowerCase();
            e: for (var s = 0, o; (o = e[s]); s++) {
              var u = o.value || o.caption || o.snippet;
              if (!u) continue;
              var a = -1,
                f = 0,
                l = 0,
                c,
                h;
              for (var p = 0; p < t.length; p++) {
                var d = u.indexOf(i[p], a + 1),
                  v = u.indexOf(r[p], a + 1);
                c = d >= 0 ? (v < 0 || d < v ? d : v) : v;
                if (c < 0) continue e;
                (h = c - a - 1), h > 0 && (a === -1 && (l += 10), (l += h)), (f |= 1 << c), (a = c);
              }
              (o.matchMask = f), (o.exactMatch = l ? 0 : 1), (o.score = (o.score || 0) - l), n.push(o);
            }
            return n;
          });
      }.call(l.prototype),
        (t.Autocomplete = f),
        (t.FilteredList = l));
    }
  ),
  define(
    "ace/autocomplete/popup",
    [
      "require",
      "exports",
      "module",
      "ace/edit_session",
      "ace/virtual_renderer",
      "ace/editor",
      "ace/range",
      "ace/lib/event",
      "ace/lib/lang",
      "ace/lib/dom",
    ],
    function (e, t, n) {
      var r = e("../edit_session").EditSession,
        i = e("../virtual_renderer").VirtualRenderer,
        s = e("../editor").Editor,
        o = e("../range").Range,
        u = e("../lib/event"),
        a = e("../lib/lang"),
        f = e("../lib/dom"),
        l = function (e) {
          var t = new i(e);
          t.$maxLines = 4;
          var n = new s(t);
          return (
            n.setHighlightActiveLine(!1),
            n.setShowPrintMargin(!1),
            n.renderer.setShowGutter(!1),
            n.renderer.setHighlightGutterLine(!1),
            (n.$mouseHandler.$focusWaitTimout = 0),
            n
          );
        },
        c = function (e) {
          var t = f.createElement("div"),
            n = new l(t);
          e && e.appendChild(t),
            (t.style.display = "none"),
            (n.renderer.content.style.cursor = "default"),
            n.renderer.setStyle("ace_autocomplete"),
            n.setOption("displayIndentGuides", !1);
          var r = function () {};
          (n.focus = r),
            (n.$isFocused = !0),
            (n.renderer.$cursorLayer.restartTimer = r),
            (n.renderer.$cursorLayer.element.style.opacity = 0),
            (n.renderer.$maxLines = 8),
            (n.renderer.$keepTextAreaAtCursor = !1),
            n.setHighlightActiveLine(!1),
            n.session.highlight(""),
            (n.session.$searchHighlight.clazz = "ace_highlight-marker"),
            n.on("mousedown", function (e) {
              var t = e.getDocumentPosition();
              n.selection.moveToPosition(t), (c.start.row = c.end.row = t.row), e.stop();
            });
          var i,
            s = new o(-1, 0, -1, Infinity),
            c = new o(-1, 0, -1, Infinity);
          (c.id = n.session.addMarker(c, "ace_active-line", "fullLine")),
            (n.setSelectOnHover = function (e) {
              e
                ? s.id && (n.session.removeMarker(s.id), (s.id = null))
                : (s.id = n.session.addMarker(s, "ace_line-hover", "fullLine"));
            }),
            n.setSelectOnHover(!1),
            n.on("mousemove", function (e) {
              if (!i) {
                i = e;
                return;
              }
              if (i.x == e.x && i.y == e.y) return;
              (i = e), (i.scrollTop = n.renderer.scrollTop);
              var t = i.getDocumentPosition().row;
              s.start.row != t && (s.id || n.setRow(t), p(t));
            }),
            n.renderer.on("beforeRender", function () {
              if (i && s.start.row != -1) {
                i.$pos = null;
                var e = i.getDocumentPosition().row;
                s.id || n.setRow(e), p(e, !0);
              }
            }),
            n.renderer.on("afterRender", function () {
              var e = n.getRow(),
                t = n.renderer.$textLayer,
                r = t.element.childNodes[e - t.config.firstRow];
              if (r == t.selectedNode) return;
              t.selectedNode && f.removeCssClass(t.selectedNode, "ace_selected"),
                (t.selectedNode = r),
                r && f.addCssClass(r, "ace_selected");
            });
          var h = function () {
              p(-1);
            },
            p = function (e, t) {
              e !== s.start.row &&
                ((s.start.row = s.end.row = e), t || n.session._emit("changeBackMarker"), n._emit("changeHoverMarker"));
            };
          (n.getHoveredRow = function () {
            return s.start.row;
          }),
            u.addListener(n.container, "mouseout", h),
            n.on("hide", h),
            n.on("changeSelection", h),
            (n.session.doc.getLength = function () {
              return n.data.length;
            }),
            (n.session.doc.getLine = function (e) {
              var t = n.data[e];
              return typeof t == "string" ? t : (t && t.value) || "";
            });
          var d = n.session.bgTokenizer;
          return (
            (d.$tokenizeRow = function (e) {
              var t = n.data[e],
                r = [];
              if (!t) return r;
              typeof t == "string" && (t = { value: t }), t.caption || (t.caption = t.value);
              var i = -1,
                s,
                o;
              for (var e = 0; e < t.caption.length; e++)
                (o = t.caption[e]),
                  (s = t.matchMask & (1 << e) ? 1 : 0),
                  i !== s
                    ? (r.push({ type: t.className || "" + (s ? "completion-highlight" : ""), value: o }), (i = s))
                    : (r[r.length - 1].value += o);
              if (t.meta) {
                var u = n.renderer.$size.scrollerWidth / n.renderer.layerConfig.characterWidth;
                t.meta.length + t.caption.length < u - 2 && r.push({ type: "rightAlignedText", value: t.meta });
              }
              return r;
            }),
            (d.$updateOnChange = r),
            (d.start = r),
            (n.session.$computeWidth = function () {
              return (this.screenWidth = 0);
            }),
            (n.isOpen = !1),
            (n.isTopdown = !1),
            (n.data = []),
            (n.setData = function (e) {
              (n.data = e || []), n.setValue(a.stringRepeat("\n", e.length), -1), n.setRow(0);
            }),
            (n.getData = function (e) {
              return n.data[e];
            }),
            (n.getRow = function () {
              return c.start.row;
            }),
            (n.setRow = function (e) {
              (e = Math.max(-1, Math.min(this.data.length, e))),
                c.start.row != e &&
                  (n.selection.clearSelection(),
                  (c.start.row = c.end.row = e || 0),
                  n.session._emit("changeBackMarker"),
                  n.moveCursorTo(e || 0, 0),
                  n.isOpen && n._signal("select"));
            }),
            n.on("changeSelection", function () {
              n.isOpen && n.setRow(n.selection.lead.row);
            }),
            (n.hide = function () {
              (this.container.style.display = "none"), this._signal("hide"), (n.isOpen = !1);
            }),
            (n.show = function (e, t, r) {
              var s = this.container,
                o = window.innerHeight,
                u = window.innerWidth,
                a = this.renderer,
                f = a.$maxLines * t * 1.4,
                l = e.top + this.$borderSize;
              l + f > o - t && !r
                ? ((s.style.top = ""), (s.style.bottom = o - l + "px"), (n.isTopdown = !1))
                : ((l += t), (s.style.top = l + "px"), (s.style.bottom = ""), (n.isTopdown = !0)),
                (s.style.display = ""),
                this.renderer.$textLayer.checkForSizeChanges();
              var c = e.left;
              c + s.offsetWidth > u && (c = u - s.offsetWidth),
                (s.style.left = c + "px"),
                this._signal("show"),
                (i = null),
                (n.isOpen = !0);
            }),
            (n.getTextLeftOffset = function () {
              return this.$borderSize + this.renderer.$padding + this.$imageSize;
            }),
            (n.$imageSize = 0),
            (n.$borderSize = 1),
            n
          );
        };
      f.importCssString(
        ".ace_editor.ace_autocomplete .ace_marker-layer .ace_active-line {    background-color: #CAD6FA;    z-index: 1;}.ace_editor.ace_autocomplete .ace_line-hover {    border: 1px solid #abbffe;    margin-top: -1px;    background: rgba(233,233,253,0.4);}.ace_editor.ace_autocomplete .ace_line-hover {    position: absolute;    z-index: 2;}.ace_editor.ace_autocomplete .ace_scroller {   background: none;   border: none;   box-shadow: none;}.ace_rightAlignedText {    color: gray;    display: inline-block;    position: absolute;    right: 4px;    text-align: right;    z-index: -1;}.ace_editor.ace_autocomplete .ace_completion-highlight{    color: #000;    text-shadow: 0 0 0.01em;}.ace_editor.ace_autocomplete {    width: 280px;    z-index: 200000;    background: #fbfbfb;    color: #444;    border: 1px lightgray solid;    position: fixed;    box-shadow: 2px 3px 5px rgba(0,0,0,.2);    line-height: 1.4;}"
      ),
        (t.AcePopup = c);
    }
  ),
  define("ace/autocomplete/util", ["require", "exports", "module"], function (e, t, n) {
    t.parForEach = function (e, t, n) {
      var r = 0,
        i = e.length;
      i === 0 && n();
      for (var s = 0; s < i; s++)
        t(e[s], function (e, t) {
          r++, r === i && n(e, t);
        });
    };
    var r = /[a-zA-Z_0-9\$\-\u00A2-\uFFFF]/;
    (t.retrievePrecedingIdentifier = function (e, t, n) {
      n = n || r;
      var i = [];
      for (var s = t - 1; s >= 0; s--) {
        if (!n.test(e[s])) break;
        i.push(e[s]);
      }
      return i.reverse().join("");
    }),
      (t.retrieveFollowingIdentifier = function (e, t, n) {
        n = n || r;
        var i = [];
        for (var s = t; s < e.length; s++) {
          if (!n.test(e[s])) break;
          i.push(e[s]);
        }
        return i;
      });
  }),
  define("ace/autocomplete/text_completer", ["require", "exports", "module", "ace/range"], function (e, t, n) {
    function s(e, t) {
      var n = e.getTextRange(r.fromPoints({ row: 0, column: 0 }, t));
      return n.split(i).length - 1;
    }
    function o(e, t) {
      var n = s(e, t),
        r = e.getValue().split(i),
        o = Object.create(null),
        u = r[n];
      return (
        r.forEach(function (e, t) {
          if (!e || e === u) return;
          var i = Math.abs(n - t),
            s = r.length - i;
          o[e] ? (o[e] = Math.max(s, o[e])) : (o[e] = s);
        }),
        o
      );
    }
    var r = e("../range").Range,
      i = /[^a-zA-Z_0-9\$\-\u00C0-\u1FFF\u2C00-\uD7FF\w]+/;
    t.getCompletions = function (e, t, n, r, i) {
      var s = o(t, n, r),
        u = Object.keys(s);
      i(
        null,
        u.map(function (e) {
          return { name: e, value: e, score: s[e], meta: "local" };
        })
      );
    };
  }),
  define(
    "ace/ext/language_tools",
    [
      "require",
      "exports",
      "module",
      "ace/snippets",
      "ace/autocomplete",
      "ace/config",
      "ace/autocomplete/util",
      "ace/autocomplete/text_completer",
      "ace/editor",
    ],
    function (e, t, n) {
      var r = e("../snippets").snippetManager,
        i = e("../autocomplete").Autocomplete,
        s = e("../config"),
        o = e("../autocomplete/util"),
        u = e("../autocomplete/text_completer"),
        a = {
          getCompletions: function (e, t, n, r, i) {
            var s = e.session.getState(n.row),
              o = t.$mode.getCompletions(s, t, n, r);
            i(null, o);
          },
        },
        f = {
          getCompletions: function (e, t, n, i, s) {
            var o = r.snippetMap,
              u = [];
            r.getActiveScopes(e).forEach(function (e) {
              var t = o[e] || [];
              for (var n = t.length; n--; ) {
                var r = t[n],
                  i = r.name || r.tabTrigger;
                if (!i) continue;
                u.push({
                  caption: i,
                  snippet: r.content,
                  meta: r.tabTrigger && !r.name ? r.tabTrigger + "\u21e5 " : "snippet",
                });
              }
            }, this),
              s(null, u);
          },
        },
        l = [f, u, a];
      (t.addCompleter = function (e) {
        l.push(e);
      }),
        (t.textCompleter = u),
        (t.keyWordCompleter = a),
        (t.snippetCompleter = f);
      var c = {
          name: "expandSnippet",
          exec: function (e) {
            var t = r.expandWithTab(e);
            t || e.execCommand("indent");
          },
          bindKey: "Tab",
        },
        h = function (e, t) {
          p(t.session.$mode);
        },
        p = function (e) {
          var t = e.$id;
          r.files || (r.files = {}), d(t), e.modes && e.modes.forEach(p);
        },
        d = function (e) {
          if (!e || r.files[e]) return;
          var t = e.replace("mode", "snippets");
          (r.files[e] = {}),
            s.loadModule(t, function (t) {
              t &&
                ((r.files[e] = t),
                !t.snippets && t.snippetText && (t.snippets = r.parseSnippetFile(t.snippetText)),
                r.register(t.snippets || [], t.scope),
                t.includeScopes &&
                  ((r.snippetMap[t.scope].includeScopes = t.includeScopes),
                  t.includeScopes.forEach(function (e) {
                    d("ace/mode/" + e);
                  })));
            });
        },
        v = function (e) {
          var t = e.editor,
            n = e.args || "",
            r = t.getCursorPosition(),
            s = t.session.getLine(r.row),
            u = t.completer && t.completer.activated,
            a = o.retrievePrecedingIdentifier(s, r.column);
          l.forEach(function (e) {
            e.identifierRegexps &&
              e.identifierRegexps.forEach(function (e) {
                a || (a = o.retrievePrecedingIdentifier(s, r.column, e));
              });
          }),
            e.command.name === "backspace" && !a
              ? u && t.completer.detach()
              : e.command.name === "insertstring" &&
                (a && !u
                  ? (t.completer ||
                      ((t.completer = new i()), (t.completer.autoSelect = !1), (t.completer.autoInsert = !1)),
                    t.completer.showPopup(t))
                  : !a && u && t.completer.detach());
        },
        m = e("../editor").Editor;
      e("../config").defineOptions(m.prototype, "editor", {
        enableBasicAutocompletion: {
          set: function (e) {
            e
              ? ((this.completers = Array.isArray(e) ? e : l), this.commands.addCommand(i.startCommand))
              : this.commands.removeCommand(i.startCommand);
          },
          value: !1,
        },
        enableLiveAutocompletion: {
          set: function (e) {
            e
              ? ((this.completers = Array.isArray(e) ? e : l), this.commands.on("afterExec", v))
              : this.commands.removeListener("afterExec", v);
          },
          value: !1,
        },
        enableSnippets: {
          set: function (e) {
            e
              ? (this.commands.addCommand(c), this.on("changeMode", h), h(null, this))
              : (this.commands.removeCommand(c), this.off("changeMode", h));
          },
          value: !1,
        },
      });
    }
  );
