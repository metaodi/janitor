var google = require('googleapis');
var googleAuth = require('google-auth-library');
var _ = require('underscore');
var Async = require('async');
var Moment = require('moment-timezone');

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var key = require('../google_credentials.json');
var jwtClient = new google.auth.JWT(key.client_email, null, key.private_key, SCOPES, null);
var config = require('./config');

exports.nextCalendarEntries = nextCalendarEntries;
exports.currentCalendarEntry = currentCalendarEntry;

function nextCalendarEntries(cal_id, callback) {
    jwtClient.authorize(function(err, tokens) {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Tokens", tokens);
        listEvents(callback, jwtClient, cal_id);
    });
}

function currentCalendarEntry(cal_id, callback) {
    jwtClient.authorize(function(err, tokens) {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Tokens", tokens);
        listEvents(
            function(err, events, calendarInfo) {
                if (err) {
                    callback(err);
                    return;
                }

                // ignore events that are displayed as free
                events = _.reject(events, function(event) {
                    return ('transparency' in event && event.transparency === 'transparent'); 
                });

                var currentEvent = _.find(events, function(event) {
                    var startDate = Moment(event.start.dateTime);
                    var endDate = Moment(event.end.dateTime);
                    
                    event.isCurrent = Moment().isBetween(startDate, endDate);
                    event.soonBusy = startDate.isBefore(Moment().add(60, 'm'));
                    return (event.isCurrent || event.soonBusy);
                });
                if (_.isUndefined(currentEvent) && !_.isEmpty(events)) {
                    currentEvent = _.first(events);
                }
                callback(null, currentEvent, calendarInfo);
            },
            jwtClient,
            cal_id,
            10,
            Moment().toISOString()
        );
    });
}
  
  
function listEvents(callback, auth, cal_id, results, min_date, max_date) {
    var calendars = config.calendar_list();
    var calendar = google.calendar('v3');
    var maxResults = results || 10;
    var timeMin = min_date || (new Date()).toISOString();

    var calArgs = {
        auth: auth,
        calendarId: calendars[cal_id],
        timeMin: timeMin,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
    };

    if (max_date) {
        calArgs['timeMax'] = max_date;
    }

    Async.series({
        calendar: function(cb) {
            calendar.calendarList.list({
                auth: auth
            }, function(err, response) {
                if (err) {
                  console.log('The API returned an error: ' + err);
                  cb(err);
                  return;
                }
                var calendarDetails = _.findWhere(response.items, {'id': calendars[cal_id]});
                cb(null, calendarDetails);
            });
        },
        events: function(cb) {
            calendar.events.list(calArgs, function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    cb(err);
                    return;
                }
                var events = response.items;
                if (events.length === 0) {
                    console.log('No events found.');
                } else {
                    console.log('Found events:');
                    for (var i = 0; i < events.length; i++) {
                        var event = events[i];
                        var start = event.start.dateTime || event.start.date;
                        console.log('%s - %s', start, event.summary);
                    }
                }
                cb(null, events);
            });
        }
    },
    function(err, results) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, results.events, results.calendar);
    });
}
