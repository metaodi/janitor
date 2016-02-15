var os = require('os');
var Request = require('superagent');
var XRegExp = require('xregexp');
var _ = require('underscore');

var config = require('./config');
var format = require('./format');
var cal = require('./cal');

exports.shutdown = shutdown;
exports.nextCollection = nextCollection;
exports.todayCollection = todayCollection;
exports.nextConnection = nextConnection;
exports.nextCalendarEntries = nextCalendarEntries;
exports.stationBoard = stationBoard;
exports.hello = hello;
exports.uptime = uptime;
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
    var matches = XRegExp.exec(message.text, XRegExp('next.*in (?<zip>\d{4})', 'i'));
    if (matches) {
        zip = matches.zip;
    }

    // today in YYYY-MM-DD format
    var today = new Date().toJSON().slice(0, 10);
    Request
    .get('http://openerz.herokuapp.com/api/calendar?start=' + today + '&zip=' + zip + '&sort=date:asc&limit=3')
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
    var matches = XRegExp.exec(message.text, XRegExp('^next conn\w* (from (?<from>.*?))? ?(to (?<to>.*))?$', 'i'));
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
    var matches = XRegExp.exec(message.text, XRegExp('((?<tesla>nikola|tesla)|(?<turing>alan|turing)|(?<ada>ada|lovelace)|(?<arena>arena))', 'i'));

    var calendars = [];
    if (matches) {
        var keys = Object.keys(matches);
        calendars = _.filter(Object.keys(matches), function (key) {
            return ! _.isEmpty(matches[key]) && ! key.match(/^(\d+|input)$/);
        });
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

function hello(bot, message) {
    var msg = ':robot_face: I am a bot named <@' + bot.identity.name + '>. Hello <@' + message.user + '>!'; 
    bot.reply(message, msg);
}

function didNotUnderstand(bot, message) {
    var msg = 'Sorry, I did not understand you. I am a bot and you can ask me about the following topics: ' + "\n";
    msg += '- the next waste collection in a ZIP code of the City of Zurich' + "\n";
    msg += '- todays waste collection anywhere in the City of Zurich' + "\n";
    msg += '- the next public transport connections anywhere in Switzerland' + "\n";

    bot.reply(message, msg);
}


function uptime(bot, message) {
    var hostname = os.hostname();
    var uptime = format.uptime(process.uptime());
    
    var msg = ':robot_face: I am a bot that has been running for ' + uptime + ' on ' + hostname + ".\n";
    msg += '- You can ask me about the next waste collection in a ZIP code of the City of Zurich' + "\n";
    msg += '- You can ask me about todays waste collection anywhere in the City of Zurich' + "\n";
    msg += '- You can ask me about the next public transport connections anywhere in Switzerland' + "\n";
    msg += '- Just tell me to shutdown if you want to stop me';

    bot.reply(message, msg);
}
