import {simpleGlobalClientState} from './SimpleGlobalClientState'

const filterStrength = 20
let stop = false
let frameTime = 1
let lastLoop = performance.now()
let thisLoop
let thisFrameTime

export function getFpsLoop() {
	return fpsLoop
}

const fpsLoop: FrameRequestCallback = time => {
	if (stop === true) return

	thisLoop = time
	thisFrameTime = thisLoop - lastLoop
	frameTime += (thisFrameTime - frameTime) / filterStrength
	lastLoop = thisLoop
}

const fpsUpdateInterval = setInterval(updateFpsDisplay, 250)

let fpsNode
function updateFpsDisplay() {
	fpsNode = document.getElementById('fps')

	const fps = Math.ceil(1000 / frameTime)

	if (fpsNode) {
		fpsNode.textContent = fps.toString()
	}

	simpleGlobalClientState.setMaxFps(fps)
}

declare global {
	interface NodeModule {
		hot: {
			dispose: (_: () => any) => any,
			accept: (_: () => any) => any,
		}
	}
}

if (module.hot) {
	module.hot.dispose(() => {
		stop = true
		clearInterval(fpsUpdateInterval)
	})
}
