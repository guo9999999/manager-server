/**
 * 用户管理模块
 */
const router = require('koa-router')()
// 导入提示输出
const util = require('../utils/util')

const Leave = require('../models/leaveSchema')
const Dept = require('../models/deptSchema')
// 当前模块
router.prefix('/leave') //一级

/**
 * 休假申请，删除
 */
router.post('/operate', async (ctx) => {
  let { _id, action, ...params } = ctx.request.body
  let info
  try {
    if (action === 'create') {
      // 获取当前登录用户信息，
      let authorization = ctx.request.headers.authorization

      // 解密token
      let { data } = util.decode(authorization)

      let total = await Leave.countDocuments() //总条数
      // 订单号
      params.orderNo = 'XJ' + util.format(new Date(), 'yyyyMMdd') + total

      // 当前申请休假用户
      params.applyUser = {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail
      }

      // 获取当前用户部门id
      let id = data.deptId.pop()
      // 获取当前部门的用户信息
      const dept = await Dept.findById(id)
      // 获取司徒，大汉帝国负责人信息
      const userList = await Dept.find({
        deptName: { $in: ['司徒', '大汉帝国'] }
      })

      // 当前审核人
      params.curAuditUserName = dept.userName
      // 审核人
      let auditFlows = [
        {
          userId: dept.userId,
          userName: dept.userName,
          userEmail: dept.userEmail
        }
      ]
      let auditUsers = dept.userName
      userList.map((item) => {
        if (dept.userId != item.userId) {
          auditFlows.push({
            userId: item.userId,
            userName: item.userName,
            userEmail: item.userEmail
          })
          auditUsers += `, ${item.userName}`
        }
      })
      params.auditFlows = auditFlows
      params.auditUsers = auditUsers
      // 审批日志
      params.auditLogs = []

      await Leave.create(params)
      info = '添加成功'
    } else if (action === 'delete') {
      await Leave.findByIdAndUpdate(_id, { applyState: 5 })
      info = '已作废'
    }
    ctx.body = util.success({ data: params, msg: info })
  } catch (error) {
    ctx.body = util.fail({ msg: error.message })
  }
})

/**
 * 获取申请休假数据
 */
router.get('/list', async (ctx) => {
  let { applyState, type } = ctx.request.query
  let { page, skipIndex } = util.pager(ctx.request.query)
  // 获取当前登录用户信息，
  let authorization = ctx.request.headers.authorization

  // 解密token
  let { data } = util.decode(authorization)
  try {
    let params = {}
    if (type === 'approve') {
      // 审批列表
      if (applyState == 1 || applyState == 2) {
        params.curAuditUserName = data.userName
        params.$or = [{ applyState: 1 }, { applyState: 2 }]
      } else if (applyState > 2) {
        // 审核人需要我审核的里面，除了待审批和审批中的其他情况
        params = { 'auditFlows.userId': data.userId, applyState }
      } else {
        // 查询所有，审核人需要我审核的里面
        params = { 'auditFlows.userId': data.userId }
      }
    } else {
      // 申请列表
      params = {
        'applyUser.userId': data.userId
      }
      if (+applyState) params.applyState = applyState
    }
    console.log('=>', params)
    const query = Leave.find(params)
    // 分页查询
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Leave.countDocuments(params)

    ctx.body = util.success({
      list,
      page: {
        ...page,
        total
      }
    })
  } catch (error) {
    ctx.body = util.fail({ msg: error.message })
  }
})
/**
 * 审批
 */
router.post('/approve', async (ctx) => {
  let { action, _id, remarks } = ctx.request.body
  // 获取当前登录的用户
  let authorization = ctx.request.headers.authorization
  // 解释token
  const { data } = util.decode(authorization)
  let params = {}
  let info = ''
  try {
    const doc = await Leave.findById(_id)
    let auditLogs = doc.auditLogs || []
    if (action === 'reject') {
      //驳回
      params.applyState = 4
      info = '拒绝审批'
    } else {
      // 审批通过
      if (doc.auditFlows.length == doc.auditLogs.length) {
        // 审核人和日志的数据长度一样，则不让审批
        ctx.body = util.success('申请单已处理，请不要重复提交')
        return
      } else if (doc.auditFlows.length == doc.auditLogs.length + 1) {
        params.applyState = 3
      } else if (doc.auditFlows.length > doc.auditLogs.length) {
        params.applyState = 2
        params.curAuditUserName =
          doc.auditFlows[doc.auditLogs.length + 1].userName
      }
      info = '审批通过'
    }
    auditLogs.push({
      userId: data.userId,
      userName: data.userName,
      createTime: new Date(),
      remark: remarks, //备注
      action: action == 'reject' ? '审批拒绝' : '审批通过' //审批状态
    })
    params.auditLogs = auditLogs
    await Leave.findByIdAndUpdate(_id, params)
    ctx.body = util.success({ msg: info })
  } catch (error) {
    ctx.body = util.fail({ msg: error.message })
  }
})
/**
 *获取待审批通知数量
 */
router.get('/count', async (ctx) => {
  let authorization = ctx.request.headers.authorization
  // 解释token
  const { data } = util.decode(authorization)
  let params = {}
  try {
    params.curAuditUserName = data.userName
    params.$or = [{ applyState: 1 }, { applyState: 2 }]
    const total = await Leave.countDocuments(params)
    ctx.body = util.success(total)
  } catch (error) {
    ctx.body = util.fail({ msg: error.message })
  }
})

module.exports = router
