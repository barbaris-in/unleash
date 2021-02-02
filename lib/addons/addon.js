'use strict';

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
}

module.exports = Addon;
