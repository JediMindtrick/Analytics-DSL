var _getCurrentCell = require('../web/cellNav.js').getCurrentCell;
var row = require('../web/row.js').Row;
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

	this.displayProgram = ko.observable(false);

	this.programNames = ko.observableArray(['New','Load From Text','Program1'/*,'Program2'*/]);
	this.currentProgramName = ko.observable('Program1');
	this.programs = {
		'Program1': program1
	};
	this.paused = false;

	this.isEditingFormula = ko.observable(false);
	this.currentFormula = ko.observable('your formula here');
	this.currentCell = null;

	this.rows = ko.observableArray([]);
	this.programCode = ko.observable('');
	this.currentError = ko.observable('error');

	this.setExample();

	this.initShortcuts();
};

ViewModel.prototype.open = function() {
  this.displayProgram(true);
};


ViewModel.prototype.setExample = function(){
	var _code = program1;

	this.programCode(_code);
	this.loadProgram();
};

ViewModel.prototype.initShortcuts = function(){
	var self = this;
	shortcut.add("Up",function(e) {
		self.handleArrowKey('up',e);
	},{propagate: true});
	shortcut.add("Down",function(e) {
		self.handleArrowKey('down',e);	
	},{propagate: true});
	shortcut.add("Left",function(e) {
		self.handleArrowKey('left',e);
	},{propagate: true});
	shortcut.add("Right",function(e) {
		self.handleArrowKey('right',e);
	},{propagate: true});
	shortcut.add("Enter",function(e){
		if(self.isEditingFormula()){
			return;
		}else{
			if(e && e.preventDefault && !self.isEditingFormula()){
				e.preventDefault();
			}

			self.editFormula();			
		}
	},{propagate: true});
	shortcut.add("Ctrl+Enter",function(){
		var _cell = self.currentCell;
		if(_cell && self.isEditingFormula()){
			self.updateFormula();
			self.isEditingFormula(false);
		}
	},{propagate: false});
};

ViewModel.prototype.updateFormula = function(){
	var self = this;

	var _cell = self.currentCell;

	self.changeFormula(_cell);

	var _cellSelector = '#Row_' + _cell.Row + ' td[name=' + _cell.Col + ']';

	$(_cellSelector).focus();

	self.isEditingFormula(false);

	$(_cellSelector).focus();
};

ViewModel.prototype.handleArrowKey = function(direction,e){
	var self = this;
	if(!self.isEditingFormula()){
		var _oldCell = this.currentCell;
		if(_oldCell){
			$(_oldCell.getSelector()).removeClass('activeCell');
		}
		
		self.navigateNext(direction);
		self.bindFormula(self.currentCell);	
		self.updateError(self.currentCell);

		if(this.currentCell){
			$(this.currentCell.getSelector()).addClass('activeCell');
			$(this.currentCell.getSelector()).focus();
		}
	}

	if(e && e.preventDefault && !self.isEditingFormula()){
		e.preventDefault();
	}
};

ViewModel.prototype.selectCell = function(item,event){
	var self = item.Sheet;
	if(self.currentCell){
			$(self.currentCell.getSelector()).removeClass('activeCell');
		}

	self.currentCell = _getCurrentCell($(event.target));

	self.bindFormula(self.currentCell);	
	self.updateError(self.currentCell);

	if(self.currentCell){
		$(self.currentCell.getSelector()).addClass('activeCell');
	}
};

ViewModel.prototype.changeFormula = function(_cell){
	var _rowSelector = '#Row_' + _cell.Row + ' td[name="Name"]';
	var _currRowName = $(_rowSelector).text();
	var _currRow = this.getRowByName(_currRowName);

	_currRow[_cell.Col](this.currentFormula());	
};

ViewModel.prototype.updateError = function(_ccell){
	var _cell = _ccell;

	if(!_cell){
		return false;
	}
	var _rowSelector = '#Row_' + _cell.Row + ' td[name="Name"]';
	var _currRowName = $(_rowSelector).text();

	var _currRow = this.getRowByName(_currRowName);

	this.currentError('');
	if(_currRow.ErrorInfo && _currRow.ErrorInfo.message){
		this.currentError(_currRow.ErrorInfo.message);
	}
};

ViewModel.prototype.bindFormula = function(_ccell){
	var _cell = _ccell;

	if(!_cell){
		return false;
	}
	var _rowSelector = '#Row_' + _cell.Row + ' td[name="Name"]';
	var _currRowName = $(_rowSelector).text();

	var _currRow = this.getRowByName(_currRowName);
	
	var _cellSelector = '#Row_' + _cell.Row + ' [name=' + _cell.Col + ']';

	this.currentFormula(_currRow[_cell.Col]());

	return true;
};

ViewModel.prototype.editFormula = function(){

	if(this.bindFormula(this.currentCell)){
		this.isEditingFormula(true);
	}
};

var _columnNames = ['Name','Value','Input', 'Result'];
ViewModel.prototype.navigateNext = function(direction){

	var _cell = _getCurrentCell();
	if(!_cell){
		_cell = this.currentCell;
	}

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

	$(selector).focus();
	this.currentCell = _cell;

	if(direction === 'down' || direction === 'up'){
		var _rowHeight = $(selector).outerHeight();

		//how many rows will fit in view?
		var _maxRows = $('.innerb').height() / _rowHeight;
		//how many rows to hide?
		var _hideRows = (_cell.Row + 2) - _maxRows;

		//not sure why an offset of 2 extra rows is required...
		if(direction === 'down' && _cell.Row + 2  >= _maxRows){
			$('.innerb').scrollTop(_hideRows * _rowHeight);

		}else if(direction === 'up'){
			$('.innerb').scrollTop(_hideRows * _rowHeight);

		}
	}
};

ViewModel.prototype.loadProgram = function(){
	this.clearAllRows();
	this.clearErrors();

	if(this.currentProgramName() === 'New'){
		this.programCode('');
		return;
	}else if(this.currentProgramName() === 'Load From Text'){
		//do nothing
	}else{
		//set the programCode
		this.programCode(this.programs[this.currentProgramName()]);
	}

	var _code = this.programCode();
	var _prog = JSON.parse(_code);
	for(var def in _prog){
		if(_prog.hasOwnProperty(def)){

			var nextRow = this.getNextEmptyRow();
			if(nextRow === null){
				this.addRow(def,_prog[def]);
			}else{
				nextRow.Name(def);
				nextRow.Value(_prog[def]);
				nextRow.Input('');
				nextRow.Result('');
			}
		}
	}
};

ViewModel.prototype.clearAllRows = function(){
	var _rows = this.rows();

	this.paused = true;

	for(var i = 0, l = _rows.length; i < l; i++){
		var curr = _rows[i];
		curr.Name('');
		curr.Value('');
		curr.Input('');
		curr.Result('');
	}	

	this.paused = false;
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

ViewModel.prototype.getNextEmptyRow = function(){
	var _rows = this.rows();

	for(var i = 0, l = _rows.length; i < l; i++){
		if(_rows[i].isEmpty()){
			_rows[i].Result('');
			return _rows[i];
		}
	}

	return null;
};

ViewModel.prototype.run = function() {
	if(this.paused){
		return;
	}

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
				_in = eval(curr.Input());
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
			curr.Result(value.result);
			if(value.errors && value.errors.length > 0){
				curr.ErrorInfo.message = value.errors[0].message;
			}
		}
	}
};

ViewModel.prototype.define = function(name,value){
	define(name,eval(value));
};

exports.ViewModel = ViewModel;