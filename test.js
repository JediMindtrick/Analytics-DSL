;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var b = require('./builder');
var define = b.define;
var getAST = b.getAST;
var identity = b.identity;
var _true = b._true;
var _false = b._false;
var options = b.enumeration;
var retrieve = b.retrieve;
var add = b.add;
var subtract = b.subtract;
var multiply = b.multiply;
var divide = b.divide;
var eq = b.eq;
var neq = b.neq;
var and = b.and;
var or = b.or;
var gt = b.gt;
var lt = b.lt;
var gte = b.gte;
var lte = b.lte;
var when = b.cond;
//extra shims...may move up into builder if we like them
String.prototype.equals = String.prototype.eq;
String.prototype.greaterThan = String.prototype.gt;

var Engine = require('./executionEngine').Engine;
require('./executionEngine').setReportingLevel('');//turn off verbose

define('MSFT');
define('Dow');
define('ReserveBoardMeeting',['yes','no']);
define('EarningsRelease',['yes','no']);
define('MSFTEarnings');
define('DayOfWeek',['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
define('Position',['long','short','flat']);
define('Actions',['buy','sell','none']);
define('Action',
	when(
		hasPosition('flat'), getActions('buy'),
		getActions('none')
	)
);

//this would be the runtime data that is input into the actual application
var testInput = {
	MSFT: 50,
	Dow: 12000,
	ReserveBoardMeeting: 'no',
	MSFTEarnings: 1.35,
	DayOfWeek: 'tuesday',
	Position: 'flat',
	Action: null
};

//console.log(JSON.stringify(getAST(),2));

var engine = new Engine(getAST());
var out = engine.execute(testInput);
console.log(JSON.stringify(out));

/*this is what the results look like:
{"MSFT":50,"Dow":12000,"ReserveBoardMeeting":1,"MSFTEarnings":1.35,"DayOfWeek":1,"Position":2,"Action":0}
*/
},{"./builder":2,"./executionEngine":3}],3:[function(require,module,exports){
require('./util');
var op = require('./operations').op;

var reportingLevel = 'verbose';
var log = function(msg){
	if(reportingLevel === 'verbose'){
		console.log(msg);
	}
};

var runtimeEngine = function(semanticModel){
	this.model = semanticModel;
	this.op = op;
};

runtimeEngine.prototype.execute = function(inputs){
	this.inputs = inputs;
	this.output = {};

	for(var sym in inputs){

		if(inputs.hasOwnProperty(sym)){
			if(!this.model[sym]){
				throw "unhandled input identifier " + sym;
			}

			this.evaluate(sym);

			if(invalidOutputValue(this.output[sym])){
				throw 'operation for ' + sym + ' failed to output a value!';
			}
		}
	}

	return this.output;
};


var invalidOutputValue = function(value){
	return value === null || value === undefined || !value.isNumber;
};

runtimeEngine.prototype.evaluate = function(symOrValue){

	//already been determined/calculated
	if(this.output[symOrValue]){
		return this.output[symOrValue];
	
	//case primitive value, strings are used for enums
	}else if(symOrValue.isNumber || (!this.model[symOrValue] && symOrValue.isString)){
		return symOrValue;
	
	//operation
	}else if(symOrValue.isObject || this.model[symOrValue]){

		var operation = null;
		//grab the operation, which includes an operator as well as arguments
		if(this.model[symOrValue]){
			operation = this.model[symOrValue];
		}else if(symOrValue.operator){
			operation = symOrValue;
		}else{
			throw 'Unable to determine operation for ' + JSON.stringify(symOrValue) + '!';
		}

		log('operation: ' + JSON.stringify(operation.operator));

		var argsToPass = [];

		//pass input value first, if we have one
		if(this.inputs[symOrValue]){
			argsToPass.push(this.inputs[symOrValue]);			
		}

		/*evaluate further arguments*/
		var args = null;
		if(this.model[symOrValue]){
			args = this.model[symOrValue].args;
		}else if(symOrValue.args){
			args = symOrValue.args;
		}else{
			throw 'Unable to determine arguments for ' + JSON.stringify(symOrValue) + '!';
		}

		//retrieve is handled differently, because otherwise we end up trying to retrieve
		//against a previously determined enumeration value
		//ex. Housing: {op.enum ['own','rent']}
		//Housing: 'own'
		//and {op.retrieve ['rent','Housing']}
		//would end up passing ['rent',0] to retrieve,
		//when we really want ['rent','Housing']...so we don't evaluate the second retrieve
		//argument
		if(operation.operator === op.retrieve){
			argsToPass.push(args[0]);
			argsToPass.push(args[1]);
		}else{
			for(var i = 0, l = args.length; i < l; i++){
				var curr = args[i];
				//ignore nulls, undefineds and enums
				if(curr !== null && curr !== undefined && operation.operator !== op.enumeration){
					var toPush = this.evaluate(curr);

					argsToPass.push(toPush);
				}
			}
		}
		
		argsToPass.push(symOrValue);

		//finally, apply the function
		var toReturn = operation.operator.Func.apply(this,argsToPass);

		//if it's part of the expected calculations, add it
		if(this.model[symOrValue]){
			this.output[symOrValue] = toReturn;
		}

		return toReturn;

	//case error
	}else{
		throw 'unknown operator was passed!';
	}
};

exports.Engine = runtimeEngine;
exports.setReportingLevel = function(level){
	reportingLevel = level;
};
},{"./util":4,"./operations":5}],2:[function(require,module,exports){
(function(){require('./util');
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
})()
},{"./operations":5,"./util":4}],4:[function(require,module,exports){
(function(){Object.prototype.isObject = true;
Function.prototype.isFunction = true;
String.prototype.isString = true;
Number.prototype.isNumber = true;
Array.prototype.isArray = true;

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
})()
},{}],5:[function(require,module,exports){
(function(){/* 
Example of how cond() works
Taxes:{
	operator: op.cond,
	args: [
		//IF
		{operator: op.eq, args: ['GrossInc',3000]}, 
		//THEN
			{operator: op.subtract, args: ['GrossInc','NetInc']},
		//ELSE
		0
	]
}

assuming GrossInc = 3000 and NetInc = 1000
since we will pre-evaluate, 
cond would get the following values passed...
inputs:
[true, 2000, 0]
output:
2000

if we changed the first boolean condition to return false (i.e. [1,2])
pre-evaluation would pass...
inputs:
[false, 2000, 0]
output:
0

Another example:
inputs:
[false, 2000, true, 1000, 0]
output:
1000
*/

var getArgs = require('./util').getArgs;
var hasValue = require('./util').hasValue;

var op = {
	bool: {
		_false: 0,
		_true: 1
	},
	identity: {
		Name: 'identity',
		Func: function(value,sym){
			return value;
		}
	},
	//enumeration defines an enum
	enumeration: {
		Name: 'enumeration',
		Func: function(value,sym){

			var idx = this.model[sym].args.indexOf(value);

			if(idx < 0){
				throw 'unable to find enumeration value of ' + value + ' for enum ' + sym;
			}
			
			return idx;
		}
	},
	//retrieve is used to retrieve the value of an enum
	retrieve: {
		Name: 'retrieve',
		Func: function(value,def){

			var idx = this.model[def].args.indexOf(value);

			if(idx < 0){
				throw 'unable to retrieve enumeration value of ' + value + ' for enum ' + def;
			}
			
			return idx;
		}
	},
	eq: {
		Name: 'equals',
		Func: function(lh,rh,sym){
			var _true = op.bool._true;
			var _false = op.bool._false;

			if(lh === rh){
				return _true
			}
			//retrieve false
			return _false;
		}
	},
	neq: {
		Name: 'not equal',
		Func: function(lh,rh,sym){			
			var _true = op.bool._true;
			var _false = op.bool._false;

			if(lh !== rh){
				return _true;
			}
			//retrieve false
			return _false;
		}
	},
	gt: {
		Name: 'greater than',
		Func: function(lh,rh){
			var _true = op.bool._true;
			var _false = op.bool._false;

			if(lh > rh){
				return _true;
			}
			return _false;
		}
	},
	lt: {
		Name: 'less than',
		Func: function(lh,rh){
			var _true = op.bool._true;
			var _false = op.bool._false;

			if(lh < rh){
				return _true;
			}
			return _false;
		}
	},
	gte: {
		Name: 'greater than or equal',
		Func: function(lh,rh){
			var _true = op.bool._true;
			var _false = op.bool._false;

			if(lh >= rh){
				return _true;
			}
			return _false;
		}
	},
	lte: {
		Name: 'less than or equal',
		Func: function(lh,rh){
			var _true = op.bool._true;
			var _false = op.bool._false;

			if(lh <= rh){
				return _true;
			}
			return _false;
		}
	},
	and: {
		Name: 'logical and',
		Func: function(){
			var _true = op.bool._true;
			var _false = op.bool._false;

			//turn arguments into an array and process accordingly
			var args = getArgs(arguments);

			if(args.length < 3){
				throw 'logical and requires at least 2 arguments!';
			}
			//we don't need no steenkin' symbol!
			args.pop();

			for(var i = 0, l = args.length; i < l; i++){
				var curr = args[i];
				if(curr === _false){
					return _false;
				}
			}

			return _true;
		}
	},	
	or: {
		Name: 'logical or',
		Func: function(){
			var _true = op.bool._true;
			var _false = op.bool._false;

			//turn arguments into an array and process accordingly
			var args = getArgs(arguments);

			if(args.length < 3){
				throw 'logical or requires at least 2 arguments!';
			}
			//we don't need no steenkin' symbol!
			args.pop();

			for(var i = 0, l = args.length; i < l; i++){
				var curr = args[i];
				if(curr === _true){
					return _true;
				}
			}

			return _false;
		}
	},
	add: {
		Name: 'add',
		Func: function(lh,rh){
			return lh + rh;
		}
	},
	subtract: {
		Name: 'subtract',
		Func: function(lh,rh){
			return lh - rh;
		}
	},
	multiply: {
		Name: 'multiply',
		Func: function(lh,rh){
			return lh * rh;
		}
	},
	divide: {
		Name: 'divide',
		Func: function(lh,rh){
			return lh / rh;
		}
	},
	cond: {
		Name: 'conditional',
		Func: function(){
			var _true = op.bool._true;
			var _false = op.bool._false;

			//turn arguments into an array and process accordingly
			var args = getArgs(arguments); // Array.prototype.slice.call(arguments);

			if(args.length < 3){
				throw 'conditional requires at least 2 arguments!';
			}
			//we don't need no steenkin' symbol!
			args.pop();

			for(var i = 0, l = args.length; i < l; i++){
				var curr = args[i];
				var next = args[i + 1];

				//if conditional equals bool.true, then return second
				if(curr === _true){
					if(hasValue(next)){
						return next;
					}
				}
				//take them in pairs
				i++;
			}

			//return else condition, if supplied
			if(args.length % 2 == 1){
				return args[args.length - 1];
			}

			return undefined; 
		}
	}
};

exports.op = op;
})()
},{"./util":4}]},{},[1])
;