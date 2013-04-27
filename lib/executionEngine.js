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
	this.currentSymbol = '';
};

runtimeEngine.prototype.execute = function(inputs){
	this.inputs = inputs;
	this.output = {};

	for(var sym in inputs){

		if(inputs.hasOwnProperty(sym)){
			if(!this.model[sym]){
				throw "unhandled input identifier " + sym;
			}

			this.currentSymbol = sym;

			this.evaluate(sym);

			this.currentSymbol = '';

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

runtimeEngine.prototype.getFunction = function(name){
	return this.op[name].Func;
};

exports.Engine = runtimeEngine;
exports.setReportingLevel = function(level){
	reportingLevel = level;
};