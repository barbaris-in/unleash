'use strict';

const { addonDefinitonSchema } = require('./addon-schema');

class Addon {
    constructor(definition, { getLogger }) {
        addonDefinitonSchema.validate(definition);
        this.definition = definition;
        this.logger = getLogger(`addon/${definition.name}`);
    }

    getName() {
        return this.definition.name;
    }

    getDefinition() {
        return { ...this.definition };
    }
}

module.exports = Addon;
