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