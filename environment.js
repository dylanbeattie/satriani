module.exports = {
    Environment: Environment
}

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
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
         // case "binary":
         //     return apply_op(exp.operator,
         //         this.evaluate(exp.left),
         //         this.evaluate(exp.right));
         case "prog":
             var val = false;
             exp.prog.forEach(function (exp) {
                 val = evaluate(exp, env)
             });
             return val;
         case "output":
             var result = evaluate(exp.args, env);
             console.log(result);
             return;
     }
 }
//
// function apply_op(op, a, b) {
//     function num(x) {
//         if (typeof x != "number")
//             throw new Error("Expected number but got " + x);
//         return x;
//     }
//     function div(x) {
//         if (num(x) == 0)
//             throw new Error("Divide by zero");
//         return x;
//     }
//     switch (op) {
//         case "+": return num(a) + num(b);
//         case "-": return num(a) - num(b);
//         case "*": return num(a) * num(b);
//         case "/": return num(a) / div(b);
//         case "%": return num(a) % div(b);
//         case "&&": return a !== false && b;
//         case "||": return a !== false ? a : b;
//         case "<": return num(a) < num(b);
//         case ">": return num(a) > num(b);
//         case "<=": return num(a) <= num(b);
//         case ">=": return num(a) >= num(b);
//         case "==": return a === b;
//         case "!=": return a !== b;
//     }
//     throw new Error("Can't apply operator " + op);
// }
