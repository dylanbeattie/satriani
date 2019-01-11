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
            return keywords.indexOf(x.toLowerCase()) >= 0;
        }
        function is_digit(ch) {
            return /[0-9]/i.test(ch);
        }
        function is_op_char(ch) {
            return OPERATOR_ALIASES.hasOwnProperty(ch);
        }

        function dealias_operator(id) {
            for(let op in OPERATOR_ALIASES) {
                if (OPERATOR_ALIASES[op].indexOf(id.toLowerCase()) >= 0) return(op);
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
            return (COMMON_VARIABLE_PREFIXES.indexOf(id.toLowerCase()) >= 0);
        }

        function read_ident() {
            let id = read_while(is_id);
            if (is_common_variable_prefix(id)) {
                input.next();
                id += "_" + read_while(is_id);
                return {
                    type: "var",
                    value: id.toLowerCase()
                }
            }
            let op = dealias_operator(id);
            if (op) return {
                type: "op",
                value: op
            };
            return {
                type: is_keyword(id) ? "kw" : "var",
                value: id.toLowerCase()
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