class Request {
  constructor(options) {
    this.method = options.method || 'GET';
    this.host = options.host;
    this.port = options.port || 80;
    this.path = options.path || '/';
    this.headers = options.headers;
    this.body = options.body;
    if (!this.headers['Content-Type']) {
      this.headers['Content-Type'] = 'application/x-www-form-urlencode';
    }
    if (this.headers['Content-Type'] === 'application/json') {
      this.bodyText = JSON.stringify(this.body);
    } else if (
      this.headers['Content-Type'] === 'application/x-www-form-urlencode'
    ) {
      this.bodyText = Object.keys(this.body)
        .map((key) => `${key}=${encodeURIComponent(this.body[key])}`)
        .join('&');
    }
    this.headers['Content-Length'] = this.bodyText.length;
  }
  getRequestText() {
    const line = `${this.method} ${this.path} HTTP/1.1`;
    const headers = Object.keys(this.headers)
      .map((key) => `${key}:${this.headers[key]}`)
      .join('\r\n');
    const bodyText = this.bodyText;
    return line + '\r\n' + headers + '\r\n\r\n' + bodyText;
  }
  send() {
    return new Promise((resolve, reject) => {
      const parser = new ResponseParset();
      const requestText = this.getRequestText();

      resolve('');
    });
  }
}
class ResponseParset {
  constructor() {}
  receive(string) {
    for (let i = 0; i < string.length; i++) {
      this.receiveChat(string.charAt(i));
    }
  }
  receiveChat(char) {}
}
void (async function () {
  let request = new Request({
    method: 'POST',
    host: '127.0.0.1',
    port: 80,
    path: '/',
    headers: {
      ['X-Foo2']: 'customed',
    },
    body: {
      name: 'winter',
    },
  });
  try {
    const response = await request.send();
    console.log(response);
  } catch (error) {
    console.log(error);
  }
})();
