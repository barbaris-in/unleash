'use strict';

const fetch = require('node-fetch');
const Mustache = require('mustache');
const Addon = require('./addon');
const definition = require('./webhook-definition');

class Webhook extends Addon {
    constructor(args) {
        super(definition, args);
    }

    async handleEvent(event, parameters) {
        const { url, bodyTemplate, contentType } = parameters;
        const context = {
            parameters,
            event,
        };

        let body;

        if (typeof bodyTemplate === 'string' && bodyTemplate.length > 1) {
            body = Mustache.render(bodyTemplate, context);
        } else {
            body = JSON.stringify(event);
        }

        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': contentType || 'application/json' },
            body,
        });

        this.logger.info(`${this.name} triggered for event=${event.type}`);
    }
}

module.exports = Webhook;
