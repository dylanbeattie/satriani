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

