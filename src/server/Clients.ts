export class Clients {
	private _clients: object = {}

	public add(id: string) {
		this._clients[id] = {
			id,
			octave: 4,
			notes: [],
		}
	}

	public remove(id: string) {
		delete this._clients[id]
	}

	public setOctave(id: string, octave: number) {
		this._clients[id].octave = octave
	}

	public setNotes(id: string, notes: number[]) {
		this._clients[id].notes = notes
	}

	public get(id: string) {
		return this._clients[id]
	}

	public toArray() {
		return Object.keys(this._clients).map(x => this._clients[x])
	}

	public getRawClientsObject() {
		return this._clients
	}
}
