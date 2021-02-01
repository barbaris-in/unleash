'use strict';

const fetch = require('node-fetch');
const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

class SlackAddon {
    constructor({ getLogger }) {
        this.name = SlackAddon.definition.name;
        this.logger = getLogger(`addon/${this.name}`);
    }

    getName() {
        return this.name;
    }

    async handleEvent(eventName, event, parameters) {
        const { url, defaultChannel } = parameters;

        this.logger.info(`got event ${eventName} with params "${url}"`);

        const body = {
            username: 'Unleash',
            icon_emoji: ':unleash:', // eslint-disable-line camelcase
            text: JSON.stringify(event),
            channel: `#${defaultChannel}`,
        };

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }
}

// TODO: Static properties will move in to the ojects when we have TypeScript
// Slack.name = 'slack';
SlackAddon.definition = {
    name: 'slack',
    displayName: 'Slack',
    description: 'Integrates Unleash with Slack.',
    parameters: [
        {
            name: 'url',
            displayName: 'Slack webhook URL',
            type: 'url',
            required: true,
        },
        {
            name: 'defaultChannel',
            displayName: 'Default channel',
            description:
                'Default channel to post updates to if not specified in the slack-tag',
            type: 'text',
            required: true,
        },
    ],
    events: [
        FEATURE_CREATED,
        FEATURE_UPDATED,
        FEATURE_ARCHIVED,
        FEATURE_REVIVED,
    ],
    tags: [
        {
            name: 'slack',
            description:
                'Slack tag used by the slack-addon to specify the slack channel.',
            icon: 'S',
        },
    ],
};

module.exports = SlackAddon;
