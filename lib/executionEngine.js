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

		this.errorHandler(toLog);
	}
};

runtimeEngine.prototype.execute = function(inputs){
	this.inputs = inputs;
	this.output = {};

	for(var sym in inputs){

		if(inputs.hasOwnProperty(sym)){

			//for tracing and helpful error messages
			this.currentTopSymbol = sym;

			if(!this.model[this.currentTopSymbol]){
				this.logError("Unhandled input identifier " + this.currentTopSymbol);
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
			throw 'Input required for ' + symOrValue + ' in order to complete calcualtions.';
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
		if(this.model[symOrValue]){
			this.output[symOrValue] = toReturn;
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