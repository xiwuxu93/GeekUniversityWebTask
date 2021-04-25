const css = require('css');
const EOF = Symbol('EOF');
let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;
const stack = [{ type: 'document', children: [] }];
const rules = [];
function addCSSRules(s) {
  const ast = css.parse(s);
  rules.push(...ast.stylesheet.rules);
}
function match(element, selector) {
  if (!selector || !element.attributes) {
    return false;
  }
  if (selector.charAt(0) === '#') {
    const attr = element.attributes.find((item) => item.name === 'id');
    if (attr && attr.value === selector.replace('#', '')) {
      return true;
    }
  } else if (selector.charAt(0) === '.') {
    const attr = element.attributes.find((item) => item.name === 'class');
    if (attr && attr.value === selector.replace('.', '')) {
      return true;
    }
  } else {
    if (element.tagName === selector) {
      return true;
    }
  }
}
function specificity(selector) {
  const p = [0, 0, 0, 0];
  const selectorParts = selector.split(' ');
  for (const part of selectorParts) {
    if (part.charAt(0) === '#') {
      p[1] += 1;
    } else if (part.charAt(0) === '.') {
      p[2] += 1;
    } else {
      p[3] += 1;
    }
  }
  return p;
}
function compare(sp1, sp2) {
  for (let i = 0; i < sp1.length; i++) {
    if (sp1[i] - sp2[i]) {
      return sp1[i] - sp2[i];
    }
  }
  return 0;
}
function computeCSS(element) {
  const elements = stack.slice().reverse();
  rules.forEach((rule) => {
    rule.selectors.forEach((selector) => {
      const selectorParts = selector.split(' ');
      if (!match(element, selectorParts[selectorParts.length - 1])) {
        return false;
      }
      selectorParts.pop();
      elements.forEach((element) => {
        if (
          selectorParts.length > 0 &&
          match(element, selectorParts[selectorParts.length - 1])
        ) {
          selectorParts.pop();
        }
      });
      //selectorParts 为空表示css规则匹配成功
      if (selectorParts.length === 0) {
        const sp = specificity(selector);
        const computedStyle = element.computedStyle;
        for (const declaration of rule.declarations) {
          if (!computedStyle[declaration.property]) {
            computedStyle[declaration.property] = {};
          }
          if (!computedStyle[declaration.property].specificity) {
            computedStyle[declaration.property].value = declaration.value;
            computedStyle[declaration.property].specificity = sp;
          } else if (
            compare(sp, computedStyle[declaration.property].specificity) >= 0
          ) {
            computedStyle[declaration.property].specificity = sp;
            computedStyle[declaration.property].value = declaration.value;
          }
        }
      }
    });
  });
}
function emit(token) {
  const top = stack[stack.length - 1];
  if (token.type === 'startTag') {
    const element = {
      type: 'element',
      computedStyle: {},
      children: [],
      attributes: [],
    };
    element.tagName = token.tagName;
    Object.keys(token).forEach((key) => {
      if (!['type', 'tagName', 'isSelfClosing'].includes(key)) {
        element.attributes.push({ name: key, value: token[key] });
      }
    });
    computeCSS(element);
    top.children.push(element);
    element.parent = top;
    if (!token.isSelfClosing) {
      stack.push(element);
    }
    currentTextNode = null;
  } else if (token.type === 'endTag') {
    if (token.tagName === top.tagName) {
      //关闭标签为style时，执行添加CSS规则的操作
      if (token.tagName === 'style') {
        addCSSRules(top.children[0].content);
      }
      stack.pop();
    } else {
      console.log('top:', top);
      console.log('token:', token);
      throw new Error('startTag.tagName !== endTag.tagName');
    }
    currentTextNode = null;
  } else if (token.type === 'text') {
    if (currentTextNode === null) {
      currentTextNode = {
        type: 'text',
        content: '',
      };
      top.children.push(currentTextNode);
    }
    currentTextNode.content += token.content;
  }
}
function data(c) {
  if (c === '<') {
    return tagOpen;
  } else if (c === EOF) {
    emit({
      type: 'EOF',
    });
    return;
  } else {
    emit({
      type: 'text',
      content: c,
    });
    //文本节点
    return data;
  }
}
function tagOpen(c) {
  if (c === '/') {
    return endTagOpen;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'startTag',
      tagName: '',
    };
    return tagName(c);
  } else {
    return;
  }
}
function endTagOpen(c) {
  if (c === '>') {
    // return data;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: 'endTag',
      tagName: '',
    };
    return tagName(c);
  } else if (c === EOF) {
    emit({
      type: 'EOF',
    });
  } else {
    return;
  }
}
function tagName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforAttributeName;
  } else if (c === '/') {
    return selfClosingStartTag;
  } else if (c.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += c;
    return tagName;
  } else if (c === '>') {
    emit(currentToken);
    return data;
  } else {
    return tagName;
  }
}
function beforAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforAttributeName;
  } else if (c === '>' || c === '/' || c === EOF) {
    return afterAttributeName(c);
  } else if (c === '=') {
  } else {
    currentAttribute = {
      name: '',
      value: '',
    };
    return attributeName(c);
  }
}

function attributeName(c) {
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
    return afterAttributeName(c);
  } else if (c === '=') {
    return beforAttributeValue;
  } else {
    currentAttribute.name += c;
    return attributeName;
  }
}
//<div a b >
function afterAttributeName(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return afterAttributeName;
  } else if (c === '/') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (c === '=') {
    return beforAttributeValue;
  } else if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else {
    currentToken[currentAttribute.name] = currentAttribute.value;
    currentAttribute = {
      name: '',
      value: '',
    };
    return attributeName(c);
  }
}
function beforAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/) || c === '/' || c === '>' || c === EOF) {
    return beforAttributeValue;
  } else if (c === '"') {
    return dubleQutoedAttributeValue;
  } else if (c === "'") {
    return singleQutoedAttributeValue;
  } else {
    return UnQutoedAttributeValue;
  }
}
function dubleQutoedAttributeValue(c) {
  if (c === '"') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQutoedAttributeValue;
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c;
    return dubleQutoedAttributeValue;
  }
}
function singleQutoedAttributeValue(c) {
  if (c === "'") {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return afterQutoedAttributeValue;
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c;
    return singleQutoedAttributeValue;
  }
}
function UnQutoedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return beforAttributeName;
  } else if (c === '/') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    return selfClosingStartTag;
  } else if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  } else if (c === EOF) {
  } else {
    currentAttribute.value += c;
    return UnQutoedAttributeValue;
  }
}
function afterQutoedAttributeValue(c) {
  if (c.match(/^[\t\n\f ]$/)) {
    return beforAttributeName;
  } else if (c === '/') {
    return selfClosingStartTag;
  } else if (c === '>') {
    currentToken[currentAttribute.name] = currentAttribute.value;
    emit(currentToken);
    return data;
  }
}

function selfClosingStartTag(c) {
  if (c === '>') {
    currentToken.isSelfClosing = true;
    emit(currentToken);
    return data;
  } else if (c === EOF) {
    emit({
      type: 'EOF',
    });
    return;
  } else {
    return;
  }
}

module.exports.parseHTML = function parseHTML(html) {
  let state = data;
  for (const c of html) {
    state = state(c);
  }
  state = state(EOF);
  return stack[0];
};
