'use strict';

const test = require('ava');
const proxyquire = require('proxyquire').noCallThru();

const store = require('../../test/fixtures/store');
const getLogger = require('../../test/fixtures/no-logger');
const TagTypeService = require('./tag-type-service');
const {
    FEATURE_CREATED,
    FEATURE_UPDATED,
    FEATURE_ARCHIVED,
    FEATURE_REVIVED,
} = require('../event-type');

class SimpleAddon {
    constructor() {
        this.events = [];
    }

    getName() {
        return SimpleAddon.definition.name;
    }

    getEvents() {
        return this.events;
    }

    async handleEvent(event, parameters) {
        this.events.push({
            event,
            parameters,
        });
    }
}
SimpleAddon.definition = {
    name: 'simple',
    displayName: 'Simple ADdon',
    description: 'Some description',
    parameters: [
        {
            name: 'url',
            displayName: 'Some URL',
            type: 'url',
            required: true,
        },
        {
            name: 'var',
            displayName: 'Some var',
            description: 'Some variable to inject',
            type: 'text',
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

const AddonService = proxyquire.load('./addon-service', {
    '../addons': new Array(SimpleAddon),
});

function getSetup() {
    const stores = store.createStores();
    const tagTypeService = new TagTypeService(stores, { getLogger });
    return {
        addonService: new AddonService(stores, { getLogger }, tagTypeService),
        stores,
    };
}

test('should load addon configurations', async t => {
    const { addonService } = getSetup();

    const configs = await addonService.getAddons();

    t.is(configs.length, 0);
});

test('should load provider definitions', async t => {
    const { addonService } = getSetup();

    const providerDefinitions = await addonService.getProviderDefiniton();

    const simple = providerDefinitions.find(p => p.name === 'simple');

    t.is(providerDefinitions.length, 1);
    t.is(simple.name, 'simple');
});

test('should not allow addon-config for unknown provider', async t => {
    const { addonService } = getSetup();

    const error = await t.throwsAsync(
        async () => {
            await addonService.createAddon({ provider: 'unknown' });
        },
        { instanceOf: TypeError },
    );

    t.is(error.message, 'Unkown addon provider unknown');
});

test('should create addon config', async t => {
    const { addonService, stores } = getSetup();

    const config = {
        provider: 'simple',
        enabled: true,
        parameters: {
            url: 'http://localhost/wh',
            var: 'some-value',
        },
        events: [FEATURE_CREATED],
    };

    await addonService.createAddon(config, 'me@mail.com');

    // Feature toggle was created
    await stores.eventStore.store({
        type: FEATURE_CREATED,
        createdBy: 'some@user.com',
        data: {
            name: 'some-toggle',
            enabled: false,
            strategies: [{ name: 'default' }],
        },
    });

    const simpleProvider = addonService.addonProviders.simple;
    const events = simpleProvider.getEvents();

    t.is(events.length, 1);
    t.is(events[0].event.type, FEATURE_CREATED);
    t.is(events[0].event.data.name, 'some-toggle');
});
