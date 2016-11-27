'use strict';
const TextDecorator = require('./TextDecorator');

class MarkdownTextDecorator extends TextDecorator {
  constructor() {
    super();

    this.styles = {
      "bold": "**",
      "italic": "*",
      "underline": "__",  //Not technically Markdown, but we'll use it. Some platforms may show this as italic.
      "strike": "~~", // Also not technically Markdown. Probably won't display right on most platforms.
      "code": "`"
    };
  }

  applyStyle(str, ...styles) {
    for (var i = 0; i < styles.length; i++) {
      let stylesString = styles[i];
      let s = stylesString.split(' ');
      for (var j = 0; j < s.length; j++) {
        if(this.styles[s[j]]) {
          //this simply wraps the string in the style indicated.
          str = `${this.styles[s[j]]}${str}${this.styles[s[j]]}`;
        }
      }
    }

    return str;
  }

  removeAllStyles(str) {
    for (var st in this.styles) {
      if (this.styles.hasOwnProperty(st)) {
        let oldStr = str;
        let s = this.styles[st].replace(/\*/g, '\\\*');
        let r = new RegExp(`${s}(.*)${s}`, 'g');
        str = str.replace(r, '$1');
      }
    }
    return str;
  }
}

module.exports = MarkdownTextDecorator;
