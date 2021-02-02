'use strict';

const fetch = require('node-fetch');
const { addonDefinitonSchema } = require('./addon-schema');

class Addon {
    constructor(definition, { getLogger }) {
        const { error } = addonDefinitonSchema.validate(definition);
        if (error) {
            this.logger.warn(
                `Could not load addon provider ${definition.name}`,
                error,
            );
            throw error;
        }
        this._name = definition.name;
        this._definition = definition;
        this.logger = getLogger(`addon/${definition.name}`);
    }

    get name() {
        return this._name;
    }

    get definition() {
        return this._definition;
    }

    async fetchRetry(url, options = {}, retries = 3, backoff = 300) {
        /* 1 */
        const retryCodes = [408, 500, 502, 503, 504, 522, 524];
        let res = await fetch(url, options);
        if (res.ok) {
            return res;
        }
        if (retries > 0 && retryCodes.includes(res.status)) {
            res = await this.fetchRetry(url, options, retries - 1, backoff * 2);
        }
        return res;
    }
}

module.exports = Addon;
