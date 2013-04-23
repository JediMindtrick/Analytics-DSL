require('./util');
var op = require('./operations').op;

//var Engine = require('./executionEngine').Engine;
var _identity = op.identity;
var _true = op.bool._true;
var _false = op.bool._false;
var _enumeration = op.enumeration;
var _retrieve = op.retrieve;
var _add = op.add;
var _subtract = op.subtract;
var _multiply = op.multiply;
var _divide = op.divide;
var _eq = op.eq;
var _neq = op.neq;
var _and = op.and;
var _or = op.or;
var _gt = op.gt;
var _lt = op.lt;
var _gte = op.gte;
var _lte = op.lte;
var _cond = op.cond;

var ast = {};

var getAST = function(){
	return ast;	 	
};

var clearAST = function(){
	ast = {};
};

var _getGlobal = function(){
		//not sure if this is a good idea, but gonna try it out
	//we're in node
	if(typeof GLOBAL !== 'undefined'){
		return GLOBAL;
	//we're in a browser
	}else if (typeof window !== 'undefined'){
		return window;
	}else{
		throw '_getGlobal() is unable to determine global context!';
	}

};

var _defineGlobal = function(name,value){
	var glob = _getGlobal();
	glob[name] = value;
};

var define = function(name,value){
	//only one parameter designates assigning identity
	if(!value){
		value = identity;
	}

	if(value.isArray){
		var _array = value;
		//enumeration expects args, not an array...so calling apply
		//will turn the array into an args object
		value = enumeration.apply(this,_array);
	}

	ast[name] = value;

	//We're going to put some stuff up in the global namespace to make life easier
	var _name = name;
	var _value = value;

	_value = name;
	_defineGlobal(_name,_value);


	if(value.operator && value.operator === _enumeration){
		//allows this:  isHousingSit('Own')
		//instead of this: retrieve('Own',HousingSit)
		//for use in boolean expression
		_name = 'is' + name;
		_value = function(toRetrieve){
			return retrieve(toRetrieve,name);
		};
		_defineGlobal(_name,_value);

		//allows this: hasHousingSit('Own')
		//instead of this: eq(HousingSit,isHousingSit('Own'))
		_name = 'has' + name;
		_value = function(toCompare){
			return eq(name,retrieve(toCompare,name));
		};
		_defineGlobal(_name,_value);

		//allows this:  isHousingSit('Own')
		//instead of this: retrieve('Own',HousingSit)
		//for use when returning a value
		_name = 'get' + name;
		_value = function(toRetrieve){
			return retrieve(toRetrieve,name);
		};
		_defineGlobal(_name,_value);
	}
};
String.prototype.eq = function(toCompare){
	var _name = this.toString();
	var _glob = _getGlobal();

	if(_glob[_name]){
		var toReturn = eq(_name,toCompare);
		return toReturn;
	}
};

String.prototype.gt = function(toCompare){
	var _name = this.toString();
	var _glob = _getGlobal();

	if(_glob[_name]){
		var toReturn = gt(_name,toCompare);
		return toReturn;
	}
};

String.prototype.minus = function(rh){
	var _name = this.toString();
	var _glob = _getGlobal();

	if(_glob[_name] && _glob[rh]){
		var toReturn = subtract(_name,rh);
		return toReturn;
	}
};

var identity = {
	operator: _identity,
	args: []
};
var enumeration = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _enumeration,
		args: _args
	};
};
var retrieve = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _retrieve,
		args: _args
	};
};
var add = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _add,
		args: _args
	};
};
var subtract = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _subtract,
		args: _args
	};
};
var multiply = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _multiply,
		args: _args
	};
};
var divide = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _divide,
		args: _args
	};
};
var eq = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _eq,
		args: _args
	};
};
var neq = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _neq,
		args: _args
	};
};
var and = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _and,
		args: _args
	};
};
var or = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _or,
		args: _args
	};
};
var gt = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _gt,
		args: _args
	};
};
var lt = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _lt,
		args: _args
	};
};
var gte = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _gte,
		args: _args
	};
};
var lte = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _lte,
		args: _args
	};
};
var cond = function(){
	var _args = Array.prototype.slice.call(arguments);

	return {
		operator: _cond,
		args: _args
	};
};

exports.define = define;
exports.getAST = getAST;
exports.clearAST = clearAST;
exports.identity = identity;
exports._true = _true;
exports._false = _false;
exports.enumeration = enumeration;
exports.retrieve = retrieve;
exports.add = add;
exports.subtract = subtract;
exports.multiply = multiply;
exports.divide = divide;
exports.eq = eq;
exports.neq = neq;
exports.and = and;
exports.or = or;
exports.gt = gt;
exports.lt = lt;
exports.gte = gte;
exports.lte = lte;
exports.cond = cond;