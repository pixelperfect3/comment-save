// global variables
var logging  = true;

////////// HTML5 WEB DB BEGIN //////////////
var database = {};
database.webdb = {};

// comments db
database.webdb.db = null;

// the msg passed in
var currentMsg = null;

// Listener - to listen for any messages sent from the extension.
// Messages are stored in the webdb
try {
	chrome.extension.onConnect.addListener(function(port) {
		// check port name - "comment"
		console.assert(port.name == "comment");
		log("Port2: "+ port.name);
		
		// get the message
		// values:
		// {id: newId, text: this.value, title: document.tile, url: document.URL, time: timestamp});
		port.onMessage.addListener(function(msg) {
			log("Message: " + msg.id + "," + msg.text + "," + msg.title + "," + msg.url + "," + msg.time);
			currentMsg = msg;
			
			// check if tracking is allowed
			var tracking = checkTracking();
			
			// WEBDB STORAGE
			if (tracking == "1") {
				checkFilter(msg.url);
				
				//setTimeout("function(){database.webdb.addComment()}", 200);
				setTimeout(database.webdb.addComment, 200);
				//setTimeout("filter = false;", 200);
			}
		});
	});
} catch(e) {
  log("Error: " + e);
}

// ID REQUEST FROM LOCAL STORAGE //
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		//log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
		if (request.idRequest == "id") {
			// look up id from local storage
			var storageId = getItem("id");
			log("Storage id: " + storageId);
			if (!storageId) { // no key "id" found - create one
				setItem("id", 1);
				storageId = 1;
				
				var newStorage = parseInt(storageId) + 1;
				setItem("id", newStorage);
			}
			else { // increment to the next id
				var newStorage = parseInt(storageId) + 1;
				setItem("id", newStorage);
			}
	
			log("Sending Storage id: " + storageId);
			
			// // send the requested id
			sendResponse({theId: storageId});
		}
		else
			sendResponse({}); // snub them.
	}
);

/**************************************************
	START TIMING METHODS
**************************************************/
// Check if timed deletion is enabled & the user-specified time

var timedDeletionCheck = getItem("deleteCheck");
var deletionTime = getItem("deletionTime");

// Check if timed deletion check has been created or not. If it's not, then create it and set it to false
if (timedDeletionCheck == null) {
	// make it false
	setItem("deleteCheck", "0");
}

// Now start time loop - checks after every minute
checkTimedDeletion();
// whether to delete all the comments or not

// The function to delete all the comments
function alertMsg()
{
	if (getItem("deleteCheck") == "1") { // if it's false or does not exist it will do nothing
		// Has enough time passed?
		// get current time
		var currentTime = (new Date()).getTime();
		
		// Stored time = the time of the comment
		var deletionTime = parseInt(getItem("deletionTime"));
		
		// Go through all the comments
	
		// null check
		if (deletionTime != null) {
			
			// load all the items
			database.webdb.getAllComments(timedDeleteComments);
		}
	}
	
	// loop
	setTimeout(checkTimedDeletion, 1000); // after every 1 second?
}

// tries to delete comments in the specified time
function timedDeleteComments(tx, rs) {
	// get the current time
	var currentTime = parseInt((new Date()).getTime());
	// deletion time
	var deletionTime = parseInt(getItem("deletionTime"));
	
	// for avoiding duplicates
	var idAdded = [];
	
	// last one at the top
	for (var i=rs.rows.length - 1; i >= 0; i--) {
		// render only if comment's length is greater than 1 [TODO] and not duplicate
		var row = rs.rows.item(i);
		if (row.comment.length > 1 && idAdded.indexOf(row.ID) == -1) {
			// parse the date
			var commentTime = parseDate(row.timestamp);

			// delete if enough time has passed
			if (currentTime >= (commentTime + deletionTime)) {
				//alert("Time has passed");
				database.webdb.deleteComment(row.ID);
			}
		
			// add to array
			idAdded.push(row.ID);
		}
	}
}

// checks every minute to see whether to delete the comments or not
function checkTimedDeletion() {
	// change to 60 seconds?
	var t=setTimeout(alertMsg,60000);
}

// function which parses stored data and returns milliseconds
function parseDate(date) {
	// split according to date first
	var splits = date.split(" ");
	var month = splits[0];
	var day   = splits[1];
	var yeartime  = splits[2].split('\n');
	var year = yeartime[0];
	var time  = yeartime[1] + ":00";
	
	var date  = new Date(month + " " + day + ", " + year + " " + time); // format: new Date("October 13, 1975 11:13:00")
	
	
	return parseInt(date.getTime());
}



/**************************************************
	LOCAL STORAGE METHODS START
**************************************************/
// Sets the value for a key
function setItem(key, value) {
	try {
		//log("Inside setItem:" + key + ":" + value);
		window.localStorage.removeItem(key);
		window.localStorage.setItem(key, value);
	}catch(e) {
		log("Error inside setItem");
		log(e);
	}
	//log("Return from setItem" + key + ":" +  value);
}

// Gets the value for a key
function getItem(key) {
	var value;
	log('Get Item:' + key);
	try {
		value = window.localStorage.getItem(key);
	}catch(e) {
		log("Error inside getItem() for key:" + key);
		log(e);
		value = "null";
	}
	log("Returning value: " + value);
	return value;
}

// Clears the local storage values
function clearStrg() {
	log('*** about to clear local storage for databases ***');
	// reset tracking, id
	window.localStorage.setItem("id", 1);
	window.localStorage.setItem("currentID", 1);
	//window.localStorage.clear();
	log('*** cleared ***');
}

// Checks if tracking is enabled or not
function checkTracking() {
	var check = getItem("tracking");
	// if tracking is not enabled create the key
	log("CHECK IS: " + check);
	if (check == null) {
		log("LOCAL STORAGE: got null!");
		setItem("tracking", "1"); // 1 - enabled, 0 - disabled
		return "1";
	}
	else {
		return check;
	}
}

// Checks if context menus are enabled or not
function checkContextMenu() {
	var check = getItem("contextMenu");
	// if tracking is not enabled create the key
	log("CHECK IS: " + check);
	if (check == null) {
		log("LOCAL STORAGE: got null!");
		setItem("contextMenu", "1"); // 1 - enabled, 0 - disabled
		return "1";
	}
	else {
		return check;
	}
}

// Checks if context menus are enabled or not
function checkPositiveFilter() {
	var check = getItem("positiveFilter");
	// if tracking is not enabled create the key
	log("CHECK IS: " + check);
	if (check == null) {
		log("LOCAL STORAGE: got null!");
		setItem("positiveFilter", "0"); // 1 - enabled, 0 - disabled
		return "0";
	}
	else {
		return check;
	}
}

// log function
function log(txt) {
	if(logging) {
		console.log(txt);
	}
}
////////////// LOCAL STORAGE END /////////////////  

/**************************************************
	DATABASE FUNCTIONS
**************************************************/

// open the db
database.webdb.open = function() {
	var dbSize = 5 * 1024 * 1024; // 5MB
	log("Size is " + dbSize);
	try {
		database.webdb.db = openDatabase('Comments', '1.0', 'saves comments', dbSize);
		log(database.webdb.db);
	} catch (e) {
		log(e);
	}
}

// handling error
database.webdb.onError = function(tx, e) {
	log('Something unexpected happened: ' + e.message );
}

// on success
database.webdb.onSuccess = function(tx, r) {
	log('DB opened successfully');
}

// drop table
database.webdb.dropTable = function() {
	// reset id in local storage
	//clearStrg();

	database.webdb.db.transaction(function(tx) {
		tx.executeSql('DROP TABLE filters');
	});
}

// create/open the table
// {id: newId, text: this.value, title: document.tile, url: document.URL, time: timestamp});
database.webdb.createTable = function() {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
			'comment(ID TEXT, comment TEXT, title TEXT, url TEXT, timestamp TEXT)', []); // should use DATETIME for timestamp, ID alternative: ID INTEGER PRIMARY KEY ASC
		});
}

// create filters table
database.webdb.createFiltersTable = function() {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS ' + 
			'filters(ID INTEGER PRIMARY KEY ASC, website TEXT)', []);
		});
}

// GLOBAL Variable to check whether it is already in the table or not
var row = -1; // -1 = no row found

// SQL query to get all the comments
database.webdb.getAllComments = function(renderFunc) {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM comment', [], renderFunc, 
					database.webdb.onError);
	});
}

// gets a comment (if it exists) according to id
// renderFunc = the function callback
database.webdb.getComment = function(renderFunc, id) {
	log('Id in getcomment = ' + id);
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM comment WHERE ID=?', [id], renderFunc, 
																database.webdb.onError);
	});
}

// callback function for checking if a comment exists in the table
function getCommentCB(tx, rs) {
	log('RS Length = ' + rs.rows.length);

	for (var i=0; i < rs.rows.length; i++) {
		log('RS ' + i + ' = ' + rs.rows.item(i));
	}

	if (rs.rows.length == 0) // none found
		row = -1;
	else
		row = rs.rows.item(0);
}

// add data to table
// {id: newId, text: this.value, title: document.tile, url: document.URL, time: timestamp});
database.webdb.addComment = function() {
	// check for filters
	//setTimeout("log(waiting)", 500);
	
	log("Filter IS: " + filterFound);
	log("Positive Filter IS: " + positiveFilter);
	
	if (( (!filterFound  && !positiveFilter) || (filterFound && positiveFilter)) && currentMsg != null) {
		// SQL transaction
		database.webdb.db.transaction(function(tx){
			// check to see if the data already exists or not
			database.webdb.getComment(getCommentCB, currentMsg.id);
			log("Row: " + row);
		
			log("\nLOGGING MESSAGE: " + currentMsg.text);
		
			// update current ID - for popup.html - supposed to show the last edited id
			setItem("currentID", currentMsg.id);
		
			// if it exists, UPDATE otherwise INSERT
			if (row == -1) {
				log("No row found - creating");
				tx.executeSql('INSERT INTO comment(ID, comment, title, url, timestamp) VALUES (?,?,?,?,?)', 
				[currentMsg.id, currentMsg.text, currentMsg.title, currentMsg.url, currentMsg.time],
				database.webdb.onSuccess,
				database.webdb.onError);
			}
			else {
				log("Found Row! - updating");
			
				// Update comment
				tx.executeSql('UPDATE comment SET comment=? WHERE ID=?', 
				[currentMsg.text, currentMsg.id],
				database.webdb.onSuccess,
				database.webdb.onError);
			
				// Update timestamp
				tx.executeSql('UPDATE comment SET timestamp=? WHERE ID=?', 
				[currentMsg.time, currentMsg.id],
				database.webdb.onSuccess,
				database.webdb.onError);
			}
		});
	} // end of if filter == false
}	

// delete row from a table given the id
database.webdb.deleteComment = function(id) {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM comment WHERE ID=?', [id],
			database.webdb.onSuccess, database.webdb.onError);
	});
}	

// Delete all comments
function deleteAllComments() {
	// reset id in local storage
	clearStrg();

	// delete all the comments
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('DELETE FROM comment');
	});
}

// initialization
function initDB() {
	// open the comments db
	database.webdb.open();
	
	//database.webdb.dropTable(); // just to delete the table
	
	// create the comments table
	database.webdb.createTable();

	// create the filters table
	database.webdb.createFiltersTable();

	// Deletion - just to remove everything
	//deleteAll();
}

/**************************************************
	FILTER FUNCTIONS
**************************************************/
var filterFound = false;
var positiveFilter = false;
var website = "";

// add context menus
togglePositiveFilter(getPositiveFilter());

// gets the positive filter variable
function getPositiveFilter() {
	var f = checkPositiveFilter();
	if (f == "1")
		return true;
	else
		return false;
}

// Toggle positive filter
function togglePositiveFilter(toggle) {
	// enable positive filter
	if (toggle == true) {
		setItem("positiveFilter", "1");
		positiveFilter = true;
	}
	else { // disable
		setItem("positiveFilter", "0");
		positiveFilter = false;
	}
}

// adds a filter to the table - gets a url from the textarea
database.webdb.addFilter = function(filter) {
	// SQL transaction
	database.webdb.db.transaction(function(tx){
		tx.executeSql('INSERT INTO filters(website) VALUES (?)', 
		[filter],
		database.webdb.onSuccess,
		database.webdb.onError);
	});
}

// SQL query to get all the filters
database.webdb.getAllFilters = function(renderFunc) {
	database.webdb.db.transaction(function(tx) {
		tx.executeSql('SELECT * FROM filters', [], renderFunc, 
					database.webdb.onError);
	});
}

// Loads all the filters and checks if the website is to be filtered or not
function loadFilters(tx, rs) {
	//alert("Website is: " + website);
	var rowOutput = "";
	var l = rs.rows.length;
	for (var i=0; i < l; i++) {
		var row = rs.rows.item(i);
		log("Filter: " + row.website);
		if (website.indexOf(row.website) != -1) { // filter found
			log("Website blocked!");
			filterFound = true;
			return;
		}
	}
	
	// no filter
	filterFound = false;
	return;
}

// checks whether to filter out this url or not
function checkFilter(url) {
	// split the url
	var splits = url.split('/');
	// the location + hostname
	website = splits[2];
	
	// load all the filters
	database.webdb.getAllFilters(loadFilters);
}

// pause function - used for synchronizing events
function pause(milliseconds) {
	var dt = new Date();
	while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
}

/**************************************************
	CONTEXT MENUS 
**************************************************/

// add context menus
toggleContextMenus(getContextMenu());
								   
// gets the context menu variable
function getContextMenu() {
	var f = checkContextMenu();
	if (f == "1")
		return true;
	else
		return false;
}

// Toggle context menus
// Added December 24 2012
function toggleContextMenus(toggle) {
	// enable context menus
	if (toggle == true) {
		// checkbox for enabling/disabling tracking
		trackingMenu = chrome.contextMenus.create(
			{"title": "Tracking?", "type": "checkbox", "checked": getTracking(), "onclick":onClickTracking});
		
		// option for adding current website to filters
		filterMenu = chrome.contextMenus.create({"title": "Disable tracking on this website", "contexts":["page"],
										   "onclick": addFilterMenu});
										   
		setItem("contextMenu", "1");
	}
	else { // remove
		chrome.contextMenus.removeAll();
		setItem("contextMenu", "0");
	}
}


/**************************************************
	TRACKING
**************************************************/

// gets the tracking variable
function getTracking() {
	var f = checkTracking();
	if (f == "1")
		return true;
	else
		return false;
}

// function which changes tracking based on context menu check
function onClickTracking(info, tab) {
	if (info.checked) 
		setItem("tracking", "1");
	else
		setItem("tracking", "0");
}

// updates tracking menu - [via popup.html]
function updateTrackingMenu(checked) {
	chrome.contextMenus.update(trackingMenu, {"checked": checked});
}

// adds the current website to filters
function addFilterMenu(info, tab) {
	// request location
	chrome.tabs.sendRequest(tab.id, {want: "hostname"}, function(response) {
		hostname = response.hostname;
		
		// break it up according to '.'
		var splits = hostname.split('.');
		var website = splits[splits.length-2] + '.' + splits[splits.length-1];
		//alert("Website: " + website);
		
		// add filter to the database
		database.webdb.addFilter(website);
		
	});
}

// Initialize the database
initDB();

//<!-- END OF FILE-->