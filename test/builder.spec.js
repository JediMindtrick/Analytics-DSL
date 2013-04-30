var importModule = require('../lib/util.js').importModule;
eval(importModule('../lib/builder.js'));
//note: we can also pass a function like this function(str){eval(str);}
//over and when we eval in the other module, the eval will still execute
//within the scope of the passing module

var options = require('../lib/builder.js').enumeration;
var when = require('../lib/builder.js').cond;
//extra shims...may move up into builder if we like them
String.prototype.equals = String.prototype.eq;
String.prototype.greaterThan = String.prototype.gt;

var e = require('../lib/executionEngine.js');
var Engine = e.Engine;
e.setReportingLevel('');//turn off verbose

describe('builder', function () {

	beforeEach(function () {
		clearAST();
	 });

	afterEach(function () {
   		clearAST();
  	});

    it('has a fairly comprehensive basic test',function(){

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

		var engine = new Engine(getAST());

		var out = engine.execute({	
			MSFT: 50,
			Dow: 12000,
			ReserveBoardMeeting: 'no',
			MSFTEarnings: 1.35,
			DayOfWeek: 'tuesday',	
			WhatDayIsIt: null,
			Position: 'flat',
			Action: null
		});	

		/*{"MSFT":50,"Dow":12000,"ReserveBoardMeeting":1,
		"MSFTEarnings":1.35,"DayOfWeek":1,
		"WhatDayIsIt":3,"Position":2,"Action":0}*/
		expect(out.MSFT).toBe(50);
		expect(out.Dow).toBe(12000);
		expect(out.ReserveBoardMeeting).toBe(1);
		expect(out.MSFTEarnings).toBe(1.35);
		expect(out.DayOfWeek).toBe(1);
		expect(out.WhatDayIsIt).toBe(3);
		expect(out.Position).toBe(2);
		expect(out.Action).toBe(0);
    });
});