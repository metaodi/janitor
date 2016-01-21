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
    ['shutdown', 'get lost', 'self.*destruct', 'destroy'],
    'direct_message,direct_mention,mention', 
    answers.shutdown
);

controller.hears(
    ['next( collection)?'],
    'direct_message,direct_mention,mention',
    answers.nextCollection
);

controller.hears(
    ['(collection )?today'],
    'direct_message,direct_mention,mention',
    answers.todayCollection
);

controller.hears(
    ['uptime','identify yourself','who are you','what is your name'],
    'direct_message,direct_mention,mention',
    answers.uptime
);
