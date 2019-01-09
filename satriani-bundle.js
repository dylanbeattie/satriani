(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Satriani = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {
    InputStream: function (input) {
        var pos = 0, line = 1, col = 0;
        return {
            next: next,
            peek: peek,
            eof: eof,
            croak: croak,
        };
        function next() {
            var ch = input.charAt(pos++);
            if (ch == "\n") line++ , col = 0; else col++;
            return ch;
        }
        function peek() {
            return input.charAt(pos);
        }
        function eof() {
            return peek() == "";
        }
        function croak(msg) {
            throw new Error(msg + " (" + line + ":" + col + ")");
        }
    }
}
},{}],2:[function(require,module,exports){
module.exports = {
    parse: function (input) {
        var FALSE = { type: "bool", value: false };
        function parse(input) {
            var PRECEDENCE = {
                "=": 1,
                "||": 2,
                "&&": 3,
                "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
                "+": 10, "-": 10,
                "*": 20, "/": 20, "%": 20,
            };
            return parse_toplevel();
            function is_punc(ch) {
                var tok = input.peek();
                return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
            }
            function is_kw(kw) {
                var tok = input.peek();
                return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
            }
            function is_op(op) {
                var tok = input.peek();
                return tok && tok.type == "op" && (!op || tok.value == op) && tok;
            }
            function skip_punc(ch) {
                if (is_punc(ch)) input.next();
                else input.croak("Expecting punctuation: \"" + ch + "\"");
            }
            function skip_kw(kw) {
                if (is_kw(kw)) input.next();
                else input.croak("Expecting keyword: \"" + kw + "\"");
            }
            function skip_op(op) {
                if (is_op(op)) input.next();
                else input.croak("Expecting operator: \"" + op + "\"");
            }
            function unexpected() {
                input.croak("Unexpected token: " + JSON.stringify(input.peek()));
            }
            function maybe_binary(left, my_prec) {
                var tok = is_op();
                if (tok) {
                    var his_prec = PRECEDENCE[tok.value];
                    if (his_prec > my_prec) {
                        input.next();
                        return maybe_binary({
                            type: tok.value == "=" ? "assign" : "binary",
                            operator: tok.value,
                            left: left,
                            right: maybe_binary(parse_atom(), his_prec)
                        }, my_prec);
                    }
                }
                return left;
            }
            function delimited(start, stop, separator, parser) {
                var a = [], first = true;
                skip_punc(start);
                while (!input.eof()) {
                    if (is_punc(stop)) break;
                    if (first) first = false; else skip_punc(separator);
                    if (is_punc(stop)) break;
                    a.push(parser());
                }
                skip_punc(stop);
                return a;
            }
            function parse_call(func) {
                return {
                    type: "call",
                    func: func,
                    args: delimited("(", ")", ",", parse_expression),
                };
            }
            function parse_varname() {
                var name = input.next();
                if (name.type != "var") input.croak("Expecting variable name");
                return name.value;
            }
            function parse_if() {
                skip_kw("if");
                var cond = parse_expression();
                if (!is_punc("{")) skip_kw("then");
                var then = parse_expression();
                var ret = {
                    type: "if",
                    cond: cond,
                    then: then,
                };
                if (is_kw("else")) {
                    input.next();
                    ret.else = parse_expression();
                }
                return ret;
            }
            function parse_lambda() {
                return {
                    type: "lambda",
                    vars: delimited("(", ")", ",", parse_varname),
                    body: parse_expression()
                };
            }
            function parse_bool() {
                return {
                    type: "bool",
                    value: input.next().value == "true"
                };
            }
            function maybe_call(expr) {
                expr = expr();
                return is_punc("(") ? parse_call(expr) : expr;
            }
            function parse_atom() {
                return maybe_call(function () {
                    if (is_punc("(")) {
                        input.next();
                        var exp = parse_expression();
                        skip_punc(")");
                        return exp;
                    }
                    if (is_punc("{")) return parse_prog();
                    if (is_kw("if")) return parse_if();
                    if (is_kw("true") || is_kw("false")) return parse_bool();
                    if (is_kw("lambda") || is_kw("λ")) {
                        input.next();
                        return parse_lambda();
                    }
                    var tok = input.next();
                    if (tok.type == "var" || tok.type == "num" || tok.type == "str")
                        return tok;
                    unexpected();
                });
            }
            function parse_toplevel() {
                var prog = [];
                while (!input.eof()) {
                    prog.push(parse_expression());
                    if (!input.eof()) skip_punc(";");
                }
                return { type: "prog", prog: prog };
            }
            function parse_prog() {
                var prog = delimited("{", "}", ";", parse_expression);
                if (prog.length == 0) return FALSE;
                if (prog.length == 1) return prog[0];
                return { type: "prog", prog: prog };
            }
            function parse_expression() {
                return maybe_call(function () {
                    return maybe_binary(parse_atom(), 0);
                });
            }
        }
    }
}

},{}],3:[function(require,module,exports){
var parser = require('./parser.js');
var streamer = require('./inputstream.js');
var tokenizer = require('./tokenizer.js');

module.exports = {
    interpret: function (program) {
        var stream = streamer.InputStream(program);
        var tokens = tokenizer.Tokenize(stream);
        var ast = parser.parse(tokens);
        return (ast);
    }
}
},{"./inputstream.js":1,"./parser.js":2,"./tokenizer.js":4}],4:[function(require,module,exports){
module.exports = {
    Tokenize: function (input) {
        var current = null;
        var keywords = new Array('say', 'is');
        return {
            next: next,
            peek: peek,
            eof: eof,
            croak: input.croak
        };
        function is_keyword(x) {
            return keywords.indexOf(x) >= 0;
        }
        function is_digit(ch) {
            return /[0-9]/i.test(ch);
        }
        function is_op_char(ch) {
            return "+-*/".indexOf(ch) >= 0;
        }
        function is_whitespace(ch) {
            return " \t\n".indexOf(ch) >= 0;
        }
        function read_while(predicate) {
            var str = "";
            while (!input.eof() && predicate(input.peek()))
                str += input.next();
            return str;
        }
        function read_number() {
            var has_dot = false;
            var number = read_while(function (ch) {
                if (ch == ".") {
                    if (has_dot) return false;
                    has_dot = true;
                    return true;
                }
                return is_digit(ch);
            });
            return { type: "num", value: parseFloat(number) };
        }

        function read_ident() {
            var id = read_while(is_id);
            return {
                type: is_keyword(id) ? "kw" : "var",
                value: id
            };
        }
        function is_id_start(ch) {
            return /[a-zλ_]/i.test(ch);
        }
        function is_id(ch) {
            return is_id_start(ch) || "?!-<>=0123456789".indexOf(ch) >= 0;
        }

        function read_next() {
            read_while(is_whitespace);
            if (input.eof()) return null;
            var ch = input.peek();
            if (is_digit(ch)) return read_number();
            if (is_id_start(ch)) return read_ident();

            if (is_op_char(ch)) return {
                type: "op",
                value: read_while(is_op_char)
            };
            input.croak("Can't handle character: " + ch);
        }
        function peek() {
            return current || (current = read_next());
        }
        function next() {
            var tok = current;
            current = null;
            var result = tok || read_next();
            console.log(result);
            return result;
        }
        function eof() {
            return peek() == null;
        }
    }
}
},{}]},{},[3])(3)
});
