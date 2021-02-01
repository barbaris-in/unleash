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
        this.unleashUrl = 'http://localhost:3000';
    }

    getName() {
        return this.name;
    }

    async handleEvent(event, parameters) {
        const { url, defaultChannel } = parameters;
        const { createdBy, data } = event;

        const slackTag = this.findFirstSlackTag(event);

        const channel = slackTag ? slackTag.value : defaultChannel;

        const eventName = this.eventName(event);
        const feature = `<${this.unleashUrl}/#/features/strategies/${data.name}|${data.name}>`;

        this.logger.info(`${eventName} with params "${url}"`);

        const text = `${createdBy} ${eventName} ${feature}`;

        const body = {
            username: 'Unleash',
            icon_emoji: ':unleash:', // eslint-disable-line camelcase
            text,
            channel: `#${channel}`,
        };

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    }

    findFirstSlackTag({ tags }) {
        return tags.find(tag => tag.type === 'slack');
    }

    eventName({ type }) {
        switch (type) {
            case FEATURE_CREATED:
                return 'created feature toggle';
            case FEATURE_UPDATED:
                return 'updated feature toggle';
            case FEATURE_ARCHIVED:
                return 'archived feature toggle';
            case FEATURE_REVIVED:
                return 'revive feature toggle';
            default:
                return type;
        }
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
