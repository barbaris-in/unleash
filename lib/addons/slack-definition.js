'use strict';

const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

module.exports = {
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
