var Engine = require('./executionEngine.js').Engine;
var util = require('./util.js');
var builder = require('./builder.js');
var fs = require('fs');

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

var program = fs.readFileSync('./one.analytics','utf-8');
var _code = JSON.parse(program);

// body...
builder.clearAST();

for(var def in _code){
	if(_code.hasOwnProperty(def)){
		builder.define(def,eval(_code[def]));
	}
}

if(builder.getAST()['MSFT']){
	console.log('successfully built program');
}

//this would be the runtime data that is input into the actual application
var testInput = {
	MSFT: 50,
	Dow: 12000,
	ReserveBoardMeeting: 'no',
	MSFTEarnings: 1.35,
	DayOfWeek: 'tuesday',
	Position: 'flat',
	Action: null
};

var engine = new Engine(builder.getAST());
var inputs = testInput;
var outputs = engine.execute(inputs);

console.log(JSON.stringify(outputs));

console.log('done');