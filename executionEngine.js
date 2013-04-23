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