module.exports = {
    Environment: Environment
}

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
    this.output = console.log;
}

Environment.prototype = {
    extend: function () { return new Environment(this) },
    lookup: function (name) {
        let scope = this;
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

    run: function(program) {
        return evaluate(program, this);
    }
}

 function evaluate(tree, env) {
     let pairs = Object.entries(tree);
     for(var i = 0; i < pairs.length; i++) {
         let token = pairs[i];
         let type = token[0];
         let expr = token[1];
         switch (type) {
             case "program":
                 let result = false;
                 expr.forEach(e => result = evaluate(e, env));
                 return result;
             case "number":
             case "string":
                 return expr;
             case "output":
                 console.log(evaluate(expr, env));
                 return null;
         }
     }
 }
function ope() {
    Object.entries(pair).forEach(token => {
        var type = token[0];
        var expr = token[1];
        console.log('Type ' + type + ', expr' + JSON.stringify(expr));
         console.log(JSON.stringify(token));
         switch(type) {
             case "program":

                 console.log(token[1]);
                 let status = false;
                 token[1].forEach(function (p2) {
                     status = evaluate(Object.entries(p2), env)
                 });
                 return status;
             case "number":
             case "string":
                 console.log('HOWDOWN!@');
                 return token[1];
             case "output":
                 console.log('OUTPUT - evaluating token[1] = ' + JSON.stringify(token[1]));
                 let result = evaluate(token[1], env);
                 env.output('LOG: ' + result);
                 return;
         }
    });
}

 //     switch (pair[0]) {
 //         // case "var":
 //         //     return env.get(exp.value);
 //         // case "assign":
 //         //     if (exp.left.type != "var")
 //         //         throw new Error("Cannot assign to " + JSON.stringify(exp.left));
 //         //     return env.set(exp.left.value, evaluate(exp.right, env));
 //         // case "binary":
 //         //     return apply_op(exp.operator,
 //         //         evaluate(exp.left, env),
 //         //         evaluate(exp.right, env));
 //
 //         default:
 //             throw('Cannot evaluate ' + JSON.stringify(key) + ' with value ' + JSON.stringify(value));;
 //     }
 // }
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
