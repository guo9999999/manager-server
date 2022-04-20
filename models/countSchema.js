const mongoose = require('mongoose')
const countSchema = mongoose.Schema({
  _id: String,
  sequence: Number
})

// 导出
module.exports = mongoose.model('counts', countSchema, 'counts')
