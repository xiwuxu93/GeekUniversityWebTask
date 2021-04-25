const http = require('http');
http
  .createServer((request, response) => {
    let body = [];
    request
      .on('error', (err) => {
        console.log(err);
      })
      .on('data', (chunk) => {
        console.log('chunk', chunk);
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();
        console.log('body:', body);
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(`
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
        div #myid {
            width: 300px;
            height: 200px;
            background-color: yellow;
            
        }

        body #myid span,
        .myp {
            color: black;
            font-size: 20px;
        }
        #myid{
          font-size: 30px;
          height: 300px;
        }
        body #myid {
          width: 300px;
          height: 200px;
          background-color: red;
          
      }
    </style>
    <title>Document</title>
  </head>
  <body>
  <div>
  <div id='myid'>
      <span>span</span>
    </div>
  </div>
    
    <p class="myp"></p>
  </body>
</html>
`);
      });
  })
  .listen(8080);
console.log('server started');
