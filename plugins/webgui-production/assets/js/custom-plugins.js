/*
 *
 */
$( document ).ready(function() {
	socket.on('pluginlistupdate', function(msg) {
		console.log('We received a message: ' + msg);
	});
	
	socket.on('askVersion', function() {
		BootstrapDialog.alert('I want banana!');
	});
});


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
		BootstrapDialog.confirm({
			title: 'Please confirm',
			message: 'Are you sure you want to remove the selected plugins?', 
			type: BootstrapDialog.TYPE_WARNING,
			callback: function(result) {
				if (result) {
					plugin_emit(id, checkboxes, action);
				}
			}
        });
	} else if (action === 'publish') {
		var curVersion, value;
		
		var message = 'Please give the new version numbers for each plugin:<br>';
		
		checkboxes.each(function( index ) {
			if (this.checked) {
				
				console.log(this);
				
				curVersion = jQuery(this).attr("version");
				value = jQuery(this).val();
				
				message += value + '<input type="text" class="form-control" name="' + value + '" placeholder="Current version: ' + curVersion +'">';
				
			}
		});
		
/* 		var message = 'Please give the new version numbers for each plugin:<br>' +
		'<input type="text" class="form-control" name="test1">' +
			'<input type="text" class="form-control" name="test2">'; */
		
		BootstrapDialog.show({
			title: 'Publish plugins',
			message: message,
			buttons: [
				{
					label: 'Save',
					action: function(dialogRef) {
						var fruit = dialogRef.getModalBody().find('input.form-control').each(function() {
							console.log(jQuery(this).val());
						});
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
	} else {
		plugin_emit(id, checkboxes, action);
	}
	
}


/*
 * Do the actual emitting to the server
 *
 * @param {array} list
 * @param {string} action
 */
function plugin_emit(id, checkboxes, action) {
	var list = [];
	
	//add all the checked checkboxes to an array
	checkboxes.each(function( index ) {
		if (this.checked) {
			this.checked = false;
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

	socket.emit('pluginaction', {list: list, action: action});
}