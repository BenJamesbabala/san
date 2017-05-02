/**
 * @file 解析表达式
 * @author errorrik(errorrik@gmail.com)
 */

var Walker = require('./walker');
var readTertiaryExpr = require('./read-tertiary-expr');

/**
 * 解析表达式
 *
 * @param {string} source 源码
 * @return {Object}
 */
function parseExpr(source) {
    if (typeof source === 'object' && source.type) {
        return source;
    }

    return readTertiaryExpr(new Walker(source));
}

exports = module.exports = parseExpr;
