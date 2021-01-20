'use strict';

const fetch = require('node-fetch');
const Mustache = require('mustache');
const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

class Webhook {
    constructor({ getLogger }) {
        this.name = Webhook.definition.name;
        this.logger = getLogger(`addon/${this.name}`);
    }

    getName() {
        return this.name;
    }

    getEvents() {
        return this.events;
    }

    async handleEvent(eventName, event, parameters) {
        const { url, bodyTemplate } = parameters;
        const context = {
            parameters,
            event,
            eventName,
        };

        let body;

        if (typeof bodyTemplate === 'string' && bodyTemplate.length > 1) {
            body = Mustache.render(bodyTemplate, context);
        } else {
            body = event;
        }

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        this.logger.info(`${this.name} triggered for event=${eventName}`);
    }
}

// TODO: Static properties will move in to the ojects when we have TypeScript
// Webhook.name = 'webhook';
Webhook.definition = {
    name: 'webhook',
    displayName: 'Webhook',
    parameters: [
        {
            name: 'url',
            displayName: 'Webhook URL',
            type: 'string',
        },
        {
            name: 'unleashUrl',
            displayName: 'Unleash Admin UI url',
            type: 'text',
        },
        {
            name: 'bodyTemplate',
            displayName: 'Body template',
            description: 'You may format the body using a mustache template.',
            type: 'text',
        },
    ],
    events: [
        FEATURE_CREATED,
        FEATURE_UPDATED,
        FEATURE_ARCHIVED,
        FEATURE_REVIVED,
    ],
};

module.exports = Webhook;
