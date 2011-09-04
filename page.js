/*** 
	page.js
	The main Javascript file which runs on every page
    Detects any textareas/divs to listen to and records the text.
	Sends a message to the background process after getting the id.
	 
	Author: Shayan Javed (shayanj at gmail.com)
	Version 0.4 
	 
	***/


// Month array
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* Returns the current time */
function getTimestamp() {
	// date
	var currentTime = new Date();
    var month = currentTime.getMonth();// + 1;
    var day = currentTime.getDate();
    var year = currentTime.getFullYear();
    //var date = month + "/" + day + "/" + year;
	var date = months[month] + " " + day + " " + year;
	
	// time
	var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    if (minutes < 10){
      minutes = "0" + minutes;
    }
    var time = hours + ":" + minutes;
	
	// return timestamp
	date = date + '\n' + time;
	return date;
	//return date + "\n" + time;
}
  
// id set or not?
var idSet = 0;
var idReset = false;

// id # in case one is not assigned to the textarea
var id = 1;
// Open the port to the extension
var port = chrome.extension.connect({name: "comment"});

// callback function (for divs)
function sendMessage(obj, event) {
	// iframe test - FOR DISQUS
	var iTitle = document.title;
	var theURL = document.URL; 
	
	try {
		if (window != window.top) {
			if (location.hostname.indexOf('.disqus.com') != -1) { // disqus comment check
				iTitle = getDisqusTitle(theURL);//"Disqus Comment";
			}
			else {
				iTitle = "Disqus Comment";
			}
			
			// the url is the referrer
			var theURL = document.referrer;
		}
	}
	catch (e) {
		//alert("ERROR: " + e);
	}

	// DON'T CHANGE THE NAME
	var idSet = 0;
	
	// try to get the data attribute
	var data;
	try {
		data = obj.getAttribute("data-cs");//this.dataset.cs;//data-cs;
		idSet = 1;
	} catch (error) {
		idSet = 0;
	}
	
	// which key was pressed?
	var characterCode = event.charCode;
	if (characterCode == undefined) {
		characterCode = event.keyCode;
	}
	
	var actualkey=String.fromCharCode(characterCode);
	
	// get the id - if it already exists good otherwise give it one 

	// GET ID from local storage
	var requestedID;

	// request new id if value was empty [and didnt use backspace or delete]
	if (obj.innerText.length == 1 && (event.keyCode != 8) && (event.keyCode != 46)) {
		idSet = 0;
	}
	
	// request id from background.html if not already set
	if (idSet == 0) {
		chrome.extension.sendRequest({idRequest: "id"}, function(response) {
			requestedID = response.theId;
			idSet = 1;
			
			obj.setAttribute("data-cs", requestedID);
		});
	}
	
	// a check to see if we have to go through or not
	if (requestedID && idSet == 1) {
		//this.tabIndex = requestedID;
		obj.setAttribute("data-cs", requestedID);
	}
	else if (idSet == 0)
		return;

	// actual value:
	var val = obj.innerText + actualkey;
	
	// send the message if there is something to send - charcode check is for facebook 'enter' issue
	divID= obj.getAttribute("data-cs");
	if (val === '' || val === "" || val.length == 0 || val.charCodeAt(0) == 0 || divID == null) {// val.length == 1 
		return;
	}
	else {
		/** Sending Message **/
		
		// get the timestamp
		var timestamp = getTimestamp();
		
		// send the message
		try {
			port.postMessage({id: divID, text: val, title: iTitle, url: theURL, time: timestamp});
		} catch(e) {
			//("There was an error: " + e);
		}
	}
}

// function tries to extract a reasonable title from the Disqus URL
function getDisqusTitle(url) {
	// first split it based on slashes
	try {
		
		var splits = url.split('/');
		// before disqus.com
		var website = splits[2].split('.')[0];
		//alert("Splits[1] : " + splits[2]);
		// the page thread
		var thread = splits[4];
		// replace all '_' with spaces
		var t2 = thread.replace("_", " ");
		
		var title = website + " - " + t2;
		return title;
		
	} catch (e) {
		// do nothing for now
		return "Disqus comment";
	}

}

// listen for requests from background.html for hostname (for adding to filters)
chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse) {
		if (request.want == "hostname")
			sendResponse({hostname: location.hostname});
		else
			sendResponse({}); // snub them.
	});


// response function for getting an id

// Instead of using onload, use JQuery:
$(document).ready(function(){
	
	// google+ check:
	//.r-q-i-h-Oc doesn't work anymore (Sept 4)
	$(".m-n-f-ba-rd").live('keyup', function(event) { // .v-J-n-m-Gc does not work anymore... (August 27th) 
		// send the message
		sendMessage(this, event);
	});
	
	// check disqus
	if (location.hostname.indexOf('.disqus.com') != -1) {
  		// Extract the textarea (there must be exactly one)
  		var commentBox = document.querySelector('#comment');
  		
		if (commentBox) {
			
			$('#comment').live('keypress', function(event) {
				// call the function - pass in the event and the object
				sendMessage(this, event);
				
			});
    		
  		}
	}

	// attach function to all textareas
	$("textarea").live('keyup', function(event) {
		// iframe test - FOR DISQUS
		var iTitle = document.title;
		var theURL = document.URL; 
	
		try {
			if (window != window.top) {
				if (location.hostname.indexOf('.disqus.com') != -1) { // disqus comment check
					iTitle = getDisqusTitle(theURL);//"Disqus Comment";
				}
				else {
					iTitle = "Other Comment";
				}
				
				// the url is the referrer
				var theURL = document.referrer;
			}
		}
		catch (e) {
			//alert("ERROR: " + e);
		}
	
		// DON'T CHANGE THE NAME
		var idSet = 0;
		
		// try to get the data attribute
		var data;
		try {
			data = this.getAttribute("data-cs");//this.dataset.cs;//data-cs;
			idSet = 1;
		} catch (error) {
			idSet = 0;
		}
		
		// which key was pressed?
		var characterCode = event.charCode;
    	if (characterCode == undefined) {
    		characterCode = event.keyCode;
    	}
		
		var actualkey=String.fromCharCode(characterCode);

    	// get the id - if it already exists good otherwise give it one 

		// GET ID from local storage
		var requestedID;

		// request new id if value was empty [and didnt use backspace or delete]
		if (this.value.length == 1 && (event.keyCode != 8) && (event.keyCode != 46)) {
			idSet = 0;
		}
		
		var theTextbox = this;
		
		// request id from background.html if not already set
		if (idSet == 0) {
			chrome.extension.sendRequest({idRequest: "id"}, function(response) {
  				requestedID = response.theId;
				idSet = 1;
				
				theTextbox.setAttribute("data-cs", requestedID);
			});
		}
		
		// a check to see if we have to go through or not
		if (requestedID && idSet == 1) {
			//this.tabIndex = requestedID;
			this.setAttribute("data-cs", requestedID);
		}
		else if (idSet == 0)
			return;
	
		// actual value:
		var val = this.value + actualkey;
		
		data = this.getAttribute("data-cs");
		// send the message if there is something to send - charcode check is for facebook 'enter' issue
		if (val === '' || val === "" || val.length == 0 || val.charCodeAt(0) == 0 || data == null) {// val.length == 1 
			return;
		}
		else {
			/** Sending Message **/
			
			// get the timestamp
			var timestamp = getTimestamp();
			
			// check URL for Facebook - get exact URL
			if (location.hostname.indexOf('facebook.com') != -1) { // on the main page of facebook
				try { // get the parent form first
					var form = $(this).closest("form").get();
					
					// get first 'a'
					var link = $(form).find('a')[0];
					
					// get the title -- FIND CLOSEST DIV INSTEAD FIRST and then use span
					try {
						// on main facebook page
						var div = $(this).closest("div.UIImageBlock_Content.UIImageBlock_MED_Content").get();
						
						var span = $(div).find("span.messageBody")[0];
						iTitle = iTitle + " - " + span.innerText;
					} catch (e) {
						// on profile page
						var span = $(form).find('span.UIIntentionalStory_Time')[0];
						link = $(span).children('a')[0];
					}
					
					// set the proper link
					if (link!= null)
						theURL = link.href;
				} catch (e) {
					//alert("Found1");
				}
			}
			
			// send the message
			try {
				port.postMessage({id: this.getAttribute("data-cs"), text: val, title: iTitle, url: theURL, time: timestamp});
			} catch(e) {
				//("There was an error: " + e);
			}
		}
	});
   
 });
