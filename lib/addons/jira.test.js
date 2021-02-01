const test = require('ava');
const proxyquire = require('proxyquire');
const fetchMock = require('fetch-mock').sandbox();
const noLogger = require('../../test/fixtures/no-logger');

const JiraAddon = proxyquire('./jira', { 'node-fetch': fetchMock });
const { addonDefinitonSchema } = require('../services/addon-schema');

test.beforeEach(() => {
    fetchMock.restore();
    fetchMock.reset();
});
test.afterEach(() => {
    fetchMock.reset();
});
test('Addon definition should validate', t => {
    const { error } = addonDefinitonSchema.validate(JiraAddon.definition);
    t.is(error, undefined);
});

test.serial(
    'An update event should post updated comment with updater and link back to issue',
    async t => {
        const jiraIssue = 'TEST-1';
        const jiraBaseUrl = 'https://test.jira.com';
        const addon = new JiraAddon({
            getLogger: noLogger,
            unleashUrl: 'https://test.unleash.com',
        });
        fetchMock.mock(
            { url: 'https://test.jira.com/rest/api/3/issue/TEST-1/comment' },
            201,
        );
        await addon.handleEvent(
            'feature-updated',
            {
                createdBy: 'test@test.com',
                data: {
                    name: 'feature.toggle',
                },
                tags: [{ type: 'jira', value: jiraIssue }],
            },
            {
                baseUrl: jiraBaseUrl,
                userName: 'test@test.com',
                apiKey: 'test',
            },
        );
        t.is(fetchMock.calls(true).length, 1);
        t.true(fetchMock.done());
    },
);

test.serial(
    'An event that is tagged with two tags causes two updates',
    async t => {
        const jiraBaseUrl = 'https://test.jira.com';
        const addon = new JiraAddon({
            getLogger: noLogger,
            unleashUrl: 'https://test.unleash.com',
        });
        fetchMock.mock(
            {
                name: 'test-1',
                url: `${jiraBaseUrl}/rest/api/3/issue/TEST-1/comment`,
            },
            {
                status: 201,
                statusText: 'Accepted',
            },
        );
        fetchMock.mock(
            {
                name: 'test-2',
                url: `${jiraBaseUrl}/rest/api/3/issue/TEST-2/comment`,
            },
            {
                status: 201,
                statusText: 'Accepted',
            },
        );
        await addon.handleEvent(
            'feature-updated',
            {
                createdBy: 'test@test.com',
                data: {
                    name: 'feature.toggle',
                },
                tags: [
                    { type: 'jira', value: 'TEST-1' },
                    { type: 'jira', value: 'TEST-2' },
                ],
            },
            {
                baseUrl: 'https://test.jira.com',
                userName: 'test@test.com',
                apiKey: 'test',
            },
        );
        t.true(fetchMock.done(), 'All routes should be matched');
    },
);

test.serial('An event with no jira tags will be ignored', async t => {
    const addon = new JiraAddon({
        getLogger: noLogger,
        unleashUrl: 'https://test.unleash.com',
    });
    fetchMock.any(200);
    await addon.handleEvent(
        'feature-updated',
        {
            createdBy: 'test@test.com',
            data: {
                name: 'feature.toggle',
            },
            tags: [],
        },
        {
            baseUrl: 'https://test.jira.com',
            userName: 'test@test.com',
            apiKey: 'test',
        },
    );
    t.is(fetchMock.calls().length, 0); // No calls
});
