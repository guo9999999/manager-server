const mongoose = require('mongoose')
const leaveSchema = mongoose.Schema({
  orderNo: String, //当前订单号
  applyState: { type: Number, default: 1 }, //当前审批状态
  applyType: Number, //申请休假类型
  startTime: { type: Date, default: Date.now() }, //开始时间
  endTime: { type: Date, default: Date.now() }, //结束时间
  leaveTime: String, //休假时长
  reasons: String, //休假原因
  applyUser: {
    userId: String,
    userName: String,
    userEmail: String
  }, //申请用户信息
  auditUsers: String, //审批人
  curAuditUserName: String, //当前审批人
  auditFlows: [
    {
      userId: String,
      userName: String,
      userEmail: String
    }
  ], //审批流（审批人信息）
  auditLogs: [
    {
      userId: String,
      userName: String,
      createTime: { type: Date, default: Date.now() },
      remark: String, //备注
      action: String //审批状态
    }
  ], //审批日志
  createTime: { type: Date, default: Date.now() } //申请时间
})
// 导出
module.exports = mongoose.model('leave', leaveSchema, 'leave')
