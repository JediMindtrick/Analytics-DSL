var u = require('./util');
var getArgs = u.getArgs;
var op = require('./operations').op;

var _true = op.bool._true;
var _false = op.bool._false;

var ast = {};

var getAST = function(){
	return ast;	 	
};

var clearAST = function(){
	ast = {};
};

var _getGlobal = function(){
	//not sure if this is a good idea, but gonna try it out anyway
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
		value = ['identity'];
	//array designates enum
	} else if(value.isArray && value.length > 0 && !op[value[0]]){
		value.unshift('enumeration');
	//otherwise lispy-style argument list
	} else if(!value.isArray){
		value = getArgs(arguments).slice(1);
	} else{
		//default is that we were already passed a lispy-style argument list,
		//in this case do nothing to alter the value
	}

	ast[name] = value;

	//We're going to put some stuff up in the global namespace to make life easier
	var _name = name;
	var _value = value;

	_value = name;
	_defineGlobal(_name,_value);


	if(value[0] === 'enumeration'){
		//allows this:  isPosition('flat')
		//instead of this: retrieve('flat',Position)
		//for use in boolean expression
		_name = 'is' + name;
		_value = function(toRetrieve){
			return ['retrieve',toRetrieve,name]; // retrieve(toRetrieve,name);
		};
		_defineGlobal(_name,_value);

		//allows this: hasPosition('flat')
		//instead of this: eq(Position,isPosition('flat'))
		_name = 'has' + name;
		_value = function(toCompare){
			return ['eq',name,['retrieve',toCompare,name]];
		};
		_defineGlobal(_name,_value);

		//allows this:  getPosition('flat')
		//instead of this: retrieve('flat',Position)
		//for use when returning a value
		_name = 'get' + name;
		_value = function(toRetrieve){
			return ['retrieve',toRetrieve,name];
		};
		_defineGlobal(_name,_value);
	}
};
String.prototype.eq = function(toCompare){
	var _name = this.toString();
	var _glob = _getGlobal();

	if(_glob[_name]){
		var toReturn = ['eq',_name,toCompare];
		return toReturn;
	}
};

String.prototype.gt = function(toCompare){
	var _name = this.toString();
	var _glob = _getGlobal();

	if(_glob[_name]){
		var toReturn = ['gt',_name,toCompare];
		return toReturn;
	}
};

String.prototype.minus = function(rh){
	var _name = this.toString();
	var _glob = _getGlobal();

	if(_glob[_name]){
		var toReturn = ['subtract',_name,rh];
		return toReturn;
	}
};

var buildFunc = function(name){
	return function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift(name);
		return args;
	};
};

exports.define = define;
exports.getAST = getAST;
exports.clearAST = clearAST;
exports.identity = ['identity']; 
exports._true = _true;
exports._false = _false;
exports.enumeration = buildFunc('enumeration');
exports.retrieve = buildFunc('retrieve');
exports.add = buildFunc('add');
exports.subtract = buildFunc('subtract');
exports.multiply = buildFunc('multiply');
exports.divide = buildFunc('divide');
exports.eq = buildFunc('eq');
exports.neq = buildFunc('neq');
exports.and = buildFunc('and');
exports.or = buildFunc('or');
exports.gt = buildFunc('gt');
exports.lt = buildFunc('lt');
exports.gte = buildFunc('gte');
exports.lte = buildFunc('lte');
exports.cond = buildFunc('cond');