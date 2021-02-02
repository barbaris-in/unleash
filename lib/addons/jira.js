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

    async handleEvent(event, parameters) {
        const { type: eventName } = event;
        const { baseUrl, userName, apiKey } = parameters;
        const issuesToPostTo = this.findJiraTag(event);
        if (issuesToPostTo.length > 0) {
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
            const requests = issuesToPostTo.map(async issueTag => {
                const issue = issueTag.value;
                const issueUrl = `${baseUrl}/rest/api/3/issue/${issue}/comment`;
                this.logger.info(`Posting update to issue ${issue}`);
                const requestOpts = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Authorization: this.buildAuthHeader(userName, apiKey),
                    },
                    body,
                };
                const res = await fetch(issueUrl, requestOpts);
                if (!res.ok) {
                    if (res.status >= 500) {
                        this.logger.warn(
                            `Serverside error when posting to JIRA. Retrying`,
                        );
                        const retry = await fetch(issueUrl, requestOpts);
                        if (!retry.ok) {
                            this.logger.warn(
                                `Still not ok, not retrying again`,
                            );
                        } else {
                            this.logger.debug(`Succeeded after retry`);
                            return retry;
                        }
                    } else if (res.status >= 400 && res.status < 500) {
                        this.logger.warn(
                            `We did something wrong when posting to JIRA. No sense in retrying ${res.statusText}`,
                        );
                    } else {
                        this.logger.debug(
                            `Successfully updated issue ${issue}`,
                        );
                    }
                }
                return res;
            });
            await Promise.all(requests);
        }
        return Promise.resolve();
    }

    encode(str) {
        return Buffer.from(str, 'utf-8').toString('base64');
    }

    formatBody(event, action) {
        const featureName = event.data.name;
        const { createdBy } = event;
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
                                text: `Feature toggle "${featureName}" was ${action} by ${createdBy}`,
                            },
                        ],
                    },
                    {
                        type: 'paragraph',
                        content: [
                            {
                                type: 'text',
                                text: `To see what happened visit Unleash (${this.unleashUrl}/api/admin/features/${featureName})`,
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
