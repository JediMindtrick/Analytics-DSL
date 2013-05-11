;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var b = require('../lib/builder');
var define = b.define;
var getAST = b.getAST;
var clearAST = b.clearAST;
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

var e = require('../lib/executionEngine');
var Engine = e.Engine;
e.setReportingLevel('');//turn off verbose

clearAST();
define('MSFT');
define('Dow');
define('ReserveBoardMeeting',['yes','no']);
define('EarningsRelease',['yes','no']);
define('MSFTEarnings');
define('DayOfWeek',['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
define('WhatDayIsIt','retrieve','thursday','DayOfWeek');
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
	WhatDayIsIt: null,
	Position: 'flat',
	Action: null
};

var engine = new Engine(getAST());
clearAST();
var out = engine.execute(testInput);
console.log(JSON.stringify(out));

/*this is what the results look like:
{"MSFT":50,"Dow":12000,"ReserveBoardMeeting":1,"MSFTEarnings":1.35,"DayOfWeek":1,"Position":2,"Action":0}
*/
},{"../lib/executionEngine":2,"../lib/builder":3}],2:[function(require,module,exports){
var u = require('./util');
var getArgs = u.getArgs;
var hasValue = u.hasValue;
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
	this.currentTopSymbol = '';
	this.currentEvalSymbol = '';
	this.errorHandler = function(msg){};
};

runtimeEngine.prototype.subscribeToError = function(handler){
	this.errorHandler = handler;
};

runtimeEngine.prototype.logError = function(msg){
	if(this.errorHandler){
		var toLog = {
			topSymbol: this.currentTopSymbol,
			evalSymbol: this.currentEvalSymbol,
			message: msg
		};

		//add to outputs
		if(!this.output[this.currentTopSymbol]){
			this.output[this.currentTopSymbol] = {};
		}
		if(!this.output[this.currentTopSymbol].errors){
			this.output[this.currentTopSymbol].errors = [];
		}
		this.output[this.currentTopSymbol].errors.push({
			evalSymbol: this.currentEvalSymbol,
			message: msg	
		});

		//notify
		this.errorHandler(toLog);
	}
};

var _addToOutput = function(topSymbol,output,tag,value){
	if(!output[topSymbol]){
		output[topSymbol] = {};
	}
	output[topSymbol][tag] = value;
};

runtimeEngine.prototype.execute = function(inputs){
	this.inputs = inputs;
	this.output = {};

	for(var sym in inputs){

		if(inputs.hasOwnProperty(sym)){

			//for tracing and helpful error messages
			this.currentTopSymbol = sym;

			if(!this.model[this.currentTopSymbol]){
				this.logError("Unhandled input identifier '" + this.currentTopSymbol + "'");
				this.currentTopSymbol = '';

				continue;
			}

			try{
				this.evaluate(this.currentTopSymbol);

				if(invalidOutputValue(this.output[this.currentTopSymbol])){
					this.logError('Operation for ' + this.currentTopSymbol + ' failed to output a valid value!');
				}

			}catch(ex){
				this.logError(ex);
			}

			this.currentTopSymbol = '';
			this.currentEvalSymbol = '';
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
		this.currentEvalSymbol = '';
		return this.output[symOrValue];
	
	//case primitive value, strings are used for enums
	}else if(symOrValue.isNumber || (!this.model[symOrValue] && symOrValue.isString)){
		this.currentEvalSymbol = '';
		return symOrValue;
	
	//operation
	}else if(symOrValue.isArray || this.model[symOrValue]){

		var operation = null;

		//grab the operation, which includes an operator as well as arguments
		if(this.model[symOrValue]){
			operation = this.model[symOrValue];
			this.currentEvalSymbol = symOrValue;
		}else {
			operation = symOrValue;
			this.currentEvalSymbol = this.op[operation[0]].Name;
		}

		var argsToPass = [];

		//is an input value required?
		if(this.op[operation[0]].RequiresInput
			&& !hasValue(this.inputs[symOrValue])){
			throw 'Input required for ' + symOrValue + ' in order to complete calculations.';
		//if so, retrieve it
		} else if (this.op[operation[0]].RequiresInput) {
			argsToPass.push(this.inputs[symOrValue]);			
		}

		/*evaluate further arguments*/
		var args = [];
		if(operation.length > 1){
			args = operation.slice(1);

			for(var i = 0, l = args.length; i < l; i++){
				var curr = args[i];
				//ignore nulls, undefineds and enums
				if(hasValue(curr)){

					//not to eval
					if(this.op[operation[0]].PassWithoutEval){
						argsToPass.push(curr);
					//or to eval?
					}else{
						argsToPass.push(this.evaluate(curr));
					}
				}
			}
		}

		//last argument is the symbol or value, in case we need
		//to do a look up from the operation		
		argsToPass.push(symOrValue);

		//finally, apply the function
		var f = this.getFunction(operation[0]);
		var toReturn = f.apply(this,argsToPass);

		//if it's part of the expected calculations, add it
		if(this.model[symOrValue] && symOrValue === this.currentTopSymbol){
			//_addToOutput
			_addToOutput(this.output,this.currentTopSymbol,'result',toReturn);
		}

		this.currentEvalSymbol = '';
		return toReturn;

	//case error
	}else{
		throw 'Unknown symbol of ' + symOrValue + ' was passed to evaluator!';
	}

	this.currentEvalSymbol = '';
};

runtimeEngine.prototype.getFunction = function(name){
	return this.op[name].Func;
};

exports.Engine = runtimeEngine;
exports.setReportingLevel = function(level){
	reportingLevel = level;
};
},{"./util":4,"./operations":5}],4:[function(require,module,exports){
(function(){Object.prototype.isObject = true;
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
}

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
			var evalString = func + ' = ' + name + '.' + func + ';'
			toReturn += evalString + '\n';
		}
	}
	
	return toReturn;
};

exports.getArgs = getArgs;
exports.hasValue = _hasValue;
exports.stringHasValue = _stringHasValue;
exports.importModule = _importModule;
})()
},{}],3:[function(require,module,exports){
(function(){var u = require('./util');
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
})()
},{"./util":4,"./operations":5}],5:[function(require,module,exports){
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
		RequiresInput: true,
		Func: function(value,sym){
			return value;
		}
	},
	//enumeration defines an enum
	enumeration: {
		Name: 'enumeration',
		RequiresInput: true,
		Func: function(){

			var args = getArgs(arguments);
			var value = args[0];
			//retrieve the enum array
			var valueSet = this.model[args.last()].slice(1);
			var idx = valueSet.indexOf(value); 

			if(idx < 0){
				throw 'unable to find enumeration value of ' + value + ' for enum ' + sym;
			}
			
			return idx;
		}
	},
	
	//retrieve is used to retrieve the value of an enum
	//PassWithoutEval = true, because otherwise we end up trying to retrieve
	//against a previously determined enumeration value
	//ex. Housing: {op.enum ['own','rent']}
	//Housing: 'own'
	//and {op.retrieve ['rent','Housing']}
	//would end up passing ['rent',0] to retrieve,
	//when we really want ['rent','Housing']...so we don't evaluate the second retrieve
	//argument
	retrieve: {
		Name: 'retrieve',
		PassWithoutEval: true,
		Func: function(value,def){

			var valueSet = this.model[def].slice(1);
			var idx = valueSet.indexOf(value);

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