module.exports.Clients = class {
	constructor() {
		this._clients = {}
	}

	add(id) {
		this._clients[id] = {}
	}

	remove(id) {
		delete this._clients[id]
	}

	toArray() {
		return Object.keys(this._clients).map(x => ({id: x}))
	}

	getRawClientsObject() {
		return this._clients
	}
}
