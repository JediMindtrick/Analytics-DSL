var b = require('../lib/builder');
var define = b.define;
var getAST = b.getAST;
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

var e = require('../lib/executionEngine');
var Engine = e.Engine;
e.setReportingLevel('');//turn off verbose


define('MSFT');
define('Dow');
define('ReserveBoardMeeting',['yes','no']);
define('EarningsRelease',['yes','no']);
define('MSFTEarnings');
define('DayOfWeek',['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
define('WhatDayIsIt','retrieve','thursday','DayOfWeek');
define('Position',['long','short','flat']);
define('Actions',['buy','sell','none']);
define('Action',
	when(
		hasPosition('flat'), getActions('buy'),
		getActions('none')
	)
);

//this would be the runtime data that is input into the actual application
var testInput = {	
	MSFT: 50,
	Dow: 12000,
	ReserveBoardMeeting: 'no',
	MSFTEarnings: 1.35,
	DayOfWeek: 'tuesday',	
	WhatDayIsIt: null,
	Position: 'flat',
	Action: null
};

var engine = new Engine(getAST());
var out = engine.execute(testInput);
console.log(JSON.stringify(out));

/*this is what the results look like:
{"MSFT":50,"Dow":12000,"ReserveBoardMeeting":1,"MSFTEarnings":1.35,"DayOfWeek":1,"Position":2,"Action":0}
*/