var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var key = require('../google_credentials.json');
var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, null);

exports.nextCalendarEntries = nextCalendarEntries;

function nextCalendarEntries(callback) {
      jwtClient.authorize(function(err, tokens) {
        if (err) {
          console.log(err);
          return;
        }
        console.log("Tokens", tokens);
        listEvents(jwtClient, callback);
      });
  }
  
  
function listEvents(auth, callback) {
    var calendar = google.calendar('v3');
    calendar.calendarList.list({
        auth: auth
    }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        console.log(response);
    });
  
    var cal_ids = {
        'odi': 'stefan.oderbolz@liip.ch',
        'jazz': 'liip.ch_2c864d2ipj657bu5j3e544qg80@group.calendar.google.com',
        'massage_zh': 'liip.ch_k7tumoa3nol4nf1n5878vom3b4@group.calendar.google.com',
        'events_internal': 'liip.ch_0esp4v21fsgm8gtv3bmcis7ghc@group.calendar.google.com',
        'tesla': 'liip.ch_2d38393334393236382d383738@resource.calendar.google.com',
        'ada': 'liip.ch_2d3737333137363735383336@resource.calendar.google.com',
        'turing': 'liip.ch_2d313635313838322d373932@resource.calendar.google.com',
        'arena_zh': 'liip.ch_38353937383339302d313434@resource.calendar.google.com'
    };
  
    calendar.events.list({
        auth: auth,
        calendarId: cal_ids['massage_zh'],
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime'
    }, function(err, response) {
        if (err) {
            console.log('The API returned an error: ' + err);
            callback(err);
            return;
        }
        var events = response.items;
        if (events.length === 0) {
            console.log('No upcoming events found.');
        } else {
            console.log('Upcoming 10 events:');
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                var start = event.start.dateTime || event.start.date;
                console.log('%s - %s', start, event.summary);
            }
        }
        callback(null, events);
    });
}
