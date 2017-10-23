'use strict';
const Koa = require('koa');
const path = require('path');
const cors = require('kcors');
const Pug = require('koa-pug');
const views = require('koa-views');
const serve = require('koa-static');
const koaBody = require('koa-body');
const logger = require('koa-logger');
const router = require('koa-router')();
const app = new Koa();

app
  // Enable ALL CORS Requests
  .use(cors({
    origin: '*',
    maxAge: 24 * 60 * 60,
    methods: [ 'GET', 'PUT', 'DELETE', 'POST', 'PATCH', 'OPTIONS' ],
    allowedHeaders: [ 'Content-Type', 'Yellgar-Token', 'Yellgar-User-Id' ]
  }))
  .use(logger())
  .use(koaBody())
  .use(views(__dirname, { extension: 'pug' }))
  .use(serve(path.join(__dirname, 'public')))
  .use(router.routes())
  .use(router.allowedMethods({ throw: true }))
  .use(async (ctx, next) => {
    ctx.request.setTimeout(10000);
    await next;
  });

const pug = new Pug({
  viewPath: './views',
  debug: process.env.NODE_ENV === 'development'
});
pug.use(app);

const crawler = require('./crawler.js');
crawler(router);

app.on('error', (err, ctx) => {
  try {
    const statusCode = ctx.status || 500;
    if (statusCode === 500) {
      console.error(err.stack || err);
    }
    ctx.response.status = statusCode;

    // 預設不輸出異常詳情
    let error = {};
    ctx.response.body = {
      extra: error,
      status: ctx.response.status,
      level: 'error',
      message: 'unexpected error'
    };
  } catch (error) {
    console.error('Error handle fail :', error);
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.info('===========================================');
  console.info(`===== Server is running at port: ${PORT} =====`);
  console.info('===========================================');

  // 註冊全域未捕獲異常的處理器
  process.on('uncaughtException', (err) => {
    console.error('Caught exception: ', err.stack);
  });
  process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise ', p, ' reason: ', reason.stack);
  });
});