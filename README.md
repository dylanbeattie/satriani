# Satriani

Satriani is a JavaScript interpreter for the Rockstar programming language.

Satriani has been created to act as a reference implementation for managing changes to the Rockstar language specification.

## How it works

Satriani uses `pegjs`, a parser generator for JavaScript.

The language grammar is defined in `rockstar.peg`.

We use the `pegjs` command line to generate `rockstar.js`, which is the parser itself:

```
$ pegjs rockstar.peg
```
`rockstar.js` exports a function `parse(input, options)`, where `input` 
is a string containing the source code of your Rockstar program and `options` is the 
optional [pegjs parser options](https://pegjs.org/documentation#using-the-parser).

`parse` will return an **abstract syntax tree** (AST) containing your program. The 
AST is a JSON object representing your program as a tree of operations.

## Acknowledgements

HUGE thanks to Wolfgang Faust for https://github.com/wolfgang42/rockstar-js - I've been using his grammar
as a reference throughout and have reused bits of it directly, and it's been invaluable.

Mihai Bazon's fantastic series of articles on building recursive descent compilers in JavaScript has also been
realy useful: http://lisperator.net/pltut/








