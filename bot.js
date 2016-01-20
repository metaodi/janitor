var os = require('os');
var Request = require('superagent');
var _ = require('underscore');

var Botkit = require('botkit');
var controller = Botkit.slackbot();

var janitor = controller.spawn({
  token: process.env.token
});
janitor.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.hears(['shutdown'],'direct_message,direct_mention,mention', function(bot, message) {

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
});

controller.hears(['next collections'],'direct_message,direct_mention,mention',function(bot, message) {
    // today in YYYY-MM-DD format
    today = new Date().toJSON().slice(0, 10);
    Request
    .get('http://openerz.herokuapp.com/api/calendar?start=' + today + '&sort=date:asc&limit=3')
    .end(function(err, res){
        var collections = '';
        _.each(res.body.result, function(col) {
            var colType = col.type.charAt(0).toUpperCase() + col.type.slice(1);
            collections += col.date + ': ' + colType + ' in ZIP ' + col.zip + "\n";
        });
        bot.reply(message,':robot_face: Next collections: ' + collections);
    });
});


controller.hears(['uptime','identify yourself','who are you','what is your name'],'direct_message,direct_mention,mention',function(bot, message) {

    var hostname = os.hostname();
    var uptime = formatUptime(process.uptime());

    bot.reply(message,':robot_face: I am a bot named <@' + bot.identity.name + '>. I have been running for ' + uptime + ' on ' + hostname + '.');
});

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime !== 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
