var os = require('os');
var Request = require('superagent');
var XRegExp = require('xregexp');
var Async = require('async');
var Moment = require('moment');
var _ = require('underscore');

var config = require('./config');
var format = require('./format');
var cal = require('./cal');

exports.shutdown = shutdown;
exports.nextCollection = nextCollection;
exports.todayCollection = todayCollection;
exports.nextConnection = nextConnection;
exports.nextCalendarEntries = nextCalendarEntries;
exports.freeRooms = freeRooms;
exports.stationBoard = stationBoard;
exports.hello = hello;
exports.uptime = uptime;
exports.list = list;
exports.didNotUnderstand = didNotUnderstand;

function shutdown(bot, message) {
    bot.startConversation(message,function(err, convo) {
        convo.ask('Are you sure you want me to shutdown?',[
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    },3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
}

function nextCollection(bot, message) {
    var zip = config.office_zip();
    var matches = XRegExp.exec(message.text, XRegExp('next.*in (?<zip>\\d{4})', 'i'));
    if (matches) {
        zip = matches.zip;
    }

    // today in YYYY-MM-DD format
    var today = new Date().toJSON().slice(0, 10);
    Request
    .get('http://openerz.herokuapp.com/api/calendar?start=' + today + '&zip=' + zip + '&sort=date:asc&limit=5')
    .end(function(err, res){
        var collections = '';
        _.each(res.body.result, function(col) {
            collections += format.colEntry(col, "date");
        });
        if (collections) {
            bot.reply(message, ':recycle: Next collections in ' + zip + ': :recycle:' + "\n" + collections);
        } else {
            bot.reply(message, ':recycle: No collection found for ZIP ' + zip + ' :recycle:');
        }
    });
}

function todayCollection(bot, message) {
    // today in YYYY-MM-DD format
    var today = new Date().toJSON().slice(0, 10);
    Request
    .get('http://openerz.herokuapp.com/api/calendar?start=' + today + '&end=' + today + '&sort=zip:asc')
    .end(function(err, res){
        var collections = '';
        _.each(res.body.result, function(col) {
            collections += format.colEntry(col);
        });
        if (collections) {
            bot.reply(message,':recycle: All collections today: :recycle:' + "\n" + collections);
        } else {
            bot.reply(message, ':recycle: No collections today :recycle:');
        }
    });
}

function stationBoard(bot, message, stationName) {
    var station = stationName || config.office_station();
    var matches = XRegExp.exec(message.text, XRegExp('board (of |from )?(?<station>.*)', 'i'));
    if (matches) {
        station = matches.station.trim();
    }

    Request
    .get('http://transport.opendata.ch/v1/stationboard?station=' + encodeURIComponent(station) + '&limit=5')
    .end(function(err, res){
        var connections = '';
        _.each(res.body.stationboard, function(conn) {
            connections += format.stationEntry(conn);
        });
        if (connections) {
            bot.reply(message, ':station: Next connections at ' + res.body.station.name + ' :station:' + "\n" + connections);
        } else {
            bot.reply(message, ':station: No connections found :station:');
        }
    });
}

function nextConnection(bot, message) {
    var fromStation = '';
    var toStation = '';
    var matches = XRegExp.exec(message.text, XRegExp('^next conn\\w* (from (?<from>.*?))? ?(to (?<to>.*))?$', 'i'));
    if (matches) {
        fromStation = matches.from ? matches.from.trim() : config.office_station();
        toStation = matches.to ? matches.to.trim() : '';
    }

    if (toStation) {
        Request
        .get('http://transport.opendata.ch/v1/connections?from=' + encodeURIComponent(fromStation) + '&to=' + encodeURIComponent(toStation)  + '&limit=3')
        .end(function(err, res){
            var connections = '';
            _.each(res.body.connections, function(conn) {
                connections += format.connEntry(conn);
            });
            if (connections) {
                bot.reply(message, ':station: Next connections from ' + res.body.from.name + ' to ' + res.body.to.name + ' :station:' + "\n" + connections);
            } else {
                bot.reply(message, ':station: No connection found found :station:');
            }
        });
    } else {
        stationBoard(bot, message, fromStation);
    }
}

function nextCalendarEntries(bot, message) {
    var matches = XRegExp.exec(message.text, XRegExp('((?<tesla>nikola|tesla)|(?<turing>alan|turing)|(?<ada>ada|lovelace)|(?<arena>arena)|(?<burns>ursula|burns)|(?<zuse>konrad|zuse)|(?<jazz>jazz)|(?<massage>massage))', 'i'));

    var calendars = [];
    if (matches) {
        var keys = Object.keys(matches);
        calendars = _.filter(Object.keys(matches), function (key) {
            return ! _.isEmpty(matches[key]) && ! key.match(/^(\d+|input)$/);
        });
    } else {
        var msg = 'Available calendars:' + "\n";
        msg += "- tesla\n";
        msg += "- turing\n";
        msg += "- ada\n";
        msg += "- arena\n";
        msg += "- burns\n";
        msg += "- zuse\n";
        msg += "- massage\n";
        msg += "- jazz\n";
        msg += "To query a calendar use _cal[endar] turing_, to check available rooms use _free [rooms]_";
        bot.reply(message, msg);
        return;
    }

    cal.nextCalendarEntries(calendars[0], function(err, events, calendar) {
        if (err) {
            bot.reply(message, "Error: " + err);
            return;
        }
        var msg;
        if (_.isEmpty(events)) {
            msg = 'No upcoming events found.';
        } else {
            msg = 'Upcoming 10 events in ' + calendar.summary + ":\n";
            _.each(events, function(event) {
                msg += format.calendarEntry(event);
            });
        }
        bot.reply(message, msg);
    });
}

function freeRooms(bot, message) {
    var rooms = config.meeting_rooms();

    var msg = '';

    Async.each(rooms, function(room, callback) {
        cal.currentCalendarEntry(room, function(err, event, calendar) {
            if (err) {
                callback(err);
                return;
            }
            if (_.isUndefined(event)) {
                msg += ':heavy_check_mark: ' + calendar.summary + ' free for at least 1 hour' + "\n";
            } else if (event.isCurrent) {
                msg += ':red_circle: ' + calendar.summary + ' currently busy: ';
                msg += format.calendarEntry(event) + "\n";
            } else if (event.soonBusy) {
                var startDate = Moment(event.start.dateTime);
                msg += ':large_orange_diamond: ' + calendar.summary + ' busy in ' + Math.ceil(startDate.diff(Moment(), 'minutes', true)) + ' minutes: ';
                msg += format.calendarEntry(event, true) + "\n";
            } else {
                msg += ':heavy_check_mark: ' + calendar.summary + ' free for at least 1 hour, next event: ';
                msg += format.calendarEntry(event) + "\n";
            }
            callback();
        });
    }, function(err) {
        if (err) {
            bot.reply(message, "Error: " + err);
            return;
        }
        console.log("Message", msg);
        bot.reply(message, msg);
    });
}

function hello(bot, message) {
    var msg = ':robot_face: I am a bot named <@' + bot.identity.name + '>. Hello <@' + message.user + '>!'; 
    bot.reply(message, msg);
}

function didNotUnderstand(bot, message) {
    var msg = 'Sorry, I did not understand you. I am a bot and you can ask me about the following topics: ' + "\n";
    msg += format.list();
    bot.reply(message, msg);
}


function uptime(bot, message) {
    var hostname = os.hostname();
    var uptime = format.uptime(process.uptime());
    
    var msg = ':robot_face: I am a bot that has been running for ' + uptime + ' on ' + hostname + ".\n";
    msg += 'I know about:' + "\n";
    msg += format.list();
    bot.reply(message, msg);
}

function list(bot, message) {
    var msg = format.list();
    bot.reply(message, msg);
}
