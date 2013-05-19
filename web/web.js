require=(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({"../web/cellNav.js":[function(require,module,exports){
module.exports=require('N6sjbn');
},{}],"N6sjbn":[function(require,module,exports){
var _getCurrentCell = function(clicked){
	var el = clicked ? clicked : document.activeElement;
	var _row = $(el).closest('tr').attr('id');
	if(!_row){
		return null;
	}
	_row = _row.replace('Row_','');

	var _col = $(el).closest('[name]').attr('name');

	if(!_col){
		_col = $(el).find(':first-child [name]').attr('name');
	}
	
	return new CellNav(parseInt(_row),_col);
};

var _columnNames = ['Name','Value','Input','Result'];
var CellNav = function(row,col){
	this.Row = row;
	this.Col = col;
};

CellNav.prototype.getSelector = function(){
	var _cellSelector = '#Row_' + this.Row + ' [name=' + this.Col + ']';
	return _cellSelector;
};

CellNav.prototype.up = function(){
	var _r = this.Row - 1 < 0 ? 0 : this.Row - 1;

	return new CellNav(_r, this.Col);
};
CellNav.prototype.down = function () {
	return new CellNav(this.Row + 1,this.Col);
};
CellNav.prototype.left = function(){
	var _r = this.Row;
	var _c = this.Col;
	var _idx = _columnNames.indexOf(this.Col);
	var newIdx = _idx - 1;

	//case we were on the far left
	if(newIdx < 0){
		newIdx = _columnNames.length - 1;
		_r = _r - 1 < 0 ? 0 : _r - 1;		
	}
	var _c = _columnNames[newIdx];
	return new CellNav(_r,_c);
};
CellNav.prototype.right = function(){
	var _r = this.Row;
	var _c = this.Col;
	var _idx = _columnNames.indexOf(this.Col);
	var newIdx = _idx + 1;

	//case we were on the far right
	if (newIdx >= _columnNames.length){
		newIdx = 0;
		_r = _r + 1;		
	}
	var _c = _columnNames[newIdx];
	return new CellNav(_r,_c);
};

exports.getCurrentCell = _getCurrentCell;
},{}],"../web/viewModel.js":[function(require,module,exports){
module.exports=require('bovJgp');
},{}],"bovJgp":[function(require,module,exports){
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
},{"../web/cellNav.js":"N6sjbn","../web/row.js":"zJe2fn","../lib/executionEngine.js":1,"../lib/builder.js":2,"../lib/util.js":3}],"../web/row.js":[function(require,module,exports){
module.exports=require('zJe2fn');
},{}],"zJe2fn":[function(require,module,exports){
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
},{"../lib/util.js":3}],3:[function(require,module,exports){
(function(){Function.prototype.isFunction = true;
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
};

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
			var evalString = func + ' = ' + name + '.' + func + ';';
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
},{}],2:[function(require,module,exports){
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
},{"./util":3,"./operations":4}],1:[function(require,module,exports){
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

				if(invalidOutputValue(this.output[this.currentTopSymbol].result)){
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
	if(this.output[symOrValue] && this.output[symOrValue].result){
		this.currentEvalSymbol = '';
		return this.output[symOrValue].result;
	
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
		if(this.op[operation[0]].RequiresInput && 
			!hasValue(this.inputs[symOrValue])){
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
			_addToOutput(this.currentTopSymbol,this.output,'result',toReturn);
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
},{"./util":3,"./operations":4}],4:[function(require,module,exports){
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
})()
},{"./util":3}]},{},[])
;