const webhook = require('./webhook');
const slackAddon = require('./slack');
const jiraAddon = require('./jira');

module.exports = [webhook, slackAddon, jiraAddon];
