class XRegExp {
  constructor(source, flag, root = "root") {
    this.table = new Map();
    this.regexp = new RegExp(this.compileRegExp(source, root, 0).source, flag);
    console.log(this.regexp);
    console.log(this.table);
  }
  compileRegExp(source, name, start) {
    if (source[name] instanceof RegExp) {
      return {
        source: source[name].source,
        length: 0,
      };
    }
    let length = 0;
    let regexp = source[name].replace(/\<([^>]+)\>/g, (str, $1) => {
      this.table.set(start + length, $1);
      ++length;
      let r = this.compileRegExp(source, $1, start + length);
      length += r.length;
      return `(${r.source})`;
    });
    return {
      source: regexp,
      length,
    };
  }
  exec(string) {
    let r = this.regexp.exec(string);
    console.log(r.length);
    for (let i = 0; i < r.length; i++) {
      const element = r[i];
      if (element !== void 0) {
        // console.log(this.table.get(i - 1));
        r[this.table.get(i - 1)] = element;
      }
    }
    return r;
  }
  get lastIndex() {
    return this.regexp.lastIndex;
  }
  set lastIndex(value) {
    return (this.regexp.lastIndex = value);
  }
}
function compileRegExp(xregexp, name) {
  if (xregexp[name] instanceof RegExp) {
    return xregexp[name].source;
  }
  let regexp = xregexp[name].replace(/\<([^>]+)\>/g, (str, $1) => {
    return compileRegExp(xregexp, $1);
  });
  return regexp;
}

export function* scan(str) {
  let regxp = new XRegExp(
    {
      InputElement: "<WhiteSpace>|<LineTerminator>|<Comments>|<Token>",
      WhiteSpace: / /,
      LineTerminator: /\n/,
      Comments: /\/*(?:[^*]|\*[^\/])*\*\/|\/\/[^\n]*/,
      Token: "<Literal>|<Keywords>|<Identifer>|<Punctuator>",
      Literal: "<NumberLiteral>|<BooleanLiteral>|<StringLiteral>|<NullLiteral>",
      NumberLiteral: /0x[0-9a-zA-Z]+|0o[0-7]+|0b[01]+|(?:[1-9][0-9]*|0)(?:\.[0-9]*)?|\.[0-9]+/,
      BooleanLiteral: /true|false/,
      StringLiteral: /\"(?:[^"\n]|\\[\s\S])*\"|\'(?:[^'\n]|\\[\s\S])*\'/,
      NullLiteral: /null/,
      Keywords: /if|else|for|function|let|var/,
      Identifer: /[a-zA-Z_$][a-zA-Z0-9_$]*/,
      Punctuator: /\|\||\&\&|\+|\,|\?|\:|\{|\}|\.|\(|\=|\<|\+\+|\=\=|\=\>|\*|\)|\[|\]|;/,
    },
    "g",
    "InputElement"
  ); 
  while (regxp.lastIndex < str.length) {
    let r = regxp.exec(str);
    if (r.WhiteSpace) {
    } else if (r.LineTerminator) {
    }else if (r.Comments) {
    } else if (r.NumberLiteral) {
      yield {
        type: "NumberLiteral",
        value: r[0],
      };
    } else if (r.BooleanLiteral) {
      yield {
        type: "BooleanLiteral",
        value: r[0],
      };
    } else if (r.StringLiteral) {
      yield {
        type: "StringLiteral",
        value: r[0],
      };
    } else if (r.NullLiteral) {
      yield {
        type: "NullLiteral",
        value: null,
      };
    } else if (r.Identifer) {
      yield {
        type: "Identifer",
        name: r[0],
      };
    } else if (r.Keywords) {
      yield {
        type: r[0],
      };
    } else if (r.Punctuator) {
      yield {
        type: r[0],
      };
    } else {
      throw new Error("unexpected token");
    }
    // console.log(r);
    if (!r[0].length) {
      break;
    }
  }
  yield {
    type: "EOF",
  };
}
// const source = `
//         for (let i = 0; i < 3; i++) {
//             for (let j = 0; j < 3; j++) {
//                 let cell = document.createElement('div');
//                 cell.classList.add('cell');
//                 cell.innerHTML = pattern[i * 3 + j] === 2 ? "X" : pattern[i * 3 + j] === 1 ? "O" : "";
//                 cell.addEventListener('click', () => useMove(j, i));
//                 bord.appendChild(cell);
//             }
//             bord.appendChild(document.createElement('br'))
//         }
//         `;

// for (const item of scan(source)) {
//   console.log(item);
// }
