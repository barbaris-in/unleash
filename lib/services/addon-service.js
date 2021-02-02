'use strict';

const memoize = require('memoizee');
const addonProvidersClasses = require('../addons');
const events = require('../event-type');
const { addonSchema, addonDefinitonSchema } = require('./addon-schema');

const SUPPORTED_EVENTS = Object.keys(events).map(k => events[k]);

const ADDONS_CACHE_TIME = 60 * 1000; // 60s

class AddonService {
    constructor(
        { addonStore, eventStore, featureToggleStore },
        { getLogger },
        tagTypeService,
    ) {
        this.eventStore = eventStore;
        this.addonStore = addonStore;
        this.featureToggleStore = featureToggleStore;
        this.getLogger = getLogger;
        this.logger = getLogger('services/addon-service.js');
        this.tagTypeService = tagTypeService;

        this.addonProviders = addonProvidersClasses.reduce((map, Provider) => {
            const { definition } = Provider;
            const { error } = addonDefinitonSchema.validate(definition);

            if (error) {
                this.logger.warn(
                    `Could not load addon provider ${definition.name}`,
                    error,
                );
            }

            const provider = new Provider({ getLogger });
            // eslint-disable-next-line no-param-reassign
            map[provider.getName()] = provider;
            return map;
        }, {});
        if (addonStore) {
            this.registerEventHandler();
        }

        // Memozied function
        this.fetchAddonConfigs = memoize(
            () => addonStore.getAll({ enabled: true }),
            { promise: true, maxAge: ADDONS_CACHE_TIME },
        );
    }

    registerEventHandler() {
        SUPPORTED_EVENTS.forEach(eventName =>
            this.eventStore.on(eventName, this.handleEvent(eventName)),
        );
    }

    handleEvent(eventName) {
        const { addonProviders } = this;
        return event => {
            this.fetchAddonConfigs().then(addonInstances => {
                addonInstances
                    .filter(addon => addon.events.includes(eventName))
                    .filter(addon => addonProviders[addon.provider])
                    .forEach(addon =>
                        addonProviders[addon.provider].handleEvent(
                            event,
                            addon.parameters,
                        ),
                    );
            });
        };
    }

    async getAddons() {
        return this.addonStore.getAll();
    }

    async getAddon(id) {
        return this.addonStore.get(id);
    }

    getProviderDefiniton() {
        return addonProvidersClasses.map(a => a.definition);
    }

    async addTagTypes(providerName) {
        const provider = this.getProviderDefiniton().find(
            p => p.name === providerName,
        );

        if (provider && provider.tags) {
            provider.tags.forEach(async tagType => {
                try {
                    await this.tagTypeService.validateUnique(tagType);
                    await this.tagTypeService.createTagType(tagType);
                } catch (err) {
                    // We do not need to create tag type
                }
            });
        }
    }

    async createAddon(data, username) {
        const addonConfig = await addonSchema.validateAsync(data);
        await this.validateKnownProvider(addonConfig);

        const createdAddon = await this.addonStore.insert(addonConfig);
        await this.addTagTypes(createdAddon.provider);

        this.logger.info(
            `User ${username} created addon ${addonConfig.provider}`,
        );
        return createdAddon;
        // TODO: also create event ADDON_CREATED
    }

    async updateAddon(id, data, username) {
        const addonConfig = await addonSchema.validateAsync(data);
        this.logger.info(`User ${username} updated addon ${id}`);
        await this.addonStore.update(id, addonConfig);
        // TODO: also create event ADDON_UPDATED
    }

    async removeAddon(id, username) {
        this.logger.info(`User ${username} removed addon ${id}`);
        await this.addonStore.delete(id);
        this.logger.warn(`Remove addon instance with id=${id}`);
        // TODO: also create event ADDON_DELETED
    }

    async validateKnownProvider(config) {
        const p = this.getProviderDefiniton().find(
            d => d.name === config.provider,
        );
        if (!p) {
            throw new TypeError(`Unkown addon provider ${config.provider}`);
        } else {
            return true;
        }
    }
}

module.exports = AddonService;