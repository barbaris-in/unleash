'use strict';

const fetch = require('node-fetch');
const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

class JiraAddon {
    constructor({ getLogger, unleashUrl }) {
        this.name = JiraAddon.definition.name;
        this.logger = getLogger(`addon/${this.name}`);
        this.unleashUrl = unleashUrl;
    }

    getName() {
        return this.name;
    }

    async handleEvent(eventName, event, parameters) {
        const { baseUrl, userName, apiKey } = parameters;
        const issuesToPostTo = this.findJiraTag(event);
        const jiraIssue = issuesToPostTo[0].value;
        const issueUrl = `${baseUrl}/rest/api/3/issue/${jiraIssue}/comment`;
        let action;
        if (eventName === FEATURE_CREATED) {
            action = 'created';
        } else if (eventName === FEATURE_UPDATED) {
            action = 'updated';
        } else if (eventName === FEATURE_REVIVED) {
            action = 'revived';
        } else {
            action = 'archived';
        }
        const body = this.formatBody(event, action);
        await fetch(issueUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: this.buildAuthHeader(userName, apiKey),
            },
            body,
        });
    }

    encode(str) {
        return Buffer.from(str, 'utf-8').toString('base64');
    }

    formatBody(event, action) {
        return JSON.stringify({
            body: {
                type: 'doc',
                version: 1,
                content: [
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `Feature toggle [${event.data.name}] was ${action}`,
                            },
                        ],
                    },
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `To see what happened go back to Unleash ${this.unleashUrl}/features/${event.data.name}`,
                            },
                        ],
                    },
                ],
            },
        });
    }

    buildAuthHeader(userName, apiKey) {
        const base64 = this.encode(`${userName}:${apiKey}`);
        return `Basic ${base64}`;
    }

    findJiraTag({ tags }) {
        return tags.filter(tag => tag.type === 'jira');
    }
}
// TODO: Static properties will move in to the ojects when we have TypeScript
// JiraAddon.name.name = 'jira';
JiraAddon.definition = {
    name: 'jira',
    displayName: 'Jira',
    description: 'Integrates Unleash with JIRA',
    parameters: [
        {
            name: 'baseUrl',
            displayName: 'Jira base url e.g. https://myjira',
            type: 'url',
            required: true,
        },
        {
            name: 'apiKey',
            displayName: 'Jira API key',
            description:
                'Used to authenticate against JIRA REST api, needs to be for a user with comment access to issues',
            type: 'text',
            required: true,
        },
        {
            name: 'user',
            displayName: 'JIRA username',
            description:
                'Used together with API key to authenticate against JIRA',
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
            name: 'jira',
            description:
                'Jira tag used by the jira addon to specify the JIRA issue to comment on',
            icon: 'J',
        },
    ],
};

module.exports = JiraAddon;
