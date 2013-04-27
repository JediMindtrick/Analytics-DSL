Object.prototype.isObject = true;
Function.prototype.isFunction = true;
String.prototype.isString = true;
Number.prototype.isNumber = true;
Array.prototype.isArray = true;

Array.prototype.last = function(){
	if(this.length > 0){
		return this[this.length - 1];
	}
};

String.prototype.startsWith = function(str){
	return this.indexOf(str) === 0;
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

exports.getArgs = getArgs;
exports.hasValue = _hasValue;
exports.stringHasValue = _stringHasValue;