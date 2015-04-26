/*
 *
 */
$( document ).ready(function() {
	socket.on('pluginlistupdate', function(msg) {
		console.log(msg);
		
		var id = msg.id;
		
		updateTableRows(id, msg);
	});
	
	socket.on('askVersion', function() {
		//BootstrapDialog.alert('I want banana!');
	});
});


/*
 * Update the notification area
 *
 * @param {string} id
 * @param {object} options
 *		status {string} (required)
 *		message {string}
 */
function updateTableRows(id, options) {
	var status = options.status;
	var message = options.message;
	var action = options.action;
	
	var element = $( '.notification-' + id);
		
	if (status === 'start') {
		element.each(function() {
			$(this).children('input').attr("disabled", true);
			$(this).children('div').html('<i class="fa fa-spinner fa-spin" title="' + message + '"></i>');
		});
	} else if (status === 'done') {
		//Loop through all the elements with the specified id on all the tabs
		element.each(function() {
			
			$(this).children('input').removeAttr("disabled");
			$(this).children('div').html('<i class="fa fa-check" title="' + message + '"></i>');
			
			//Check what to do with each action
			switch(action) {
				case 'activate':
					
					switch($(this).closest('div').attr('id')) {
						case 'inactive':	
							//Move from deactivated tab to activated tab
							moveBetweenTable($(this).parent(), $('#inactive'), $('#active'));
							break;
					}
					
					break;
				
				case 'deactivate':
					
					switch($(this).closest('div').attr('id')) {
						case 'active':	
							//Move from activated tab to deactivated tab
							moveBetweenTable($(this).parent(), $('#active'), $('#inactive'));
							break;
					}
					
					break;
					
				case 'update':
					switch($(this).closest('div').attr('id')) {
						case 'update':	
							//Remove from update tab
							$(this).parent().remove();
							break;
					}
					
					break;
					
				case 'remove':
					$(this).parent().remove();
					break;
			}
		});
	} else if (status === 'failed') {
		element.each(function() {
			$(this).children('input').removeAttr("disabled");
			$(this).children('div').html('<i class="fa fa-exclamation" title="' + message + '"></i>');
		});
	}
}


/*
 * Move a row between two tables
 *
 * @param {jQuery} row: element to be replaced
 * @param {jQuery} tbl1: from table
 * @param {jQuery} tbl2: to table
 */
function moveBetweenTable(row, tbl1, tbl2) {
	
	//Get the tbody of the tables
	var table1 = tbl1.children().find('tbody');
	var table2 = tbl2.children().find('tbody');
	
	//Get the row ids
	var oldID = tbl1.attr('row');
	var newID = tbl2.attr('row');
	
	//To make sure that the checkboxes work, replace the row-* with the new ID
	row.children().find('input').removeClass('row-' + oldID).addClass('row-' + newID);
	
	//Clone the row to the other table
	row.clone().prependTo(table2);
	row.remove();
	
	sortTable(table2);
}


/*
 * Sort the table 
 *
 * @param {jQuery} tbl
 * @param {string} sort: asc or desc (default: asc)
 */
function sortTable(tbl, sort) {
	if (typeof sort === 'undefined') sort = 'asc';
	
	var rows = $('tr', tbl); 
	
	rows.sort(function(a, b) {

        var keyA = $('td:nth-child(2)',a).text();
        var keyB = $('td:nth-child(2)',b).text();

        if (sort === 'asc') {
            return (keyA > keyB) ? 1 : 0;     // A bigger than B, sorting ascending
        } else {
            return (keyA < keyB) ? 1 : 0;     // B bigger than A, sorting descending
        }
    });

	rows.each(function(index, row){
		console.log(row);
		tbl.append(row);                    // append rows after sort
	});
}


/*
 * If the select all checkbox is checked, all checkboxes on that page will be
 * checked or unchecked, depending on the current state.$
 *
 * @param {object} ele: element object
 */
function checkAll(ele) {
	var id = 'row-' + ele.id;
	var checkboxes = document.getElementsByClassName(id);

	if (ele.checked) {
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].type == 'checkbox') {
				checkboxes[i].checked = true;
			}
		}
	} else {
		for (var i = 0; i < checkboxes.length; i++) {
			if (checkboxes[i].type == 'checkbox') {
				checkboxes[i].checked = false;
			}
		}
	}
}


/*
 * Will send all the selected plugins with a socket to the server. 
 * Fired on click of the submit button.
 *
 * @param {int} id
 */
function plugin_send(id) {
	var actionEle = jQuery( '#action-' + id );
	var action = actionEle.val();
	
	//if no action is choosen, return and bounce the action dropdown
	if (action === null) {
		$('.action-button').effect("bounce");
		return;
	} 
	
	var checkboxes = jQuery('.row-' + id);
	
	if (action === 'remove') {
		plugin_remove(id, checkboxes);
	} else if (action === 'publish') {
		plugin_publish(id, checkboxes);
	} else {
		plugin_emit(id, checkboxes, action);
	}
	
}


/*
 * Confirmation window before removing plugins
 */
function plugin_remove(id, checkboxes) {
	BootstrapDialog.confirm({
		title: 'Please confirm',
		message: 'Are you sure you want to remove the selected plugins?', 
		type: BootstrapDialog.TYPE_WARNING,
		callback: function(result) {
			if (result) {
				plugin_emit(id, checkboxes, 'remove');
			}
		}
	});
}


/*
 * Dialog for asking the version numbers
 */
function plugin_publish(id, checkboxes) {
	var curVersion, value, name;
		
	var message = 'Please give the new version numbers for each plugin:<br>';
	
	message += '<form class="form-horizontal">';

	//Check each checkbox, and if checked add a new form field.
	checkboxes.each(function( index ) {
		if (this.checked) {

			curVersion = jQuery(this).attr("version");
			value = jQuery(this).val();
			name = jQuery(this).attr("name");

			message += '' +
				'<div class="form-group"> '+
					'<label for="' + value + '" class="col-sm-4 control-label">' + name +'</label>' +
					'<div class="col-sm-6">' +
						'<input type="text" class="form-control version" id="' + value + '" placeholder="Current version: ' + curVersion + '">' + 
					'</div>' +
				'</div>';
		}
	});
	
	message += '</form>';

	//Show the bootstrap dialog window
	BootstrapDialog.show({
		title: 'Publish plugins',
		message: message,
		closable: true,
		closeByBackdrop: false,
		buttons: [
			{
				label: 'Save',
				action: function(dialogRef) {
					var plugins = [];
					var options = {};
					var tmp, row;
					
					var versions = dialogRef.getModalBody().find('input.version').each(function() {
						row = jQuery(this);
						tmp = {id: row.attr('id'), version: row.val()};
						plugins.push(tmp);
					});
					
					options.plugins = plugins;
					
					plugin_emit(id, checkboxes, 'publish', options);
					dialogRef.close();
				}
			},
			{
				label: 'Cancel',
				action: function(dialogRef) {
					dialogRef.close();
				}
			}
		]
	});
}


/*
 * Do the actual emitting to the server
 *
 * @param {array} list
 * @param {string} action
 * @param {object} options
 */
function plugin_emit(id, checkboxes, action, options) {
	var list = [];
	
	//add all the checked checkboxes to an array
	checkboxes.each(function( index ) {
		if (this.checked) {
			this.checked = false;
			
			var pluginID = $(this).val();
			
			updateTableRows(pluginID, {status: 'start'});
			
			//Disable the checkboxes and add a spinner icon
			
			list.push(this.value);
		}
	});
	
	var all = document.getElementById(id);
	if (all.type == 'checkbox') {
		all.checked = false;
	}
	
	//return if list length is 0
	if (list.length === 0) {
		return;
	}
	
	if (typeof options === 'undefined') {
		options = {};
	}
	
	options.list = list;
	options.action = action;
	
	socket.emit('pluginaction', options);
}