var http = require('http');
var Botkit = require('botkit');
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


controller.hears(
    ['shutdown', 'get lost', 'self.*destruct', 'destroy', 'shut.*up', 'go away'],
    'direct_message,direct_mention,mention', 
    answers.shutdown
);

controller.hears(
    ['next.*coll'],
    'direct_message,direct_mention,mention',
    answers.nextCollection
);

controller.hears(
    ['today'],
    'direct_message,direct_mention,mention',
    answers.todayCollection
);

controller.hears(
    ['board'],
    'direct_message,direct_mention,mention',
    answers.stationBoard
);

controller.hears(
    ['next.*conn'],
    'direct_message,direct_mention,mention',
    answers.nextConnection
);

controller.hears(
    ['hi', 'hello', 'hey'],
    'direct_message,direct_mention,mention',
    answers.hello
);

controller.hears(
    ['uptime', 'identify yourself', 'who are you', 'what is your name', 'what do you do', 'can you help me'],
    'direct_message,direct_mention,mention',
    answers.uptime
);

// To keep Heroku's free dyno awake
http.createServer(function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.end('Ok, dyno is awake.');
}).listen(process.env.PORT || 5000);
