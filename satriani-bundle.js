(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Satriani = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = {
    Environment: Environment
}

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
    this.output = console.log;
}

Environment.prototype = {
    extend: function () {
        return new Environment(this);
    },
    lookup: function (name) {
        var scope = this;
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name))
                return scope;
            scope = scope.parent;
        }
    },
    get: function (name) {
        if (name in this.vars)
            return this.vars[name];
        throw new Error("Undefined variable " + name);
    },
    set: function (name, value) {
        var scope = this.lookup(name);
        // let's not allow defining globals from a nested environment
        if (!scope && this.parent)
            throw new Error("Undefined variable " + name);
        return (scope || this).vars[name] = value;
    },
    def: function (name, value) {
        return this.vars[name] = value;
    },

    run: function(ast) {
       return(evaluate(ast,this));
    }
}

 function evaluate(exp, env) {
     switch (exp.type) {
         case "num":
         case "str":
         case "bool":
             return exp.value;
         case "binary":
             return apply_op(exp.operator,
                 evaluate(exp.left, env),
                 evaluate(exp.right, env));
         case "prog":
             var val = false;
             exp.prog.forEach(function (exp) {
                 val = evaluate(exp, env)
             });
             return val;
         case "output":
             var result = evaluate(exp.args, env);
             env.output(result);
             return;
     }
 }

function apply_op(op, a, b) {
    function num(x) {
        if (typeof x != "number")
            throw new Error("Expected number but got " + x);
        return x;
    }
    function div(x) {
        if (num(x) == 0)
            throw new Error("Divide by zero");
        return x;
    }
    switch (op) {
        case "+": return num(a) + num(b);
        case "-": return num(a) - num(b);
        case "*": return num(a) * num(b);
        case "/": return num(a) / div(b);
        case "%": return num(a) % div(b);
        case "&&": return a !== false && b;
        case "||": return a !== false ? a : b;
        case "<": return num(a) < num(b);
        case ">": return num(a) > num(b);
        case "<=": return num(a) <= num(b);
        case ">=": return num(a) >= num(b);
        case "==": return a === b;
        case "!=": return a !== b;
    }
    throw new Error("Can't apply operator " + op);
}

},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
module.exports = {
    FALSE: { type: "bool", value: false },
    parse: function (input) {
        var PRECEDENCE = {
            "=": 1,
            "||": 2,
            "&&": 3,
            "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
            "+": 10, "-": 10,
            "*": 20, "/": 20, "%": 20,
        };
        return parse_toplevel();

        function peek_is_punctuation(ch) {
            var tok = input.peek();
            return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
        }
        function peek_is_keyword(kw) {
            var tok = input.peek();
            return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
        }
        function peek_is_operator(op) {
            var tok = input.peek();
            return tok && tok.type == "op" && (!op || tok.value == op) && tok;
        }
        function skip_punc(ch) {
            if (peek_is_punctuation(ch)) input.next();
            else input.croak("Expecting punctuation: \"" + ch + "\"");
        }
        function skip_kw(kw) {
            if (peek_is_keyword(kw)) input.next();
            else input.croak("Expecting keyword: \"" + kw + "\"");
        }
        function skip_op(op) {
            if (peek_is_operator(op)) input.next();
            else input.croak("Expecting operator: \"" + op + "\"");
        }
        function unexpected() {
            input.croak("Unexpected token: " + JSON.stringify(input.peek()));
        }
        function maybe_binary(left, my_prec) {
            var tok = peek_is_operator();
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
                if (peek_is_punctuation(stop)) break;
                if (first) first = false; else skip_punc(separator);
                if (peek_is_punctuation(stop)) break;
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
        function parse_say() {
            skip_kw("say");
            var args = parse_expression();
            return {
                type: "output",
                args: args
            }
        }

        function parse_if() {
            skip_kw("if");
            var cond = parse_expression();
            if (!peek_is_punctuation("{")) skip_kw("then");
            var then = parse_expression();
            var ret = {
                type: "if",
                cond: cond,
                then: then,
            };
            if (peek_is_keyword("else")) {
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
            return peek_is_punctuation("(") ? parse_call(expr) : expr;
        }
        function parse_atom() {
            return maybe_call(function () {
                if (peek_is_keyword("say")) return parse_say();
                if (peek_is_punctuation("(")) {
                    input.next();
                    var exp = parse_expression();
                    skip_punc(")");
                    return exp;
                }
                if (peek_is_punctuation("{")) return parse_prog();
                if (peek_is_keyword("if")) return parse_if();
                if (peek_is_keyword("true") || peek_is_keyword("false")) return parse_bool();
                if (peek_is_keyword("lambda") || peek_is_keyword("λ")) {
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
                // if (!input.eof()) skip_punc(";");
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


},{}],4:[function(require,module,exports){
var parser = require('./parser.js');
var streamer = require('./inputstream.js');
var tokenizer = require('./tokenizer.js');
var environment = require('./environment.js');

module.exports = {
    interpret: function (program) {
        var stream = streamer.InputStream(program);
        var tokens = tokenizer.Tokenize(stream);
        var ast = parser.parse(tokens);
        var g = new environment.Environment();
        var result = "";
        g.output = (...args) => result += args + "\n";
        g.run(ast);
        return result;
    }
};

},{"./environment.js":1,"./inputstream.js":2,"./parser.js":3,"./tokenizer.js":5}],5:[function(require,module,exports){
module.exports = {
    Tokenize: function (input) {
        var current = null;
        var keywords = ['say', 'is'];
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
            while (!input.eof() && predicate(input.peek())) str += input.next();
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

        function is_quote(ch) {
            return('"' == ch);
        }

        function is_not_quote(ch) {
            return(!is_quote(ch));
        }

        function read_string() {
            input.next();
            var s = read_while(is_not_quote);
            input.next();
            return {
                type: "str",
                value: s
            }
        }

        function read_next() {
            read_while(is_whitespace);
            if (input.eof()) return null;
            var ch = input.peek();
            if (is_digit(ch)) return read_number();
            if (is_id_start(ch)) return read_ident();
            if (is_quote(ch)) return read_string();
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
            return result;
        }
        function eof() {
            return peek() == null;
        }
    }
}
},{}]},{},[4])(4)
});
