const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
// const logger = require('koa-logger')
const log4js = require('./utils/log4')
const users = require('./routes/users')
// 导入路由模块
const router = require('koa-router')()

const koajwt = require('koa-jwt')
const util = require('./utils/util.js')

// 导入连接数据库
require('./config/db.js')

// error handler
onerror(app)

// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text']
  })
)
app.use(json())
// app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(
  views(__dirname + '/views', {
    extension: 'pug'
  })
)

// logger
app.use(async (ctx, next) => {
  log4js.info(`info`)
  await next().catch((err) => {
    if (err.status == '401') {
      ctx.status = 200
      ctx.body = util.fail('token认证失败,请重新登录', util.CODE.AUTH_ERROR)
    } else {
      throw err
    }
  })
})

// routes
app.use(
  koajwt({ secret: 'imooc' }).unless({
    path: [/^\/api\/users\/login/]
  })
)

router.prefix('/api') //定义一级路由

// 加载2级路由
router.use(users.routes(), users.allowedMethods())
// 加载全局路由
app.use(router.routes(), router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  log4js.error(`${err}`)
})

module.exports = app