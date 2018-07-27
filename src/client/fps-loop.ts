let stop = false
const filterStrength = 20
let frameTime = 0
let lastLoop = Date.now()
let thisLoop

export function fpsLoop() {
	if (stop === true) return

	thisLoop = Date.now()
	const thisFrameTime = thisLoop - lastLoop
	frameTime += (thisFrameTime - frameTime) / filterStrength
	lastLoop = thisLoop

	window.requestAnimationFrame(fpsLoop)
}

let fpsNode
const interval = setInterval(() => {
	fpsNode = document.getElementById('fps')
	if (fpsNode) {
		fpsNode.textContent = 'FPS ' + (1000 / frameTime).toFixed(0)
	}
}, 250)

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
		clearInterval(interval)
	})
}
