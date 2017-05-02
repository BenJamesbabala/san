/**
 * @file 数据类
 * @author errorrik(errorrik@gmail.com)
 */

var ExprType = require('../parser/expr-type');
var evalExpr = require('./eval-expr');
var DataChangeType = require('./data-change-type');
var parseExpr = require('../parser/parse-expr');
var each = require('../util/each');

/**
 * 数据类
 *
 * @class
 * @param {Object?} data 初始数据
 * @param {Model?} parent 父级数据容器
 */
function Data(data, parent) {
    this.parent = parent;
    this.raw = data || {};
    this.listeners = [];
}



/**
 * 添加数据变更的事件监听器
 *
 * @param {Function} listener 监听函数
 */
Data.prototype.listen = function (listener) {
    if (typeof listener === 'function') {
        this.listeners.push(listener);
    }
};

/**
 * 移除数据变更的事件监听器
 *
 * @param {Function} listener 监听函数
 */
Data.prototype.unlisten = function (listener) {
    var len = this.listeners.length;
    while (len--) {
        if (!listener || this.listeners[len] === listener) {
            this.listeners.splice(len, 1);
        }
    }
};

/**
 * 触发数据变更
 *
 * @param {Object} change 变更信息对象
 */
Data.prototype.fire = function (change) {
    each(this.listeners, function (listener) {
        listener.call(this, change);
    }, this);
};

/**
 * 获取数据项
 *
 * @param {string|Object?} expr 数据项路径
 * @return {*}
 */
Data.prototype.get = function (expr) {
    var value = this.raw;
    if (!expr) {
        return value;
    }

    expr = parseExpr(expr);

    var paths = expr.paths;
    var start = 0;
    var l = paths.length;

    for (; start < l; start++) {
        if (paths[start].value == null) {
            break;
        }
    }

    var i = 0;
    for (; value != null && i < start; i++) {
        value = value[paths[i].value];
    }

    if (value == null && this.parent) {
        value = this.parent.get({
            type: ExprType.ACCESSOR,
            paths: paths.slice(0, start)
        });
    }

    for (i = start; value != null && i < l; i++) {
        value = value[paths[i].value || evalExpr(paths[i], this)];
    }

    return value;
};

/**
 * 设置数据项
 *
 * @param {string|Object} expr 数据项路径
 * @param {*} value 数据值
 * @param {Object=} option 设置参数
 * @param {boolean} option.silence 静默设置，不触发变更事件
 */
Data.prototype.set = function (expr, value, option) {
    option = option || {};

    // #[begin] error
    var exprRaw = expr;
    // #[end]

    expr = parseExpr(expr);

    // #[begin] error
    if (expr.type !== ExprType.ACCESSOR) {
        throw new Error('[SAN ERROR] Invalid Expression in Data set: ' + exprRaw);
    }
    // #[end]

    var data = this.raw;
    var prop;

    var paths = expr.paths;
    for (var i = 0, l = paths.length; i < l - 1; i++) {
        var pathValue = evalExpr(paths[i], this);

        if (data[pathValue] == null) {
            data[pathValue] = {};
        }
        data = data[pathValue];
    }

    prop = evalExpr(paths[i], this);

    if (prop != null) {
        data[prop] = value;
        !option.silence && this.fire({
            type: DataChangeType.SET,
            expr: expr,
            value: value,
            option: option
        });
    }
};

/**
 * 数组数据项push操作
 *
 * @param {string|Object} expr 数据项路径
 * @param {*} item 要push的值
 * @param {Object=} option 设置参数
 * @param {boolean} option.silence 静默设置，不触发变更事件
 */
Data.prototype.push = function (expr, item, option) {
    var target = this.get(expr);

    if (target instanceof Array) {
        this.splice(expr, [target.length, 0, item], option);
    }
};

/**
 * 数组数据项pop操作
 *
 * @param {string|Object} expr 数据项路径
 * @param {Object=} option 设置参数
 * @param {boolean} option.silence 静默设置，不触发变更事件
 * @return {*}
 */
Data.prototype.pop = function (expr, option) {
    var target = this.get(expr);

    if (target instanceof Array) {
        var len = target.length;
        if (len) {
            return this.splice(expr, [len - 1, 1], option)[0];
        }
    }
};

/**
 * 数组数据项shift操作
 *
 * @param {string|Object} expr 数据项路径
 * @param {Object=} option 设置参数
 * @param {boolean} option.silence 静默设置，不触发变更事件
 * @return {*}
 */
Data.prototype.shift = function (expr, option) {
    return this.splice(expr, [0, 1], option)[0];
};

/**
 * 数组数据项unshift操作
 *
 * @param {string|Object} expr 数据项路径
 * @param {*} item 要unshift的值
 * @param {Object=} option 设置参数
 * @param {boolean} option.silence 静默设置，不触发变更事件
 */
Data.prototype.unshift = function (expr, item, option) {
    this.splice(expr, [0, 0, item], option);
};

/**
 * 数组数据项移除操作
 *
 * @param {string|Object} expr 数据项路径
 * @param {number} index 要移除项的索引
 * @param {Object=} option 设置参数
 * @param {boolean} option.silence 静默设置，不触发变更事件
 */
Data.prototype.removeAt = function (expr, index, option) {
    this.splice(expr, [index, 1], option);
};

/**
 * 数组数据项移除操作
 *
 * @param {string|Object} expr 数据项路径
 * @param {*} value 要移除的项
 * @param {Object=} option 设置参数
 * @param {boolean} option.silence 静默设置，不触发变更事件
 */
Data.prototype.remove = function (expr, value, option) {
    var target = this.get(expr);

    if (target instanceof Array) {
        var len = target.length;
        while (len--) {
            if (target[len] === value) {
                this.splice(expr, [len, 1], option);
                break;
            }
        }
    }
};

Data.prototype.splice = function (expr, args, option) {
    option = option || {};
    // #[begin] error
    var exprRaw = expr;
    // #[end]

    expr = parseExpr(expr);

    // #[begin] error
    if (expr.type !== ExprType.ACCESSOR) {
        throw new Error('[SAN ERROR] Invalid Expression in Data set: ' + exprRaw);
    }
    // #[end]

    var target = this.get(expr);
    var returnValue = [];

    if (target instanceof Array) {
        var index = args[0];
        if (index < 0 || index > target.length) {
            return;
        }

        returnValue = target.splice.apply(target, args);

        !option.silence && this.fire({
            expr: expr,
            type: DataChangeType.SPLICE,
            index: index,
            deleteCount: returnValue.length,
            value: returnValue,
            insertions: args.slice(2),
            option: option
        });
    }

    return returnValue;
};

exports = module.exports = Data;
