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
         case "var":
             return env.get(exp.value);
         case "assign":
             if (exp.left.type != "var")
                 throw new Error("Cannot assign to " + JSON.stringify(exp.left));
             return env.set(exp.left.value, evaluate(exp.right, env));
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
OPERATORS = [ '+', '-', '*', '/', '*', '%', '='];

module.exports = {
    FALSE: { type: "bool", value: false },
    Parse: function (input) {

        return parse_toplevel();

        function read_operator_precedence(operator) {
            return(OPERATORS.indexOf(operator)+1);
        }

        function peek_is_keyword(kw) {
            const tok = input.peek();
            return tok && tok.type == "kw" && (!kw || tok.value == kw) && tok;
        }
        function peek_is_operator(op) {
            const tok = input.peek();
            return tok && tok.type == "op" && (!op || tok.value == op) && tok;
        }

        function skip_kw(kw) {
            if (peek_is_keyword(kw)) input.next();
            else input.croak("Expecting keyword: \"" + kw + "\"");
        }
        
        function unexpected() {
            input.croak("Unexpected token: " + JSON.stringify(input.peek()));
        }
        function maybe_binary(left, this_precedence) {
            let tok = peek_is_operator();
            if (tok) {
                const that_precedence = read_operator_precedence(tok.value);
                if (that_precedence > this_precedence) {
                    input.next();
                    return maybe_binary({
                        type: (tok.value == '=' ? 'assign': "binary"),
                        operator: tok.value,
                        left: left,
                        right: maybe_binary(parse_atom(), that_precedence)
                    }, this_precedence);
                }
            }
            return left;
        }

        function parse_say() {
            skip_kw("say");
            const args = parse_expression();
            return {
                type: "output",
                args: args
            }
        }

        function parse_atom() {
            if (peek_is_keyword("say")) return parse_say();
            const tok = input.next();
            if (tok.type == "var" || tok.type == "num" || tok.type == "str") return tok;
            unexpected();
        }

        function parse_toplevel() {
            let abstract_syntax_tree = [];
            while (!input.eof()) abstract_syntax_tree.push(parse_expression());
            return { type: "prog", prog: abstract_syntax_tree };
        }

        function parse_expression() {
            return maybe_binary(parse_atom(), 0);
        }
    }
}


},{}],3:[function(require,module,exports){
var parser = require('./parser.js');
var streamer = require('./streamer.js');
var tokenizer = require('./tokenizer.js');
var environment = require('./environment.js');

module.exports = {
    Interpreter : function(output) {
        this.output = output;
        this.interpret = function (program) {
            let stream = streamer.Stream(program);
            let tokens = tokenizer.Tokenize(stream);
            let ast = parser.Parse(tokens);
            let g = new environment.Environment();
            g.output = output;
            g.run(ast);
        }
    }
};

},{"./environment.js":1,"./parser.js":2,"./streamer.js":4,"./tokenizer.js":5}],4:[function(require,module,exports){
// streamer.js: input stream for Satriani Rockstar parser
// Based on code by Mihai Bazon / http://lisperator.net/pltut/

module.exports = {
    Stream: function (input) {
        let pos = 0, line = 1, col = 0;
        return {
            next: next,
            peek: peek,
            eof: eof,
            croak: croak,
        };
        function next() {
            let ch = input.charAt(pos++);
            if (ch == "\n") {
                line++;
                col = 0;
            } else {
                col++;
            }
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
},{}],5:[function(require,module,exports){
module.exports = {
    Tokenize: function (input) {
        let current = null;
        const OPERATOR_ALIASES = {
            '+' : ['with','plus'],
            '-' : ['minus', 'without'],
            '*' : ['times', 'of'],
            '/' : ['over'],
            '=' : ['is']
        }

        const COMMON_VARIABLE_PREFIXES = ['a', 'an', 'the', 'my', 'your'];

        const keywords = ['say'];
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
            return OPERATOR_ALIASES.hasOwnProperty(ch);
        }

        function dealias_operator(id) {
            for(var op in OPERATOR_ALIASES) {
                if (OPERATOR_ALIASES[op].indexOf(id) >= 0) return(op);
            }
            return(null);
        }

        function is_whitespace(ch) {
            return " \t\n".indexOf(ch) >= 0;
        }
        function read_while(predicate) {
            let str = "";
            while (!input.eof() && predicate(input.peek())) str += input.next();
            return str;
        }
        function read_number() {
            let has_dot = false;
            const number = read_while(function (ch) {
                if (ch == ".") {
                    if (has_dot) return false;
                    has_dot = true;
                    return true;
                }
                return is_digit(ch);
            });
            return { type: "num", value: parseFloat(number) };
        }


        function is_common_variable_prefix(id) {
            return (COMMON_VARIABLE_PREFIXES.indexOf(id) >= 0);
        }

        function read_ident() {
            let id = read_while(is_id);
            if (is_common_variable_prefix(id)) {
                input.next();
                id += "_" + read_while(is_id);
                return {
                    type: "var",
                    value: id
                }
            }
            let op = dealias_operator(id);
            if (op) return {
                type: "op",
                value: op
            };
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
            let s = read_while(is_not_quote);
            input.next();
            return {
                type: "str",
                value: s
            }
        }



        function is_comment(ch) {
            return('(' == ch);
        }

        function skip_comment() {
            read_while(c => (c != ')'));
            input.next();
        }


        function read_next() {
            read_while(is_whitespace);
            if (input.eof()) return null;
            const ch = input.peek();
            if (is_comment(ch)) {
                skip_comment();
                return read_next();
            }
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
            let token = current;
            current = null;
            return token || read_next();
        }
        function eof() {
            return peek() == null;
        }
    }
}
},{}]},{},[3])(3)
});
