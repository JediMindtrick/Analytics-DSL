var _util = require('../lib/util.js');
var stringHasValue = _util.stringHasValue;
var hasValue = _util.hasValue;

var b = require('../lib/builder.js');
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

var Engine = require('../lib/executionEngine.js').Engine;

var ViewModel = function(){
	var self = this;

	this.rows = ko.observableArray([]);
	this.programCode = ko.observable('');
	this.currentError = ko.observable('error');

	this.setExample();

	this.initShortcuts();
};

ViewModel.prototype.setExample = function(){
	var _code = '{"MSFT":"","Dow":"","ReserveBoardMeeting":"[\\"yes\\",\\"no\\"]","EarningsRelease":"[\\"yes\\",\\"no\\"]","Earnings":"","DayOfWeek":"[\\"monday\\",\\"tuesday\\",\\"wednesday\\",\\"thursday\\",\\"friday\\",\\"saturday\\",\\"sunday\\"]","Position":"[\\"long\\",\\"short\\",\\"flat\\"]","AccountBalance":"","Actions":"[\\"buy\\",\\"sell\\",\\"none\\"]","Action":"when(\\n\\thasPosition(\\"flat\\"), getActions(\\"buy\\"),\\n\\tgetActions(\\"none\\")\\n)"}';

	this.programCode(_code);
	this.loadProgram();
};

ViewModel.prototype.initShortcuts = function(){
	var self = this;
	shortcut.add("Up",function() {
		self.navigateNext('up');
	});
	shortcut.add("Down",function() {
		self.navigateNext('down');
	});
	shortcut.add("Left",function() {
		self.navigateNext('left');
	});
	shortcut.add("Right",function() {
		self.navigateNext('right');
	});
};

var _columnNames = ['Name','Value','Input'];
ViewModel.prototype.navigateNext = function(direction){

	var _cell = _getCurrentCell();

	if(direction === 'up'){
		_cell = _cell.up();
	}else if(direction === 'down'){
		_cell = _cell.down();
	}else if(direction === 'left'){
		_cell = _cell.left();
	}else if(direction === 'right'){
		_cell = _cell.right();
	}

	if(_cell.Row >= _rowCount){
		this.addRow();
	}

	//go to the next cell
	var selector = '#Row_' + _cell.Row + ' [name=' + _cell.Col + ']';

	//bump if selected cell is disabled
	if($(selector).is(':disabled')
		&& (direction === 'up' || direction === 'down')){
			_cell = _cell.left();
	}

	selector = '#Row_' + _cell.Row + ' [name=' + _cell.Col + ']';

	$(selector).focus();
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

var _rowCount = 0;
ViewModel.prototype.addRow = function(name,value,input) {
	var self = this;
	var toAdd = new row(self);
	toAdd.Id = _rowCount;
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
	_rowCount++;
};

ViewModel.prototype.run = function() {
	var self = this;

	// body...
	this.clearErrors();
	clearAST();
	this.updateProgram();
	var engine = new Engine(getAST());
	engine.subscribeToError(function(err){
		console.log(JSON.stringify(err));
		var r = self.getRowByName(err.topSymbol);
		if(r){
			r.ErrorInfo = err;
			r.IsError(true);
		}else{
			alert('Something has gone very wrong!');
		}
	});
	var inputs = this.getInputs();
	var outputs = {};

 	try{
		outputs = engine.execute(inputs);
	}catch(ex){
		console.log(ex);
	}

	this.mapOutputs(outputs);
};

ViewModel.prototype.getRowByName = function(name){
	var self = this;

	var _rows = self.rows();
	for(var i = 0, l = _rows.length; i < l; i++){
		if(_rows[i].Name() === name){
			return _rows[i];
		}
	}

	return null;
};

ViewModel.prototype.clearErrors = function(){
	var self = this;

	this.currentError('');

	var _rows = self.rows();
	for(var i = 0, l = _rows.length; i < l; i++){
		_rows[i].ErrorInfo = {};
		_rows[i].IsError(false);
	}
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
	this.programCode(_code);
};

ViewModel.prototype.getInputs = function() {
	var toReturn = {};

	var _rows = this.rows();
	for(var i = 0, l = _rows.length; i < l; i++){
		var curr = _rows[i];

		if( stringHasValue(curr.Name().trim())){
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
			_mapValue(_rows,property,outputs[property].result);
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

var row = function(parent){
	this.Id = null;
	this.Sheet = parent;
	this.ErrorInfo = {};
	this.IsError = ko.observable(false);
	this.ErrorCondition = ko.observable('');
	this.Name = ko.observable('');
	this.Value = ko.observable('');
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

row.prototype.setCurrentError = function(name){

	this.Sheet.currentError('');
	if(this.ErrorInfo && this.ErrorInfo.message){
		this.Sheet.currentError(this.ErrorInfo.message);
	}
};