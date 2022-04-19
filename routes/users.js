/**
 * 用户管理模块
 */
const router = require('koa-router')()
// 导入用户表(模型)
const User = require('../models/userSchema')
// 导入提示输出
const util = require('../utils/util')
// 导入jsonwebtoken，用于生成token
const jwt = require('jsonwebtoken')
// 当前模块
router.prefix('/users')

router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body
  // 查找数据  findOne（查找的条件）查找一条数据
  const res = await User.findOne({
    username,
    password
  }).select('password')
  const data = res._doc
  const token = jwt.sign(
    {
      data: data
    },
    'imooc',
    { expiresIn: 60 * 60 }
  )
  try {
    // 如果成功，返回数据
    if (res) {
      data.token = token
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail('账号或者密码错误')
    }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})

module.exports = router
