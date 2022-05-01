/**
 * 用户管理模块
 */
const router = require('koa-router')()
// 导入提示输出
const util = require('../utils/util')

const Role = require('../models/roleSchema.js')
// 当前模块
router.prefix('/roles') //一级

/**
 * 角色创建，编辑，删除
 */
router.post('/operate', async (ctx) => {
  let { _id, roleName, remark, action } = ctx.request.body
  let info
  try {
    if (action == 'create') {
      await Role.create({ roleName, remark })
      info = '添加成功'
    } else if (action == 'edit') {
      let params = { roleName, remark }
      params.updateTime = new Date()
      await Role.findByIdAndUpdate(_id, params)
      info = '修改成功'
    } else {
      await Role.findByIdAndRemove(_id)
      info = '删除成功'
    }
    ctx.body = util.success({ msg: info }, info)
  } catch (error) {
    ctx.body = util.fail({ msg: error }, '操作失败')
  }
})

/**
 * 获取角色信息
 */
router.get('/list', async (ctx) => {
  console.log(ctx)
  let { roleName } = ctx.request.query
  let params = {}
  if (roleName) params.roleName = roleName
  try {
    const list = await Role.find(params)
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail({ msg: error }, '获取数据失败')
  }
})
/**
 * 设置权限
 */
router.post('/update/permission', async (ctx) => {
  let { _id, permissionList } = ctx.request.body
  try {
    const res = await Role.findByIdAndUpdate({ _id }, { permissionList })
    ctx.body = util.success(res, '设置权限成功')
  } catch (error) {}
  console.log(_id, permissionList)
})

module.exports = router
