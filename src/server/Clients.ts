module.exports.Clients = class {
	_clients: object = {}

	add(id: string) {
		this._clients[id] = {}
	}

	remove(id: string) {
		delete this._clients[id]
	}

	toArray() {
		return Object.keys(this._clients).map(x => ({id: x}))
	}

	getRawClientsObject() {
		return this._clients
	}
}

interface Client {
	id: string
}
