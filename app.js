var koa = require('koa');
var logger = require('koa-logger');
var route = require('koa-route');
var parse = require('co-busboy');
var fs = require('fs');
var os = require('os');
var path = require('path');
var views = require('co-views');
var app = koa();
var execSync = require('child_process').execSync;

var render = views(path.join(__dirname, '/views'), { ext: 'ejs' });

app.use(logger());

app.use(route.get('/', function *(){
  this.body = yield render('home');
}));

app.use(route.post('/submit', function *(next) {
  // ignore non-POSTs
  if ('POST' != this.method) return yield next;

  // multipart upload
  var parts = parse(this);
  var part;

  var responses = [];

  while ((part = yield parts)) {
    var filename = Math.random().toString() + ".js";
    var filepath = path.join(os.tmpdir(), filename);
    var buf = part.read();
    fs.writeFileSync(filepath, buf);
    var stdout = execSync('$SAFE_HOME/bin/safe analyze ' + filepath);
    responses.push({
        name: filename,
        js: buf.toString(),
        out: stdout.toString()
    })
  }

  this.body = yield render('responses', { responses: responses });
}));

app.listen(3000);

