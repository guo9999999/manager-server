/**
 * 用户管理模块
 */
const router = require('koa-router')()
// 导入提示输出
const util = require('../utils/util')

const Menu = require('../models/menuSchema.js')
// 当前模块
router.prefix('/menu')

/**
 * 菜单创建/编辑/删除
 */
router.post('/create', async (ctx) => {
  const { action, _id, ...params } = ctx.request.body
  let info
  try {
    if (action === 'create') {
      // 创建菜单
      await Menu.create(params)
      info = '添加成功'
    } else if (action === 'edit') {
      // 编辑菜单
      params.updateTime = new Date()
      await Menu.findByIdAndUpdate(_id, params)
      info = '更新成功'
    } else {
      // 删除菜单
      // 删除当前id
      await Menu.findByIdAndRemove(_id)
      // 删除所有父菜单parentId为_id,要删除这条数据id
      await Menu.deleteMany({ parentId: { $all: [_id] } })
      info = '删除成功'
    }
    ctx.body = util.success({ msg: info }, info)
  } catch (error) {
    ctx.body = util.fail(error.message, '操作失败')
  }
})

router.get('/list', async (ctx) => {
  const { menuState, menuName } = ctx.request.query
  let params = {}
  if (menuName) params.menuName = menuName
  if (menuState) params.menuState = menuState
  const list = (await Menu.find(params)) || []

  let res = getTreeMenu(list, null)
  ctx.body = util.success(res)
})

function getTreeMenu(rootList, id) {
  const filterArr = rootList.filter((item) => {
    return String(item.parentId.slice().pop()) == String(id)
  })

  if (filterArr.length) {
    filterArr.map((item) => {
      item._doc.children = getTreeMenu(rootList, item._id)
    })
    return filterArr
  } else {
    return filterArr
  }
}
module.exports = router
