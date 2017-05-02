/**
 * @file 解析调用
 * @author errorrik(errorrik@gmail.com)
 */


var Walker = require('./walker');
var readCall = require('./read-call');

/**
 * 解析调用
 *
 * @param {string} source 源码
 * @return {Object}
 */
function parseCall(source) {
    return readCall(new Walker(source));
}

exports = module.exports = parseCall;
