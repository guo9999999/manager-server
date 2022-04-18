/**
 * 数据库连接
 */
//导入mongoose
const mongoose = require('mongoose')
const config = require('./index.js')
// 导入捕获日志
const log4js = require('../utils/log4.js')

// 连接数据
mongoose.connect(config.URl)

// 监听
const db = mongoose.connection

db.on('error', () => {
  log4js.error('数据库连接失败')
})
db.on('open', () => {
  log4js.info('数据库连接成功')
})
