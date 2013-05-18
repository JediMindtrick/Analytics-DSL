Function.prototype.isFunction = true;
String.prototype.isString = true;
Number.prototype.isNumber = true;
Array.prototype.isArray = true;

Array.prototype.last = function(){
	if(this.length > 0){
		return this[this.length - 1];
	}
};

String.prototype.parsesNumber = function(){
	var num = parseFloat(this);
	return !isNaN(num);
};

String.prototype.startsWith = function(str){
	return this.indexOf(str) === 0;
};

String.prototype.trim = function() {
    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

//turn arguments into an array and process accordingly
var getArgs = function(){
	var _first = Array.prototype.slice.call(arguments);

	var toReturn = Array.prototype.slice.call(_first[0]);

	return toReturn;
};

var _hasValue = function(value){
	return (typeof value !== 'undefined') && value !== null;
};

var _stringHasValue = function(str){
	return _hasValue(str) && str.isString && str !== '';
};

var importNum = 0;
var _importModule = function(modPath){
	var toReturn = '';

	importNum++;
	var name = 'import_module_' + importNum;

	toReturn += name + ' = require(\'' + modPath +'\');\n';
	var modObj = require(modPath);
	
	for(var func in modObj){
		if(modObj.hasOwnProperty(func)){
			var evalString = func + ' = ' + name + '.' + func + ';';
			toReturn += evalString + '\n';
		}
	}
	
	return toReturn;
};

exports.getArgs = getArgs;
exports.hasValue = _hasValue;
exports.stringHasValue = _stringHasValue;
exports.importModule = _importModule;