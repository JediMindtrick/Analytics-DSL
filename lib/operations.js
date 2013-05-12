/* 
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
				throw 'unable to find enumeration value of ' + value + ' for enum';
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
				return _true;
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