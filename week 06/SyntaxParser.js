import { scan } from "./Lexparse.js";
let syntax = {
  Program: [["StatementList", "EOF"]],
  StatementList: [["Statement"], ["StatementList", "Statement"]],
  Statement: [
    ["ExpressionStatement"],
    ["IfStatement"],
    ["VariableDeclaration"],
    ["FunctionDeclaration"],
  ],
  IfStatement: [["if", "(", "Expression", ")", "Statement"]],
  VariableDeclaration: [
    ["var", "Identifer", ";"],
    ["let", "Identifer", ";"],
    ["const", "Identifer", ";"],
  ],
  FunctionDeclaration: [
    ["function", "Identifer", "(", ")", "{", "StatementList", "}"],
  ],
  ExpressionStatement: [["Expression", ";"]],
  // ExpressionStatement: [["Expression"]],
  Expression: [["AdditiveExpression"]],
  AdditiveExpression: [
    ["MultiplicativeExpression"],
    ["AdditiveExpression", "+", "MultiplicativeExpression"],
    ["AdditiveExpression", "-", "MultiplicativeExpression"],
  ],
  MultiplicativeExpression: [
    ["PrimaryExpression"],
    ["MultiplicativeExpression", "*", "PrimaryExpression"],
    ["MultiplicativeExpression", "/", "PrimaryExpression"],
  ],
  PrimaryExpression: [["(", "Expression", ")"], ["Literal"], ["Identifier"]],
  Literal: [
    ["NumberLiteral"],
    ["StringLiteral"],
    ["BooleanLiteral"],
    ["NullLiteral"],
    ["RegularExpressionLiteral"],
    ["ObjectLiteral"],
    ["ArrayLiteral"],
  ],
};
let hash = {};

function closure(state) {
  hash[JSON.stringify(state)] = state;
  let queue = [];
  for (const symbol in state) {
    if (symbol.match(/^\$/)) {
      continue;
    }
    queue.push(symbol);
  }
  while (queue.length) {
    let symbol = queue.shift();
    // console.log(symbol);
    if (syntax[symbol]) {
      for (const rule of syntax[symbol]) {
        if (!state[rule[0]]) {
          queue.push(rule[0]);
        }
        let current = state;
        for (const part of rule) {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
        current.$reduceType = symbol;
        current.$reduceLength = rule.length;
      }
    }
  }
  //   console.log(state);
  //   console.log(hash);
  for (let symbol in state) {
    if (symbol.match(/^\$/)) {
      continue;
    }
    if (hash[JSON.stringify(state[symbol])]) {
      state[symbol] = hash[JSON.stringify(state[symbol])];
    } else {
      closure(state[symbol]);
    }
  }
}

const end = {
  $isEnd: true,
};

let start = { Program: end };
closure(start);
console.log(start);

function parser(source) {
  let stack = [start];
  let symbolStack = [];
  function reduce() {
    let state = stack[stack.length - 1];
    if (state.$reduceType) {
      let children = [];
      for (let i = 0; i < state.$reduceLength; i++) {
        stack.pop();
        children.push(symbolStack.pop());
      }
      return {
        type: state.$reduceType,
        children: children.reverse(),
      };
    }
  }
  function shift(symbol) {
    let state = stack[stack.length - 1];
    if (symbol.type in state) {
      stack.push(state[symbol.type]);
      symbolStack.push(symbol);
    } else {
      shift(reduce());
      shift(symbol);
    }
    //   console.log(symbol);
  }
  for (const symbol /*终结符 */ of scan(source)) {
    console.log("symbol", symbol);
    shift(symbol);
  }
  //   console.log(reduce());
  return reduce();
}

let evaluator = {
  Program(node) {
    return evaluate(node.children[0]);
  },
  StatementList(node) {
    if (node.children.length === 1) {
      return evaluate(node.children[0]);
    } else {
      evaluate(node.children[0]);
      return evaluate(node.children[1]);
    }
  },
  Statement(node) {
    return evaluate(node.children[0]);
  },
  VariableDeclaration(node) {
    console.log("declara variable", node.children[1].name);
  },
  ExpressionStatement(node) {
    return evaluate(node.children[0]);
  },
  Expression(node) {
    return evaluate(node.children[0]);
  },
  AdditiveExpression(node) {
    if (node.children.length === 1) {
      return evaluate(node.children[0]);
    } else {
      // todo
    }
  },
  MultiplicativeExpression(node) {
    if (node.children.length === 1) {
      return evaluate(node.children[0]);
    } else {
      // todo
    }
  },
  PrimaryExpression(node) {
    if (node.children.length === 1) {
      return evaluate(node.children[0]);
    } else {
      // todo
    }
  },
  Literal(node) {
    return evaluate(node.children[0]);
  },
  NumberLiteral(node) {
    let str = node.value;
    let l = str.length;
    let value = 0;
    let n = 10;
    if (str.match(/^0b/)) {
      n = 2;
      l -= 2;
    } else if (str.match(/^0o/)) {
      n = 8;
      l -= 2;
    } else if (str.match(/^0x/)) {
      n = 16;
      l -= 2;
    }
    while (l) {
      let c = str.charCodeAt(str.length - l);
      if (c > "a".charCodeAt(0)) {
        c = c - "a".charCodeAt(0)+10;
      } else if (c > "A".charCodeAt(0)) {
        c = c - "A".charCodeAt(0)+10;
      } else if (c >= "0".charCodeAt(0)) {
        c = c - "0".charCodeAt(0);
      }
      value = value * n + c;
      l--;
    }
    return Number(node.value);
  },
  StringLiteral(node){
    console.log('StringLiteral:',node);
    let result = [];
    for (let i = 1; i < node.value.length-1; i++){
      if(node.value[i]==='\\'){
        i++;
        let c = node.value[i];
        const map = {
          '\'':'\'',
          '\"':'\"',
          '\\':'\\',
          '0':String.fromCharCode(0x000),
          'b':String.fromCharCode(0x008),
          't':String.fromCharCode(0x009),
          'n':String.fromCharCode(0x00A),
          'v':String.fromCharCode(0x00B),
          'f':String.fromCharCode(0x00C),
          'r':String.fromCharCode(0x00D)
        };
        if(c in map){
          result.push(map[c])
        }else {
          result.push(c)
        }
      }else {
        result.push(node.value[i])
      }
    }
    console.log('StringLiteral:result:',result);
    return result.join('')
  }
};

function evaluate(node) {
  if (evaluator[node.type]) {
    return evaluator[node.type](node);
  }
}
window.js = {
  evaluate:evaluate,
  parser:parser
};


