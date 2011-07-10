
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


// gets the exact url for facebook posts
function getFacebookUrl(element) {
	// get the parent form first
	var form = $(element).closest("form").get();
	
	// now get the 'span' class 'uiStreamSource'
	var theSpan = $(form).find('span.uiStreamSource');
	// now get the one 'a' object in the span
	var link = $(theSpan).find('a');
	
	alert("FORM ID: " + form.id + "\nA:" + link.href);
	//return "something";
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
	
	// check disqus
	if (location.hostname.indexOf('.disqus.com') != -1) {
  		// Extract the textarea (there must be exactly one)
  		var commentBox = document.querySelector('#comment');
  		
		if (commentBox) {
			$('#comment').live('keypress', function() {
				//var characterCode = event.charCode;
		
				//var actualkey=String.fromCharCode(characterCode);
  				//alert('Yay! ' + this.innerText + actualkey); // Works!
				
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
					alert("ERROR: " + e);
				}
			
				// DON'T CHANGE THE NAME
				var idSet = 0;
				
				// try to parse the id into an int
				var intId = parseInt(this.tabIndex);
				if (intId != 0) { // 0 is the default value for tab index on most sites
					idSet = 1;
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
				//alert('value is: ' + this.value);
				// request new id if value was empty [and didnt use backspace or delete]
				if (this.innerText.length == 1 && (event.keyCode != 8) && (event.keyCode != 46)) {
					idSet = 0;
					//alert('requesting new id');
				}
				
				// request id from background.html if not already set
				if (idSet == 0) {
					chrome.extension.sendRequest({idRequest: "id"}, function(response) {
						requestedID = response.theId;
						idSet = 1;
						
						this.tabIndex = requestedID;
					});
				}
				
				if (requestedID && idSet == 1) {
					this.tabIndex = requestedID;
				}
				else if (idSet == 0)
					return;
			
				// actual value:
				var val = this.value + actualkey;
				// send the message if there is something to send - charcode check is for facebook 'enter' issue
				if (val === '' || val === "" || val.length == 0 || val.charCodeAt(0) == 0) {// val.length == 1 
				
					//alert("Invalid val");
					return;
				}
				else {
				//alert("Val2 is: " + val + ", charCode: " + val.charCodeAt(0));
				
				// get the timestamp
				var timestamp = getTimestamp();
				
				try {
					port.postMessage({id: this.tabIndex, text: val, title: iTitle, url: theURL, time: timestamp});
				} catch(e) {
					alert("There was an error: " + e);
				}
				}
				
				
			});
    		// Inject some text!
    		//commentBox.innerText = 'Google Chrome Injected!';
  		}
	}
		
	//alert('Found formArea: ' + formArea);
	// check if a disqus textarea exists
	/*newDisqus = $("#comment");
	formArea = $("#dsq-form-area");
	if (formArea.length != 0) {
		$('iframe').ready(function() {
			// get all the iframes
			iframes = document.getElementsByTagName('iframe');
			alert('iLength: ' + iframes.length);
			for (var i = 0; i < iframes.length; i++) { 
				frame = iframes[i];
				alert('IFrame: ' + frame.id); // Works!!
				
   				//newDisqus = i.contents().find('#comment');//$("#comment");
				dom = frame.contentWindow.document
				newDisqus = dom.getElementById('comment');
				alert('NewDisqus: ' + newDisqus.length);
				if (newDisqus.length != 0) {
					alert('Found NewDisqus!');
				}
  			} 
			
			/*for(i in iframes) {
				alert('Iframe: ' + i.contentDocument);
				dom = i.contentDocument;
				newDisqus = dom.getElementById('#comment');
				//newDisqus = i.contents().find('#comment');//$("#comment");
				alert('NewDisqus: ' + newDisqus.length);
				if (newDisqus.length != 0) {
					alert('Found NewDisqus!');
				}
			}*/
		//});
		/*alert('NewDisqus ' + formArea.length);//newDisqus.length);
		newDisqus.change( function(event) {
			alert('Comment: ' + this.innerHTML);
		});
	}*/

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
			alert("ERROR: " + e);
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
		//alert('value is: ' + this.value);
		// request new id if value was empty [and didnt use backspace or delete]
		if (this.value.length == 1 && (event.keyCode != 8) && (event.keyCode != 46)) {
			idSet = 0;
			//alert('requesting new id');
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
		
		
		if (requestedID && idSet == 1) {
			//this.tabIndex = requestedID;
			this.setAttribute("data-cs", requestedID);
		}
		else if (idSet == 0)
			return;
	
		// actual value:
		var val = this.value + actualkey;
		// send the message if there is something to send - charcode check is for facebook 'enter' issue
		if (val === '' || val === "" || val.length == 0 || val.charCodeAt(0) == 0) {// val.length == 1 
		
			//alert("Invalid val");
			return;
		}
		else {
		//alert("Val2 is: " + val + ", charCode: " + val.charCodeAt(0));
		
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
					//alert("Found something!");
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
			alert("There was an error: " + e);
		}
		}
	});
   
 });
