'use strict';

module.exports = () => {
    const _addons = [];

    return {
        insert: async addon => {
            const a = { id: _addons.length, ...addon };
            _addons.push(a);
            return a;
        },
        get: async id => {
            return _addons.find(id);
        },
        getAll: () => Promise.resolve(_addons),
    };
};
