type QwertyKeyboardNotesServiceDelegate = (keyNumber: number, gate: boolean) => void

class QwertyKeyboardNotesService {
	private readonly _subscribers = new Set<QwertyKeyboardNotesServiceDelegate>()

	public subscribe(delegate: QwertyKeyboardNotesServiceDelegate) {
		this._subscribers.add(delegate)
	}

	public unsubscribe(delegate: QwertyKeyboardNotesServiceDelegate) {
		this._subscribers.delete(delegate)
	}

	public invokeImmediately(keyNumber: number, gate: boolean) {
		this._subscribers.forEach(delegate => delegate(keyNumber, gate))
	}
}

export const qwertyKeyboardNotesService = new QwertyKeyboardNotesService()
