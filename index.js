const Koa = require('koa'),
  app = new Koa(),
  path = require('path'),
  render = require('koa-ejs'),
  router = require('koa-router')(),
  views = require('koa-views');

app.on('error', function (err, ctx) {
  console.log(err);
});

router.use(views(__dirname + '/views'));

router.get('/', async (ctx, next) => {
  await ctx.render('index');
})

router.post('/upload', async () => {
  debugger
});

app.use(router.routes()).use(router.allowedMethods());
app.listen(5000);