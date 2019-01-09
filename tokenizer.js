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