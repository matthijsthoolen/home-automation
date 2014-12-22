/*
 * Return the value of an options field, if not available return the default.
 */
exports.opt = function (options, name, def){
     return options && options[name] !== undefined ? options[name] : def;
};