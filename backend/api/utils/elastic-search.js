const _ = require('lodash');
const ES = require('elasticsearch');

/* eslint-disable class-methods-use-this */
class BulkQueryBuilder {
    constructor(index, type) {
        this.actions = [];
        this.index = index;
        this.type = type;
    }

    create(id, data) {
        this._addAction('index', this._getActionMetadata(this.index, this.type, id));
        this.actions.push(data);
        return this;
    }

    update(id, data) {
        this._addAction('update', this._getActionMetadata(this.index, this.type, id));
        this._addAction('doc', data);
        return this;
    }
    remove(id) {
        this._addAction('delete', this._getActionMetadata(this.index, this.type, id));
        return this;
    }

    value() {
        return this.actions;
    }

    _addAction(action, data) {
        const obj = {};
        obj[action] = data;
        this.actions.push(obj);
    }

    _getActionMetadata(index, type, id) {
        return { _index: index, _type: type, _id: id };
    }
}

module.exports = class {
    constructor(options) {
        this.clients = this._createClients(options);
    }

    search(index, body, options) {
        return this._perClient(client => client.search(Object.assign({
            index,
            body
        }, options)));
    }

    bulkQuery(index, type) { // eslint-disable-line
        return new BulkQueryBuilder(index, type);
    }

    execBulk(body) {
        return this._perClient(client => client.bulk({
            body
        }));
    }

    _perClient(delegate) {
        const promises = this.clients.map(client => delegate(client));
        return Promise.all(promises);
    }

    _createClients(options) {
        if (_.isArray(options.host)) {
            return _.map(options.host, host => this._createClient(host, options));
        }

        return [this._createClient(options.host, options)];
    }

    _createClient(host, options) {
        const params = Object.assign({}, { host }, options);
        return new ES.Client(params);
    }
};
