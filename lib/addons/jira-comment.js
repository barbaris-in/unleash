'use strict';

const Addon = require('./addon');
const definition = require('./jira-comment-definition');
const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_REVIVED,
} = require('../event-type');

class JiraAddon extends Addon {
    constructor({ getLogger }) {
        super(definition, { getLogger });
        this.unleashUrl = 'http://localhost:3000';
    }

    getName() {
        return this.name;
    }

    async handleEvent(event, parameters) {
        const { type: eventName } = event;
        const { baseUrl, user, apiKey } = parameters;
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
                        Authorization: this.buildAuthHeader(user, apiKey),
                    },
                    body,
                };
                return this.fetchRetry(issueUrl, requestOpts, 1, 300).then(
                    async res => {
                        this.logger.info(
                            `Result of post: ${issueUrl} - ${
                                res.status
                            } - ${await res.text()}`,
                        );
                    },
                );
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
                                text: `To see what happened visit Unleash`,
                                marks: [
                                    {
                                        type: 'link',
                                        attrs: {
                                            href: `${this.unleashUrl}/#/features/strategies/${featureName}`,
                                            title: 'Visit Unleash Admin UI',
                                        },
                                    },
                                ],
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
module.exports = JiraAddon;
