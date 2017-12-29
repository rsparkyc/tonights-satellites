const Alexa = require('alexa-sdk');
var request = require("request-promise");


//Replace with your app ID (OPTIONAL).  You can find this value at the top of your skill's page on http://developer.amazon.com.
//Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = undefined;

let currentEvent;

exports.handler = function(event, context, callback) {
	console.log(JSON.stringify(event));

	currentEvent = event;
	
    var alexa = Alexa.handler(event, context);
    alexa.appId = event.context.System.application.applicationId;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

const handlers = {
    'LaunchRequest': function () {
        this.emit('GetNewFactIntent');
    },
    'GetNewFactIntent': function () {

        this.response.speak("hello");
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = "You're haven's dad, aren't you.  You don't need help.";
        const reprompt = "What do you want to do?";

        this.response.speak(speechOutput).listen(reprompt);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak("Cancel Message");
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak("Stop Message");
        this.emit(':responseReady');
    },
    'ListSatellites': function() {

    	let url = "https://api.amazonalexa.com/v1/devices/" +
    	currentEvent.context.System.device.deviceId + 
    	"/settings/address";
    	console.log("building request to " + url);
    	
    	request.get({ 
        	    url: url, 
        	    json: true,
        	    headers: {
                    Authorization: 'Bearer '+ currentEvent.context.System.apiAccessToken
                }
        	}).then((result) => {
        	    console.log("Google API key: " + process.env.googleApiKey);
        	    let googleUrl = "https://maps.googleapis.com/maps/api/geocode/json?address="+
        	    encodeURI(
        	        getPart(result.addressLine1) +
        	        getPart(result.addressLine2) +
        	        getPart(result.addressLine3) +
    	            getPart(result.districtOrCounty) +
                    getPart(result.stateOrRegion) +
                    getPart(result.city) +
                    getPart(result.countryCode) +
                    getPart(result.postalCode)) +
    
        	    "&key=" + process.env.googleApiKey;
        	    console.log("Making request to " + googleUrl);
        	    return request.get({url:googleUrl, json:true});
        	    
        	}).then((result) => {
        	    console.log("Google Response: " + JSON.stringify(result));
        	    let lat = result.results[0].geometry.location.lat;
        	    let lng = result.results[0].geometry.location.lng;
        	    
				this.response.speak("Your coordinates are " + lat + " by " + lng);
			    	this.emit(':responseReady');
			}).catch((err) => {
				this.response.speak("There was a problem.  Please make sure " +
				"you've configured this skill to have access to your address. " +
				err);
				console.log(`An error occurred - ${err}`);
				    	this.emit(':responseReady');

			});

    	
    	//this.response.speak(JSON.stringify(currentEvent.context.System.device));
    	//this.response.speak("You want me to list satellites for tonight, " +
    	//"but I don't know how to do that yet.  I guess you're out of luck.");
    	//this.emit(':responseReady');
    },
    'Unhandled': function () {
        this.response.speak("The moon. probably");
        this.emit(':responseReady');
    },

};

function getPart(part){
    if (part) {
        return part + " ";
    }
    return "";
}