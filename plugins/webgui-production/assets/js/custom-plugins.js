/*
 *
 */
$( document ).ready(function() {
	socket.on('pluginlistupdate', function(msg) {
		console.log('We received a message: ' + msg);
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
	var list = [];
	var actionEle = jQuery( '#action-' + id );
	var action = actionEle.val();
	
	//if no action is choosen, return and bounce the action dropdown
	if (action === null) {
		$('.action-button').effect("bounce");
		return;
	}
		
	var checkboxes = jQuery('.row-' + id);

	var all = document.getElementById(id);
	if (all.type == 'checkbox') {
		all.checked = false;
	}

	//add all the checked checkboxes to an array
	checkboxes.each(function( index ) {
		if (this.checked) {
			this.checked = false;
			list.push(this.value);
		}
	});
	
	//return if list length is 0
	if (list.length === 0) {
		return;
	}

	socket.emit('pluginaction', {list: list, action: action});
}