class SimpleGlobalClientState {
	private _zoom = 1
	private _pan = {x: 0, y: 0}

	public get zoom() {return this._zoom}

	// Should only be set from a single place (in the Zoom component probably)
	public set zoom(val) {
		this._zoom = val
		const zoomTextElement = document.getElementById('zoomText')
		if (zoomTextElement) zoomTextElement.innerText = this._zoom.toFixed(2).replace(/([^\.])0*$/, '$1')
	}

	public get pan() {return this._pan}

	public set pan(val) {
		this._pan = val
	}
}

export const simpleGlobalClientState = new SimpleGlobalClientState()
