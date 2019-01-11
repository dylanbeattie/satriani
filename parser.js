OPERATORS = [ '+', '-', '*', '/', '*', '%', '='];

module.exports = {
    FALSE: { type: "bool", value: false },
    parse: function (input) {

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

