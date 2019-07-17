import {Point} from '@corgifm/common/common-types'

class SimpleGlobalClientState {
	private _zoom = 1
	private _zoomDisplay = 0
	private _pan = {x: 0, y: 0}
	private _maxFps = 60

	public get zoom() {return this._zoom}

	// Should only be set from a single place (in the Zoom component probably)
	public set zoom(val) {
		this._zoom = val
	}

	public get zoomDisplay() {return this._zoomDisplay}

	public set zoomDisplay(val) {
		this._zoomDisplay = val
		const zoomTextElement = document.getElementById('zoomText')
		// TODO
		// eslint-disable-next-line unicorn/prefer-text-content
		if (zoomTextElement) zoomTextElement.innerText = this._zoomDisplay.toFixed(2).replace(/([^.])0*$/, '$1')
	}

	public get maxFps() {return this._maxFps}

	public setMaxFps(newMaxFps: number) {
		if (newMaxFps > this._maxFps) {
			this._maxFps = newMaxFps
		}
	}

	public get pan() {return this._pan}

	public set pan(val) {
		this._pan = val
	}
}

export const simpleGlobalClientState = new SimpleGlobalClientState()

export function mouseFromScreenToBoard({x, y}: Point) {
	const {pan, zoom} = simpleGlobalClientState
	return {
		x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
		y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
	}
}
