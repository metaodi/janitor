var google = require('googleapis');
var googleAuth = require('google-auth-library');
var _ = require('underscore');

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var key = require('../google_credentials.json');
var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, null);
var config = require('./config');

exports.nextCalendarEntries = nextCalendarEntries;

function nextCalendarEntries(cal_id, callback) {
      jwtClient.authorize(function(err, tokens) {
        if (err) {
          console.log(err);
          return;
        }
        console.log("Tokens", tokens);
        listEvents(jwtClient, callback, cal_id);
      });
  }
  
  
function listEvents(auth, callback, cal_id) {
    var calendars = config.calendar_list();
    var calendar = google.calendar('v3');
    var calendarDetails;
    calendar.calendarList.list({
        auth: auth
    }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        console.log(response);
        calendarDetails = _.findWhere(response.items, {'id': calendars[cal_id]});
    });
  
    calendar.events.list({
        auth: auth,
        calendarId: calendars[cal_id],
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
        callback(null, events, calendarDetails);
    });
}
