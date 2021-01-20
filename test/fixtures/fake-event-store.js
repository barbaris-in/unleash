'use strict';

const { EventEmitter } = require('events');

class EventStore extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(0);
        this.events = [];
    }

    store(event) {
        this.events.push(event);
        return Promise.resolve();
    }

    getEvents() {
        return Promise.resolve(this.events);
    }
}

module.exports = () => {
    return new EventStore();
};
