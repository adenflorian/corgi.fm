import {simpleGlobalClientState} from './SimpleGlobalClientState'

type UpdateFunc = (highResTimestamp: number) => void
type UpdateFuncs = readonly UpdateFunc[]

let _thingsToUpdate: UpdateFuncs = []
let _stop = false
let _isActiveTab = true
let _currentLoopId = 0

export function startMainRealTimeLoop(thingsToUpdate: UpdateFuncs) {
	_thingsToUpdate = thingsToUpdate
	_stop = false

	requestAnimationFrame(time => mainRealTimeLoop(time, _currentLoopId))
}

export function stopMainRealTimeLoop() {
	_stop = true
}

const mainRealTimeLoop = (highResTimestamp: number, loopId: number) => {
	if (_stop) return
	if (loopId < _currentLoopId) return

	_thingsToUpdate.forEach(x => x(highResTimestamp))

	if (_isActiveTab) {
		requestAnimationFrame(time => mainRealTimeLoop(time, loopId))
	} else {
		setTimeout(() => mainRealTimeLoop(performance.now(), loopId), 1000 / simpleGlobalClientState.maxFps)
	}
}

window.addEventListener('blur', () => {
	_isActiveTab = false
	// Make sure this doesn't cause multiple loops
	_currentLoopId++
	mainRealTimeLoop(performance.now(), _currentLoopId)
}, false)

window.addEventListener('focus', () => {
	_isActiveTab = true
}, false)

if (module.hot) {
	module.hot.dispose(() => {
		_stop = true
	})
}
