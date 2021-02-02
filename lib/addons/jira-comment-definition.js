const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

module.exports = {
    name: 'jira-comment',
    displayName: 'Jira Commenter',
    description: 'Allows Unleash to post comments to JIRA issues',
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
