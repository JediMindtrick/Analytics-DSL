var _util = require('./util.js');
var stringHasValue = _util.stringHasValue;
var hasValue = _util.hasValue;

var b = require('./builder.js');
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

var Engine = require('./executionEngine.js').Engine;

var ViewModel = function(){
	var self = this;

	this.rows = ko.observableArray([]);
	this.programCode = ko.observable('');

	this.removeRow = function() {
		if(confirm('Are you sure you wish to remove this row?')){
        	self.rows.remove(this);
        	self.run();
    	}
    };

	this.setExample();
};

ViewModel.prototype.setExample = function(){
	var _code = '{"MSFT":"","Dow":"","ReserveBoardMeeting":"[\\"yes\\",\\"no\\"]","EarningsRelease":"[\\"yes\\",\\"no\\"]","Earnings":"","DayOfWeek":"[\\"monday\\",\\"tuesday\\",\\"wednesday\\",\\"thursday\\",\\"friday\\",\\"saturday\\",\\"sunday\\"]","Position":"[\\"long\\",\\"short\\",\\"flat\\"]","AccountBalance":"","Actions":"[\\"buy\\",\\"sell\\",\\"none\\"]","Action":"when(\\n\\thasPosition(\\"flat\\"), getActions(\\"buy\\"),\\n\\tgetActions(\\"none\\")\\n)"}';

	this.programCode(_code);
	this.loadProgram();
};

ViewModel.prototype.loadProgram = function(){
	var _code = this.programCode();
	var _prog = JSON.parse(_code);
	for(var def in _prog){
		if(_prog.hasOwnProperty(def)){
			this.addRow(def,_prog[def]);
		}
	}
};

ViewModel.prototype.addRow = function(name,value,input) {
	var self = this;
	var toAdd = new row();
	if(typeof name !== 'undefined' && name.isString){
		toAdd.Name(name);
	}
	if(typeof value !== 'undefined' && value.isString){
		toAdd.Value(value);
	}
	if(typeof input !== 'undefined' && input.isString){
		toAdd.Input(input);
	}


	toAdd.Name.subscribe(function(){
		if(toAdd.readyForEval()){
			self.run();
		}
	});
	toAdd.Value.subscribe(function(){

		var _def = toAdd.getDefinition();
		if(hasValue(_def) && !toAdd.isInput()){
			toAdd.Input('');
		}

		if(toAdd.readyForEval()){
			self.run();
		}
	});
	toAdd.Input.subscribe(function(){
		if(toAdd.readyForEval()){
			self.run();
		}
	});
	

	this.rows.push(toAdd);
};

ViewModel.prototype.run = function() {
	// body...
	clearAST();
	this.updateProgram();
	var engine = new Engine(getAST());
	var inputs = this.getInputs();
	var outputs = engine.execute(inputs);
	this.mapOutputs(outputs);
};

ViewModel.prototype.updateProgram = function(){
	var program = {};
	var _code = "{";

	var _rows = this.rows();
	for(var i = 0, l = _rows.length; i < l; i++){
		var _def = _rows[i].getDefinition();
		if(hasValue(_def)){			

			if(_def.RawCode === 'identity'){
				_code += JSON.stringify(_def.Name) + ':' + JSON.stringify('');//				program[_def.Name] = '';
			}else if(_def.RawCode.startsWith('[')){		
				var _rh = _def.RawCode.replace(/"/g,'\\\\"');
				_rh = _rh.replace(/\\n/g,' ');
				_rh = _rh.replace(/\\t/g,' ');
				_code += JSON.stringify(_def.Name) + ':"' + _rh + '"';
			}else{
				var _rh = _def.RawCode.replace(/"/g,'\\\\"');
				_rh = _rh.replace(/\n/g,'\\\\n');
				_rh = _rh.replace(/\t/g,'\\\\t');
				_code += JSON.stringify(_def.Name) + ':"' + _rh + '"';
			}
			if(i !== _rows.length - 1){
				_code += ',';
			}

			this.define(_def.Name,_def.RawCode);
		}
	}

	_code += "}";
//	var _code = JSON.stringify(program);
	//replace \" with \\"
//	_code = _code.replace(/\\"/g,'\\\\"');
	this.programCode(_code);
};

ViewModel.prototype.getInputs = function() {
	var toReturn = {};

	var _rows = this.rows();
	for(var i = 0, l = _rows.length; i < l; i++){
		var curr = _rows[i];

		if(curr.readyForEval()){
			var _in = curr.Input();
			if(_in && _in !== ''){
				_in = JSON.parse(curr.Input());
			}else{
				_in = null;
			}
			toReturn[curr.Name()] = _in;
		}
	}

	return toReturn;
};

ViewModel.prototype.mapOutputs = function(outputs){
	console.log(JSON.stringify(outputs));

	var _rows = this.rows();
	
	for(var property in outputs){
		if(outputs.hasOwnProperty(property)){
			_mapValue(_rows,property,outputs[property]);
		}
	}
	
};

var _mapValue = function(rows,name,value){
	for(var i = 0, l = rows.length; i < l; i++){
		var curr = rows[i];
		if(curr.Name() === name){
			curr.Result(value);
		}
	}
};

ViewModel.prototype.define = function(name,value){
	define(name,eval(value));
};

var row = function(){
	this.Name = ko.observable('');
	this.Value = ko.observable('');
	this.Input = ko.observable('');
	this.Result = ko.observable('');
};

row.prototype.getDefinition = function(){
	var toReturn = null;

	if(stringHasValue(this.Name())){
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