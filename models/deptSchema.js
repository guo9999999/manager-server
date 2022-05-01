const mongoose = require('mongoose')
const deptSchema = mongoose.Schema({
  deptName: String,
  userId: String,
  userName: String,
  userEmail: String,
  parentId: [mongoose.Types.ObjectId],
  updateTime: {
    type: Date,
    default: new Date()
  },
  createTime: {
    type: Date,
    default: new Date()
  }
})
// 导出
module.exports = mongoose.model('depts', deptSchema, 'depts')
