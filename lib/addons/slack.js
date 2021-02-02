'use strict';

const fetch = require('node-fetch');
const Addon = require('./addon');

const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

const definition = require('./slack-definition');

class SlackAddon extends Addon {
    constructor(args) {
        super(definition, args);
        this.unleashUrl = 'http://localhost:3000';
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

module.exports = SlackAddon;
