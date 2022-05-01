/**
 * 通用工具函数
 */
const log4js = require('./log4')
// 导入jsonwebtoken，用于生成token
const jwt = require('jsonwebtoken')
const CODE = {
  SUCCESS: 200,
  PARAM_ERROR: 400, // 参数错误
  USER_ACCOUNT_ERROR: 20001, //账号或密码错误
  USER_LOGIN_ERROR: 30001, // 用户未登录
  BUSINESS_ERROR: 40001, //业务请求失败
  AUTH_ERROR: 401 // 认证失败或TOKEN过期
}
module.exports = {
  /**
   * 分页结构封装
   * @param {number} pageNum
   * @param {number} pageSize
   */
  pager({ pageNum = 1, pageSize = 10 }) {
    pageNum *= 1
    pageSize *= 1
    const skipIndex = (pageNum - 1) * pageSize
    return {
      page: {
        pageNum,
        pageSize
      },
      skipIndex //从哪里开始的下标
    }
  },
  success(data = '', msg = '', code = CODE.SUCCESS) {
    log4js.debug(data)
    return {
      code,
      data,
      msg
    }
  },
  fail(msg = '', code = CODE.BUSINESS_ERROR, data = '') {
    log4js.debug(msg)
    return {
      code,
      data,
      msg
    }
  },
  CODE,
  /**
   * 解密token
   * @param {*} authorization
   */
  decode(authorization) {
    if (authorization) {
      const token = authorization.split(' ')[1]
      return jwt.verify(token, 'imooc')
    }
    return ''
  },
  /**
   * 获取菜单树形结构
   * @param {所有菜单列表数据} rootList
   * @param {根据id进行结构} id
   */
  getTreeMenu(rootList, id) {
    const filterArr = rootList.filter((item) => {
      return String(item.parentId.slice().pop()) == String(id)
    })

    if (filterArr.length) {
      filterArr.map((item) => {
        item._doc.children = this.getTreeMenu(rootList, item._id)
        if (
          item._doc.children.length > 0 &&
          item._doc.children[0].menuType == 2
        ) {
          item._doc.action = item._doc.children
        }
        // console.log('item =>', item._doc.children)
      })
      return filterArr
    } else {
      return filterArr
    }
  }
}
