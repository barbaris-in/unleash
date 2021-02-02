const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

module.exports = {
    name: 'webhook',
    displayName: 'Webhook',
    description:
        'Webhooks are a simple way to post messages from Unleash to third party services. Unleash make use of normal HTTP POST with a payload you may define yourself.',
    parameters: [
        {
            name: 'url',
            displayName: 'Webhook URL',
            type: 'url',
            required: true,
        },
        {
            name: 'bodyTemplate',
            displayName: 'Body template',
            description:
                "You may format the body using a mustache template. If you don't specify anything, the format will be similar to the /api/admin/events format",
            type: 'textfield',
            required: false,
        },
    ],
    events: [
        FEATURE_CREATED,
        FEATURE_UPDATED,
        FEATURE_ARCHIVED,
        FEATURE_REVIVED,
    ],
};
