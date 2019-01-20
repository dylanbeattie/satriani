module.exports = {
    Environment: Environment
}

function Environment(parent) {
    this.vars = Object.create(parent ? parent.vars : null);
    this.parent = parent;
    this.output = (parent && parent.output ? parent.output : console.log);

}

Environment.prototype = {
    extend: function () { return new Environment(this) },
    find_scope: function (name) {
        let scope = this;
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name)) return scope;
            scope = scope.parent;
        }
    },

    lookup: function (name) {
        if (name in this.vars)
            return this.vars[name];
        throw new Error("Undefined variable " + name);
    },

    assign: function (name, value) {
        // THIS is where we control whether assignment inside a function call
        // can overwrite variables declared in a parent frame.
        let scope = this.find_scope(name);
        return (scope || this).vars[name] = value;
    },

    def: function (name, value) {
        return this.vars[name] = value;
    },

    run: function(program) {
        return evaluate(program, this);
    },
    pronoun_alias: null,
    pronoun_value: null,
}

 function evaluate(tree, env) {
     let pairs = Object.entries(tree);
     for (let i = 0; i < pairs.length; i++) {
         let token = pairs[i];
         let type = token[0];
         let expr = token[1];
         switch (type) {
             case "sequence":
                 let result = false;
                 for(let i = 0; i < expr.length; i++) {
                     if (result = evaluate(expr[i], env)) return(result);
                 }
                 return null;
             case "number":
             case "string":
             case "constant":
                 return (expr);
             case "output":
                 env.output(evaluate(expr, env));
                 return null;
             case "binary":
                 return binary(expr, env);
             case "lookup":
                 if (expr.variable.pronoun) return (env.pronoun_value);
                 env.pronoun_alias = expr.variable;
                 return env.pronoun_value = env.lookup(expr.variable);
             case "assign":
                 let alias = "";
                 let value = evaluate(expr.expression, env);
                 if (expr.variable.pronoun) {
                     alias = env.pronoun_alias;
                 } else {
                     alias = expr.variable;
                     env.pronoun_alias = alias;
                     env.pronoun_value = value;
                 }
                 env.assign(alias, value);
                 return;
             case "pronoun":
                 return env.pronoun_value;
             case "blank":
                 return;
             case "increment":
                 let old_increment_value = env.lookup(expr.variable);
                 switch(typeof(old_increment_value)) {
                     case "boolean":
                         if (expr.multiple % 2 != 0) env.assign(expr.variable, !old_increment_value);
                         return;
                     default:
                         env.assign(expr.variable, (old_increment_value + expr.multiple));
                         return;
                 }
                 return;
             case "decrement":
                 let old_decrement_value = env.lookup(expr.variable);
                 switch(typeof(old_decrement_value)) {
                     case "boolean":
                         if (expr.multiple % 2 != 0) env.assign(expr.variable, !old_decrement_value);
                         return;
                     default:
                         env.assign(expr.variable, (old_decrement_value - expr.multiple));
                         return;
                 }
                 return;
             case "conditional":
                 if(evaluate(expr.condition, env)) {
                     return evaluate(expr.consequent, env)
                 } else if (expr.alternate) {
                     return evaluate(expr.alternate, env);
                 }
                 return;
             case "while_loop":
                 while(evaluate(expr.condition, env)) {
                     evaluate(expr.consequent, env);
                 }
                 return;
             case "until_loop":
                 while(! evaluate(expr.condition, env)) {
                     evaluate(expr.consequent, env);
                 }
                 return;
             case "comparison":
                 let lhs = evaluate(expr.lhs, env);
                 let rhs = evaluate(expr.rhs, env);
                 switch(expr.comparator) {
                     case "eq": return (lhs == rhs);
                     case "lt": return (lhs < rhs);
                     case "le": return (lhs <= rhs);
                     case "ge": return (lhs >= rhs);
                     case "gt": return(lhs > rhs);
                 }
             case "and":
                 return (evaluate(expr.lhs, env) && evaluate(expr.rhs, env));
             case "or":
                 return (evaluate(expr.lhs, env) || evaluate(expr.rhs, env));
             case "not":
                 return(! evaluate(expr.expression, env));
             case "function":
                 var lambda = make_lambda(expr, env);
                 env.assign(expr.name, lambda);
                 return;
             case "call":
                 let func = env.lookup(expr.name);
                 return func.apply(null, expr.args.map(arg => evaluate(arg, env)));
             case "return":
                 return evaluate(expr.expression, env);
             default:
                 throw new Error("Sorry - I don't know how to evaluate this: " + JSON.stringify(tree))

         }
     }
 }

 function make_lambda(expr, env) {
    function lambda() {
        let names = expr.args;
        if (names.length != arguments.length) throw('Wrong number of arguments supplied to function ' + expr.name + ' (' + expr.args + ')');
        let scope = env.extend();
        for(let i = 0; i < names.length; ++i) scope.def(names[i], arguments[i])
        return evaluate(expr.body, scope);
    }
    return lambda;
 }

 function binary(b, env) {
    let l = evaluate(b.left, env);
    let r  = evaluate(b.right, env);
    switch(b.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '/': return l / r;
        case '*': return l * r;
        // case "-": return num(a) - num(b);
        // case "*": return num(a) * num(b);
        // case "/": return num(a) / div(b);
        // case "%": return num(a) % div(b);
        // case "&&": return a !== false && b;
        // case "||": return a !== false ? a : b;
        // case "<": return num(a) < num(b);
        // case ">": return num(a) > num(b);
        // case "<=": return num(a) <= num(b);
        // case ">=": return num(a) >= num(b);
        // case "==": return a === b;
        // case "!=": return a !== b;
        //
    }
 }
// function ope() {
//     Object.entries(pair).forEach(token => {
//         var type = token[0];
//         var expr = token[1];
//         console.log('Type ' + type + ', expr' + JSON.stringify(expr));
//          console.log(JSON.stringify(token));
//          switch(type) {
//              case "program":
//
//                  console.log(token[1]);
//                  let status = false;
//                  token[1].forEach(function (p2) {
//                      status = evaluate(Object.entries(p2), env)
//                  });
//                  return status;
//              case "number":
//              case "string":
//                  return token[1];
//              case "output":
//                  let result = evaluate(token[1], env);
//                  env.output(result);
//                  return;
//          }
//     });
// }
//
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
