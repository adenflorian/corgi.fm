export class Clients {
	private _clients: object = {}

	public add(id: string) {
		this._clients[id] = {}
	}

	public remove(id: string) {
		delete this._clients[id]
	}

	public toArray() {
		return Object.keys(this._clients).map(x => ({id: x}))
	}

	public getRawClientsObject() {
		return this._clients
	}
}
