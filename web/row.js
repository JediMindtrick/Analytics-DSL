var _util = require('../lib/util.js');
var stringHasValue = _util.stringHasValue;
var hasValue = _util.hasValue;

var row = function(parent){
	var self = this;

	this.Id = null;
	this.Sheet = parent;
	this.ErrorInfo = {};
	this.IsError = ko.observable(false);
	this.ErrorCondition = ko.observable('');
	this.Name = ko.observable('');
	this.Value = ko.observable('');
	this.FormattedValue = ko.computed(function(){
		var _val = self.Value();

		if(_val.length >= 50){
			_val = _val.substring(0,49) + '...';
		}

		return _val;
	});
	this.Input = ko.observable('');
	this.Result = ko.observable('');
};

row.prototype.getDefinition = function(){
	var toReturn = null;

	if(stringHasValue(this.Name().trim())){
		toReturn = {
			Name: this.Name(),
			RawCode: 'identity'
		};
	}

	if(toReturn && stringHasValue(this.Value())){
		toReturn.RawCode = this.Value();
	}

	return toReturn;
};

row.prototype.readyForEval = function(){
	var _def = this.getDefinition();
	var _input = this.Input();

	if(hasValue(_def)){
		if(this.isInput()){
			return this.hasInput();
		}

		return true;
	};

	return true;
};

row.prototype.hasInput = function(){
	var _input = this.Input();

	return stringHasValue(_input);
};

row.prototype.isInput = function(){
	var _def = this.getDefinition();
	if(hasValue(_def)
		&& (_def.RawCode === 'identity'
			//starts with
			|| _def.RawCode.startsWith('['))
		){
		return true;
	}

	return false;
};

row.prototype.makeActiveFormula = function(){
	this.Sheet.editFormula();
};

row.prototype.setCurrentError = function(){
	this.Sheet.currentError('');
	if(this.ErrorInfo && this.ErrorInfo.message){
		this.Sheet.currentError(this.ErrorInfo.message);
	}
};

row.prototype.isEmpty = function(){

	var hasVal = stringHasValue(this.Name())
		|| stringHasValue(this.Value())
		|| stringHasValue(this.Input());

	return !hasVal;
};

row.prototype.bindFormula = function(){
	return this.Sheet.bindFormula();
};

row.prototype.selectCell = function(item,event){
	this.setCurrentError();
	return this.Sheet.selectCell(item,event);
};

exports.Row = row;