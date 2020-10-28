import {simpleGlobalClientState} from './SimpleGlobalClientState'

const filterStrength = 20
let stop = false
let frameTime = 1
let lastLoop = performance.now()
let thisLoop
let thisFrameTime
let timeSinceLastUpdate = 0
const updateRateMs = 250

export function getFpsLoop() {
	return fpsLoop
}

const fpsLoop: FrameRequestCallback = time => {
	if (stop === true) return

	thisLoop = time
	thisFrameTime = thisLoop - lastLoop
	frameTime += (thisFrameTime - frameTime) / filterStrength
	lastLoop = thisLoop
	timeSinceLastUpdate += thisFrameTime

	if (timeSinceLastUpdate > updateRateMs) {
		updateFpsDisplay()
		timeSinceLastUpdate -= updateRateMs
	}
}

function updateFpsDisplay() {
	const fpsNode = document.getElementById('fps')

	const fps = Math.ceil(1000 / frameTime)

	if (fpsNode && fps !== simpleGlobalClientState.maxFps) {
		fpsNode.textContent = fps.toString()
		simpleGlobalClientState.setMaxFps(fps)
	}
}

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any
			accept: (_: () => any) => any
		}
	}
}

if (module.hot) {
	module.hot.dispose(() => {
		stop = true
	})
}
