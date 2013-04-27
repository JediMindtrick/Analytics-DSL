var u = require('./util');
var getArgs = u.getArgs;
var hasValue = u.hasValue;
var op = require('./operations').op;
var Engine = require('./executionEngine').Engine;

var log = function(msg){
	console.log(msg);
};

op.enumeration = {
	Name: 'enumeration',
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
};

op.retrieve = {
	Name: 'retrieve',
	Func: function(value,def){

		var valueSet = this.model[def].slice(1);
		var idx = valueSet.indexOf(value);

		if(idx < 0){
			throw 'unable to retrieve enumeration value of ' + value + ' for enum ' + def;
		}
		
		return idx;
	}
};

Engine.prototype.evaluate = function(symOrValue){

	//already been determined/calculated
	if(this.output[symOrValue]){
		return this.output[symOrValue];
	
	//case primitive value, strings are used for enums
	}else if(symOrValue.isNumber || (!this.model[symOrValue] && symOrValue.isString)){
		return symOrValue;
	
	//operation
	}else if(symOrValue.isArray || this.model[symOrValue]){

		var operation = null;

		//grab the operation, which includes an operator as well as arguments
		if(this.model[symOrValue]){
			operation = this.model[symOrValue];
		}else {
			operation = symOrValue;
		}

		var argsToPass = [];

		//pass input value first, if we have one
		if(hasValue(this.inputs[symOrValue])){
			argsToPass.push(this.inputs[symOrValue]);			
		}

		/*evaluate further arguments*/
		var args = [];
		if(operation.length > 1){
			args = operation.slice(1);
		}

		//retrieve is handled differently, because otherwise we end up trying to retrieve
		//against a previously determined enumeration value
		//ex. Housing: {op.enum ['own','rent']}
		//Housing: 'own'
		//and {op.retrieve ['rent','Housing']}
		//would end up passing ['rent',0] to retrieve,
		//when we really want ['rent','Housing']...so we don't evaluate the second retrieve
		//argument
		if(operation[0] === 'retrieve'){
			argsToPass.push(args[0]);
			argsToPass.push(args[1]);
		}else{
			for(var i = 0, l = args.length; i < l; i++){
				var curr = args[i];
				//ignore nulls, undefineds and enums
				if(hasValue(curr)){
					var toPush = this.evaluate(curr);

					argsToPass.push(toPush);
				}
			}
		}
		
		argsToPass.push(symOrValue);

		//finally, apply the function
		var f = this.getFunction(operation[0]);
		var toReturn = f.apply(this,argsToPass); //operation.operator.Func.apply(this,argsToPass);

		//if it's part of the expected calculations, add it
		if(this.model[symOrValue]){
			this.output[symOrValue] = toReturn;
		}

		return toReturn;

	//case error
	}else{
		throw 'unknown symbol of ' + symOrValue + ' was passed!';
	}
};

Engine.prototype.getFunction = function(name){
	return this.op[name].Func;
};

//these would be the rules that are built based off of the user input/configuration
var model = {
	MSFT: ['identity'],
	Dow: ['identity'],
	ReserveBoardMeeting: ['enumeration','yes','no'],
	EarningsRelease: ['enumeration',"yes","no"],
	MSFTEarnings: ['identity'],
	DayOfWeek: ['enumeration',"monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
	WhatDayIsIt: ['retrieve','thursday','DayOfWeek'],
	Position: ['enumeration',"long","short","flat"],
	Actions: ['enumeration',"buy","sell","none"],
	Action: ['cond', 
				['eq','Position',['retrieve','flat','Position']],
					['retrieve','buy','Actions'],
				['retrieve','none','Actions']]
};

//this would be the runtime data that is input into the actual application
var testInput = {
	MSFT: 50,
	Dow: 12000,
	ReserveBoardMeeting: 'no',
	MSFTEarnings: 1.35,
	DayOfWeek: 'tuesday',
	Position: 'long',
	Action: null,
	WhatDayIsIt: null
};

var engine = new Engine(model);
var out = engine.execute(testInput);
console.log(JSON.stringify(out));