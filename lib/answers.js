var os = require('os');
var Request = require('superagent');
var _ = require('underscore');

var config = require('./config');
var format = require('./format');

exports.shutdown = shutdown;
exports.nextCollection = nextCollection;
exports.todayCollection = todayCollection;
exports.hello = hello;
exports.uptime = uptime;

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
    var matches = message.text.match(/next( coll.*)? in (\d{4})/);
    if (matches) {
        zip = matches[2];
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

function hello(bot, message) {
    var msg = ':robot_face: I am a bot named <@' + bot.identity.name + '>. Hello <@' + message.user + '>!'; 
    bot.reply(message, msg);
}


function uptime(bot, message) {
    var hostname = os.hostname();
    var uptime = format.uptime(process.uptime());
    
    var msg = ':robot_face: I have been running for ' + uptime + ' on ' + hostname + ".\n";
    msg += '- You can ask me about the next waste collection in a ZIP code of the City of Zurich';
    msg += '- You can ask me about todays waste collection anywhere in the City of Zurich';
    msg += '- Just tell me to shutdown if you want to stop me';

    bot.reply(message, msg);
}
