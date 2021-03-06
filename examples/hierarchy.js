var grid;

var TaskNameFormatter = function(row, cell, value, columnDef, dataContext) {
	value = value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	var spacer = "<span style='display:inline-block;height:1px;width:" + (15 * dataContext["indent"]) + "px'></span>";
	var idx = dataView.getIdxById(dataContext.id);
	if (data[idx + 1] && data[idx + 1].indent > data[idx].indent) {
		if (dataContext._collapsed) {
			return spacer + " <span class='toggle expand'>+</span>&nbsp;" + value;
		} else {
			return spacer + " <span class='toggle collapse'>-</span>&nbsp;" + value;
		}
	} else {
		return spacer + " <span class='toggle'></span>&nbsp;" + value;
	}
};

var columns2 = [{
	id: "finish",
	name: "Finish",
	field: "finish",
	grid: 0,
	format: {
		type: 'datetime',
		to: 'MM/DD',
	},
	minWidth: 160
}, {
	id: "title",
	name: "Title",
	field: "title",
	width: 220,
	grid: 0,
	cssClass: "cell-title",
	formatter: TaskNameFormatter
}, {
	id: "title",
	name: "Title",
	grid: 0,
	field: "title",
	width: 120
}, {
	id: "duration",
	name: "Duration",
	field: "duration",
	fieldOptions: [
		"duration",
		"finish"
	],
	header: {
		menu: {
			items: [{
				text: 'Duration',
				value: "duration",
				command: 'change-menu'
			}, {
				text: 'Start',
				value: "start",
				command: 'change-menu'
			}]
		}
	},
	minWidth: 100
}, {
	id: "start",
	name: "Start",
	field: "start",
	minWidth: 120
}, {
	id: "effort-driven",
	name: "Effort Driven",
	width: 80,
	minWidth: 120,
	maxWidth: 220,
	cssClass: "cell-effort-driven",
	field: "effortDriven"
}];

// Get the item column value using a custom 'fieldIdx' column param
var getItemColumnValue = function(item, column) {
	if (!_.isEmpty(column.fieldOptions)) {}
	//console.log(item, column.fieldOptions);
	var values = item[column.field];
	if (column.fieldIdx !== undefined) {
		return values && values[column.fieldIdx];
	} else {
		return values;
	}
}

var options = {
	frozenColumn: true,
	enableColumnReorder: true,
	enableAddRow: true,
	formatterFactory: Guriddo.FormatterFactory,
	syncColumnCellResize: true,
	forceFitColumns: false,
	dataItemColumnValueExtractor: getItemColumnValue
};

var searchString = "";

function myFilter(item) {
	if (searchString != "" && item["title"].indexOf(searchString) == -1) {
		return false;
	}

	if (item.parent != null) {
		var parent = data[item.parent];

		while (parent) {
			if (parent._collapsed || (searchString != "" && parent["title"].indexOf(searchString) == -1)) {
				return false;
			}
			parent = data[parent.parent];
		}
	}

	return true;
}

var data = [];
var indent = 0;
var parents = [];

// prepare the data
for (var i = 0; i < 200; i++) {
	var d = (data[i] = {});
	var parent;

	if (Math.random() > 0.8 && i > 0) {
		indent++;
		parents.push(i - 1);
	} else if (Math.random() < 0.3 && indent > 0) {
		indent--;
		parents.pop();
	}

	if (parents.length > 0) {
		parent = parents[parents.length - 1];
	} else {
		parent = null;
	}

	d["id"] = "id_" + i;
	d["indent"] = indent;
	d["parent"] = parent;
	d["title"] = "Task " + i;
	d["duration"] = "5 days";
	d["start"] = "01/01/2009";
	d["finish"] = "01/05/2009";
	d["effortDriven"] = (i % 5 == 0);
}

// initialize the model
dataView = new Slick.Data.DataView({
	inlineFilters: true
});
dataView.beginUpdate();
dataView.setItems(data);
dataView.setFilter(myFilter);
dataView.endUpdate();

//grid = new Guriddo.WithFrozen("#test-grid", data, columns, options);

// initialize the grid
window.dataView = dataView;

grid = new Guriddo.WithFrozen("#test-grid", dataView, columns2, options);

grid.gridFrozen.onCellChange.subscribe(function(e, args) {
	dataView.updateItem(args.item.id, args.item);
});
grid.gridFrozen.onClick.subscribe(function(e, args) {
	if ($(e.target).hasClass("toggle")) {
		var item = dataView.getItem(args.row);
		if (item) {
			if (!item._collapsed) {
				item._collapsed = true;
			} else {
				item._collapsed = false;
			}
			dataView.updateItem(item.id, item);
		}
		e.stopImmediatePropagation();
	}
});

grid.autosizeColumns();
$(window).on('resize', _.debounce(function(ev) {
	grid.autosizeColumns();
}, 100));
// wire up model events to drive the grid
dataView.onRowCountChanged.subscribe(function(e, args) {
	grid.updateRowCount();
	grid.render();
});

dataView.onRowsChanged.subscribe(function(e, args) {
	grid.invalidateRows(args.rows);
	grid.render();
});

var headerMenuPlugin = new Slick.Plugins.SelectHeader({});

headerMenuPlugin.onBeforeMenuShow.subscribe(function(e, args) {
	var menu = args.menu;

	// We can add or modify the menu here, or cancel it by returning false.
	var i = menu.items.length;
	menu.items.push({
		title: "Menu item " + i,
		command: "item" + i
	});
});

headerMenuPlugin.onCommand.subscribe(function(e, args) {
	if (args.command === 'change-menu') {
		var hey = grid.gridMain.getColumns();
		hey[1].field = args.$selected.val();
		grid.gridMain.setColumns(hey);
	}
});

grid.gridMain.registerPlugin(headerMenuPlugin);

window.grid = grid;