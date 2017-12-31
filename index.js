const Alexa = require('alexa-sdk');
var request = require("request-promise");

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
        this.response.speak("Launch Request");
        this.emit('ListSatellites');
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
    	currentEvent.context.System.device.deviceId +  "/settings/address";
    	console.log("building request to " + url);
    	request.get({ 
        	    url: url, 
        	    json: true,
        	    headers: {
                    Authorization: 'Bearer '+ currentEvent.context.System.apiAccessToken
                },
                simple: false
        	}).then((result) => {
        	    console.log("Result of device address call: " + JSON.stringify(result));
        	    if (!result.postalCode && !result.addressLine1) {
        	        console.warn("Could not get address, default to my address");
        	        result.addressLine1 = "369 Eagle Rock Drive";
        	        result.city="Acworth";
        	        result.stateOrRegion="Georgia";
        	        result.countryCode="USA";
        	        result.postalCode="30101";
        	    }
        	    let googleUrl = "https://maps.googleapis.com/maps/api/geocode/json?address=" +
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
        	    return {lat:lat,lng:lng};
        	}).then((coords) => {
        	    let haUrl = "http://www.heavens-above.com/AllSats.aspx?lat=" + coords.lat + "&lng=" + coords.lngls;
        	}).then((haResult) => {
				//let speechOutput = "Your coordinates are " + coords.lat  + " by " + coords.lng;
				let cardTitle = "Tonight's Satellites";
				//let cardContent = `[${coords.lat}, ${coords.lng}]`;
				var imageObj = {
                    smallImageUrl: 'https://www.heavens-above.com/PassSkyChart2.ashx?passID=32384&size=480&lat=34.0638&lng=-84.7688&loc=369+Eagle+Rock+Dr%2c+Acworth%2c+GA+30101%2c+USA&alt=283&tz=EST&showUnlit=false',
                    largeImageUrl: 'https://www.heavens-above.com/PassSkyChart2.ashx?passID=32384&size=800&lat=34.0638&lng=-84.7688&loc=369+Eagle+Rock+Dr%2c+Acworth%2c+GA+30101%2c+USA&alt=283&tz=EST&showUnlit=false'
                };
                
                /*
				var imageObj = {
                    smallImageUrl: 'https://imgs.xkcd.com/comics/standards.png',
                    largeImageUrl: 'https://imgs.xkcd.com/comics/standards.png',
                };
                */
    				
		    	//this.emit(':responseReady');
		    	this.emit(':tellWithCard', speechOutput, cardTitle, cardContent, imageObj);

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