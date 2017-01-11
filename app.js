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

// TODO: set timeout
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

app.use(route.get('/examples/:id', function *(id, next) {

  var responses = [];
  var strs = id.split(".");

  if (strs.length == 2 && strs[1] == "js") { // sanity check

    var filepath = __dirname + "/examples/" + id
    var buf = fs.readFileSync(filepath);
    var stdout = execSync('$SAFE_HOME/bin/safe analyze ' + filepath);
    responses.push({
        name: id,
        js: buf.toString(),
        out: stdout.toString()
    });

    this.body = yield render('responses', { responses: responses });
  } else {
    this.redirect("/");
  }
}));

app.listen(3000);

