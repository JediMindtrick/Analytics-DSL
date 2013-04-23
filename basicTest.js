var op = require('./operations').op;
var Engine = require('./executionEngine').Engine;

//these would be the rules that are built based off of the user input/configuration
var model = {
	MSFT: {
		operator: op.identity,
		args:[]
	},
	Dow: {
		operator: op.identity,
		args:[]
	},
	ReserveBoardMeeting: {
		operator: op.enumeration,
		args:["yes","no"]
	},
	EarningsRelease: {
		operator: op.enumeration,
		args:["yes","no"]
	},
	MSFTEarnings: {
		operator: op.identity,
		args:[]
	},
	DayOfWeek: {
		operator: op.enumeration,
		args:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
	},
	Position: {
		operator: op.enumeration,
		args:["long","short","flat"]
	},
	Actions: {
		operator: op.enumeration,
		args:["buy","sell","none"]
	},
	Action: {
		operator: op.cond,
		args:[
			{ operator: op.eq,
				args:["Position",
					{ 	operator: op.retrieve,
						args:["flat","Position"]
					}
				]
			},
				{ operator: op.retrieve,
					args: ["buy","Actions"]
				},
			{ operator: op.retrieve,
				args:["none","Actions"]
			}
		]
	}
};

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

var engine = new Engine(model);
var out = engine.execute(testInput);
console.log(JSON.stringify(out));