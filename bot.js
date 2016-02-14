var http = require('http');
var Botkit = require('botkit');
var _ = require('underscore');
var controller = Botkit.slackbot();
var answers = require('./lib/answers');

var janitor = controller.spawn({
  token: process.env.token
});
janitor.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

function matcher(text) {
    var text = text;
    return function(pattern) {
        var re = new RegExp(pattern);
        return re.test(text);
    };
}


controller.hears(['.*'], ['direct_message,direct_mention'], function(bot, message) {
    var shutdown = _.any(
        ['shutdown', 'get lost', 'self.*destruct', 'destroy', 'shut.*up', 'go away'],
        matcher(message.text)
    );
    if (shutdown) {
        answers.shutdown(bot, message);
        return;
    }

    var nextColl = _.any(
        ['next.*coll'],
        matcher(message.text)
    );
    if (nextColl) {
        answers.nextCollection(bot, message);
        return;
    }

    var todayColl = _.any(
        ['today'],
        matcher(message.text)
    );
    if (todayColl) {
        answers.todayCollection(bot, message);
        return;
    }

    var board = _.any(
        ['board'],
        matcher(message.text)
    );
    if (board) {
        answers.stationBoard(bot, message);
        return;
    }

    var nextConn = _.any(
        ['next.*conn'],
        matcher(message.text)
    );
    if (nextConn) {
        answers.nextConnection(bot, message);
        return;
    }
    
    var calendar = _.any(
        ['calendar'],
        matcher(message.text)
    );
    if (calendar) {
        answers.nextCalendarEntries(bot, message);
        return;
    }
    
    var hello = _.any(
        ['hi', 'hello', 'hey'],
        matcher(message.text)
    );
    if (hello) {
        answers.hello(bot, message);
        return;
    }

    var uptime = _.any(
        ['uptime', 'identify yourself', 'who are you', 'what is your name', 'what do you do', 'can you help me'],
        matcher(message.text)
    );
    if (uptime) {
        answers.uptime(bot, message);
        return;
    }

    answers.didNotUnderstand(bot, message);
});


// To keep Heroku's free dyno awake
http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Ok, dyno is awake.');
}).listen(process.env.PORT || 5000);
