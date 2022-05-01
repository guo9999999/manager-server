/**
 * 用户管理模块
 */
const router = require('koa-router')()
// 导入提示输出
const util = require('../utils/util')

const Dept = require('../models/deptSchema')
// 当前模块
router.prefix('/dept') //一级

/**
 * 创建/编辑/删除操作
 */
router.post('/operate', async (ctx) => {
  const { _id, deptName, parentId, userId, userName, userEmail, action } =
    ctx.request.body
  let info
  try {
    if (action == 'create') {
      await Dept.create({
        deptName,
        parentId,
        userId,
        userName,
        userEmail
      })
      info = '添加成功'
    } else if (action == 'edit') {
      let params = { deptName, parentId, userId, userName, userEmail }
      params.updateTime = new Date()
      await Dept.findByIdAndUpdate({ _id }, params)
      info = '修改成功'
    } else {
      await Dept.findByIdAndRemove({ _id })
      //  删除所有parentId里面带有_id
      await Dept.deleteMany({ parentId: { $all: [_id] } })
      info = '删除成功'
    }
    ctx.body = util.success({ msg: info })
  } catch (error) {
    ctx.body = util.fail(error.message)
  }
})
/**
 * 获取部门信息
 */
router.get('/list', async (ctx) => {
  const { deptName } = ctx.request.query
  let params = {}
  if (deptName) params.deptName = deptName
  try {
    const list = await Dept.find(params)
    if (deptName) {
      ctx.body = util.success(list)
    } else {
      let res = getTreeDept(list, null)
      ctx.body = util.success(res)
    }
  } catch (error) {
    ctx.body = util.fail(error.message)
  }
})

function getTreeDept(rootList, id) {
  let filterArr = rootList.filter((item) => {
    return String(item.parentId.slice().pop()) === String(id)
  })
  if (filterArr.length) {
    filterArr.map((item) => {
      item._doc.children = getTreeDept(rootList, item._id)
    })
  }
  return filterArr
}

module.exports = router
