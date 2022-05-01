/**
 * 用户管理模块
 */
const router = require('koa-router')()
// 导入用户表(模型)
const User = require('../models/userSchema')
const Menu = require('../models/menuSchema')
const Role = require('../models/roleSchema')
const Count = require('../models/countSchema.js')
// 导入提示输出
const util = require('../utils/util')
// 导入jsonwebtoken，用于生成token
const jwt = require('jsonwebtoken')
const md5 = require('md5')
// 当前模块
router.prefix('/users')

/**
 * 登录模块
 */
router.post('/login', async (ctx) => {
  const { userName, password } = ctx.request.body
  // 查找数据  findOne（查找的条件）查找一条数据
  const res = await User.findOne(
    {
      userName,
      password
    },
    { password: 0 }
  )
  const data = res._doc
  const token = jwt.sign(
    {
      data: data
    },
    'imooc',
    { expiresIn: 3600 * 10 }
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
    ctx.body = util.fail('账号或者密码错误')
  }
})

router.get('/list', async (ctx) => {
  //ctx.request.query 接收传递过来的参数
  let { userId, userName, state } = ctx.request.query
  let { page, skipIndex } = util.pager(ctx.request.query)
  let params = {} //接收传递过来的参数
  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state != 0) params.state = state
  try {
    // 查询所有用户列表{排除掉密码，和_id}
    const query = User.find(params, { password: 0, _id: 0 })
    // 根据分页查询当前数据，skip()表示从哪里开始查找，limit()表示查询多少条数据
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params)
    ctx.body = util.success({
      list,
      page: {
        ...page,
        total
      }
    })
  } catch (error) {
    ctx.body = util.fail(`查询异常${error}`)
  }
})
/**
 * 用户删除或者批量删除
 */
router.delete('/delete', async (ctx) => {
  // 待删除的用户Id数组
  const { userIds } = ctx.request.body

  const res = await User.updateMany({ userId: { $in: userIds } }, { state: 2 })
  if (res.modifiedCount) {
    ctx.body = util.success(
      {
        nModified: res.modifiedCount
      },
      `成功删除${res.modifiedCount}条数据`
    )
    return
  }
  ctx.body = util.fail('删除失败')
})

/**
 * 用户修改和新增
 *
 */
router.post('/create', async (ctx) => {
  const {
    userId,
    userName,
    userEmail,
    mobile,
    job,
    state,
    roleList,
    deptId,
    action
  } = ctx.request.body
  //action 当前的操作方式
  if (action === 'add') {
    //添加操作
    if (!userName || !userEmail || !mobile || !deptId) {
      return util.fail('参数不正确', util.CODE.PARAM_ERROR)
    }

    // 查找当前输入的用户名，邮箱，手机号码是否重复
    const res = await User.findOne(
      { $or: [{ userName }, { userEmail }, { mobile }] },
      '_id userName'
    )
    if (res) {
      ctx.body = util.fail(`有重复用户，信息如下:${res.userName}`)
      return
    } else {
      try {
        // 查找id表并修改id值  $inc 更新当前值 ,第三个参数{ new: true } 把更新后的值返回
        const doc = await Count.findOneAndUpdate(
          { _id: 'userId' },
          { $inc: { sequence: 1 } },
          { new: true }
        )
        // 添加新数据
        const user = new User({
          userId: doc.sequence,
          userName,
          password: md5('123456'),
          userEmail,
          mobile,
          role: 1, //默认为普通用户
          job,
          state,
          roleList,
          deptId
        })
        user.save()
        ctx.body = util.success({ msg: '添加用户成功' }, '添加成功')
      } catch (error) {
        ctx.body = util.fail('添加失败')
      }
    }
  } else {
    // 修改操作
    if (!mobile || !deptId) {
      return util.fail('手机号码或者部门不能为空', util.CODE.PARAM_ERROR)
    }
    try {
      await User.findOneAndUpdate(
        { userId },
        { mobile, job, state, roleList, deptId }
      )
      ctx.body = util.success({ msg: '修改成功' }, '更新成功')
    } catch (error) {
      ctx.body = util.fail(error.message, '更新失败')
    }
  }
})

router.get('/all/list', async (ctx) => {
  try {
    const list = await User.find()
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.message)
  }
})
/**
 * 获取权限接口
 */
router.get('/getPermissionList', async (ctx) => {
  // 获取token信息
  const authorization = ctx.request.headers.authorization
  const { data } = util.decode(authorization)
  let menuList = await getMenuList(data.role, data.roleList)
  let actionList = getActionList(JSON.parse(JSON.stringify(menuList)))
  ctx.body = util.success({ menuList, actionList })
})
/**
 * 处理根据权限获取菜单列表
 * @param {*} userRole
 * @param {*} roleKeys
 */
async function getMenuList(userRole, roleKeys) {
  let rootList = []
  if (userRole == 0) {
    // 管理员权限
    rootList = (await Menu.find()) || []
  } else {
    //根据用户拥有的角色，获取当前的权限列表
    // 查找用户对应的角色列表
    const roleList = await Role.find({ _id: { $in: roleKeys } })
    let permissionList = []
    roleList.map((role) => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList
      // 把权限合并成一个数组
      permissionList = permissionList.concat([
        ...checkedKeys,
        ...halfCheckedKeys
      ])
    })
    // 去掉重复的权限
    permissionList = [...new Set(permissionList)]
    // 查找当前用户有权限的菜单
    rootList = await Menu.find({ _id: { $in: permissionList } })
    console.log('roleList=》', permissionList)
  }
  return util.getTreeMenu(rootList, null)
}

/**
 * 获取当前用户权限下的按钮权限控制
 * @param {*} rootList
 */
function getActionList(rootList) {
  let actionList = []
  const deep = (arr) => {
    while (arr.length) {
      let item = arr.pop()
      if (item.action) {
        item.action.map((action) => {
          actionList.push(action.menuCode)
        })
      }
      if (item.children && !item.action) {
        deep(item.children)
      }
    }
  }
  deep(rootList)
  return actionList
}
module.exports = router
