import {zoomTextLength} from './SimpleGraph/Zoom'

class SimpleGlobalClientState {
	private _zoom = 1
	public get zoom() {return this._zoom}
	public set zoom(val) {
		this._zoom = val
		const zoomTextElement = document.getElementById('zoomText')
		if (zoomTextElement) zoomTextElement.innerText = this._zoom.toFixed(zoomTextLength - 3).replace(/([^\.])0*$/, '$1')
	}
}

export const simpleGlobalClientState = new SimpleGlobalClientState()
