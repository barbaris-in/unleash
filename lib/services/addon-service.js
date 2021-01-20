'use strict';

const addonProvidersClasses = require('../addons');
const events = require('../event-type');
const { addonSchema, addonDefinitonSchema } = require('./addon-schema');

const SUPPORTED_EVENTS = Object.keys(events).map(k => events[k]);

class AddonService {
    constructor({ addonStore, eventStore, featureToggleStore }, { getLogger }) {
        this.eventStore = eventStore;
        this.addonStore = addonStore;
        this.featureToggleStore = featureToggleStore;
        this.getLogger = getLogger;
        this.logger = getLogger('services/addon-service.js');
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
                            eventName,
                            event,
                            addon.parameters,
                        ),
                    );
            });
        };
    }

    // TODO: use memoize to not fetch every time.
    async fetchAddonConfigs() {
        return this.addonStore.getAll({ enabled: true });
    }

    async getAddons() {
        return this.addonStore.getAll();
    }

    async getAddon(id) {
        return this.addonStore.get(id);
    }

    async getAddonProviders() {
        return addonProvidersClasses.map(a => a.definition);
    }

    async createAddon(data, username) {
        const addonConfig = await addonSchema.validateAsync(data);
        const createdAddon = await this.addonStore.insert(addonConfig);

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
}

module.exports = AddonService;
