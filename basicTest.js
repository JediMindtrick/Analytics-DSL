var op = require('./operations').op;
var Engine = require('./executionEngine').Engine;

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

var model = {
	MSFT: ['identity'],
	Dow: ['identity'],
	ReserveBoardMeeting: ['enumeration','yes','no'],
	EarningsRelease: ['enumeration',"yes","no"],
	MSFTEarnings: ['identity'],
	DayOfWeek: ['enumeration',"monday","tuesday","wednesday","thursday","friday","saturday","sunday"],
	WhatDayIsIt: ['retrieve','thursday','DayOfWeek'],
	Position: ['enumeration',"long","short","flat"],
	Actions: ['enumeration',"buy","sell","none"],
	Action: ['cond', 
				['eq','Position',['retrieve','flat','Position']],
					['retrieve','buy','Actions'],
				['retrieve','none','Actions']]
};

//this would be the runtime data that is input into the actual application
var testInput = {
	MSFT: 50,
	Dow: 12000,
	ReserveBoardMeeting: 'no',
	MSFTEarnings: 1.35,
	DayOfWeek: 'tuesday',
	Position: 'long',
	Action: null,
	WhatDayIsIt: null
};

var engine = new Engine(model);
var out = engine.execute(testInput);
console.log(JSON.stringify(out));