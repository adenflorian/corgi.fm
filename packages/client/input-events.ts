import {Map} from 'immutable'
import {Action, AnyAction, Store} from 'redux'
import {rateLimitedDebounce, keyToMidiMap} from '@corgifm/common/common-utils'
import {
	findNodeInfo, globalClockActions,
	IClientAppState, pointersActions,
	selectClientInfo, selectGlobalClockIsPlaying,
	selectIsLocalClientInLimitedMode, selectLocalClient,
	selectPosition, selectSequencer, selectShamuMetaState, sequencerActions,
	userInputActions,
	localActions, localMidiKeyPress, localMidiKeyUp, localMidiOctaveChange,
	windowBlur,
} from '@corgifm/common/redux'
import {mouseFromScreenToBoard} from './SimpleGlobalClientState'

type IKeyBoardShortcuts = Map<string, KeyBoardShortcut>

interface KeyBoardShortcut {
	actionOnKeyDown?: Action | keyboardActionCreator
	actionOnKeyUp?: Action | keyboardActionCreator
	actionOnKeyPress?: Action | keyboardActionCreator
	allowRepeat: boolean
	preventDefault: boolean
	allowInLimitedMode?: boolean
}

type keyboardActionCreator = (e: KeyboardEvent, state: IClientAppState) => AnyAction | undefined

const midiKeyShortcuts: {[key: string]: KeyBoardShortcut} = {}

keyToMidiMap.forEach((val, key) => {
	midiKeyShortcuts[key] = {
		actionOnKeyDown: localMidiKeyPress(val, 1),
		actionOnKeyUp: localMidiKeyUp(val),
		allowRepeat: false,
		preventDefault: true,
	}
})

const Control = 'control'
const Alt = 'alt'
const Shift = 'shift'
const Plus = '+'

const changeOctaveShortcut = (delta: number) => ({
	actionOnKeyDown: localMidiOctaveChange(delta),
	allowRepeat: true,
	preventDefault: true,
})

const keyboardShortcuts: IKeyBoardShortcuts = Map<KeyBoardShortcut>({
	'z': changeOctaveShortcut(-1),
	[Shift + Plus + 'z']: changeOctaveShortcut(-2),
	'-': changeOctaveShortcut(-1),
	[Shift + Plus + '-']: changeOctaveShortcut(-2),
	'x': changeOctaveShortcut(1),
	[Shift + Plus + 'x']: changeOctaveShortcut(2),
	'+': changeOctaveShortcut(1),
	[Shift + Plus + '+']: changeOctaveShortcut(2),
	[Control + Plus + 'z']: {
		actionOnKeyDown: (_, state) => {
			const selectedNode = selectShamuMetaState(state.room).selectedNode
			if (selectedNode === undefined) return
			return findNodeInfo(selectPosition(state.room, selectedNode.id).targetType).undoAction(selectedNode.id)
		},
		allowRepeat: true,
		preventDefault: true,
	},
	[Control + Plus + 'd']: {
		actionOnKeyDown: (_, state) => {
			const selectedNode = selectShamuMetaState(state.room).selectedNode
			if (selectedNode === undefined) return
			if (findNodeInfo(selectedNode.type).isNodeCloneable !== true) return
			return localActions.cloneNode(selectedNode.id, selectedNode.type, 'all')
		},
		allowRepeat: false,
		preventDefault: true,
	},
	'r': {
		actionOnKeyDown: (_, state) => {
			const selectedNode = selectShamuMetaState(state.room).selectedNode
			if (selectedNode === undefined) return
			const ownerId = selectPosition(state.room, selectedNode.id).ownerId
			if (ownerId.startsWith('dummy')) return
			const sequencer = selectSequencer(state.room, selectedNode.id)
			return sequencerActions.toggleRecording(selectedNode.id, !sequencer.isRecording)
		},
		allowRepeat: false,
		preventDefault: true,
	},
	'b': {
		actionOnKeyDown: userInputActions.localMidiSustainPedal(true),
		actionOnKeyUp: userInputActions.localMidiSustainPedal(false),
		allowRepeat: false,
		preventDefault: true,
	},
	'ArrowRight': {
		actionOnKeyDown: sequencerActions.skipNote(),
		allowRepeat: true,
		preventDefault: true,
	},
	'Backspace': {
		actionOnKeyDown: e => userInputActions.keyPress(e.key),
		allowRepeat: true,
		preventDefault: true,
	},
	// Disabling these until needed again
	'Control': {
		actionOnKeyDown: userInputActions.setKeys({ctrl: true}),
		actionOnKeyUp: userInputActions.setKeys({ctrl: false}),
		allowRepeat: false,
		preventDefault: false,
	},
	// 'Alt': {
	// 	actionOnKeyDown: userInputActions.setKeys({alt: true}),
	// 	actionOnKeyUp: userInputActions.setKeys({alt: false}),
	// 	allowRepeat: false,
	// 	preventDefault: false,
	// },
	// 'Shift': {
	// 	actionOnKeyDown: userInputActions.setKeys({shift: true}),
	// 	actionOnKeyUp: userInputActions.setKeys({shift: false}),
	// 	allowRepeat: false,
	// 	preventDefault: false,
	// },
	' ': {
		actionOnKeyDown: (_, state) => selectGlobalClockIsPlaying(state.room)
			? globalClockActions.stop()
			: globalClockActions.start(),
		allowRepeat: false,
		preventDefault: false,
	},
	// TODO Get it to play nice with better sequencer
	// [Control + Plus + ' ']: {
	// 	actionOnKeyDown: globalClockActions.restart(),
	// 	allowRepeat: false,
	// 	preventDefault: false,
	// },
})
	.merge(midiKeyShortcuts)
	.mapKeys(x => x.toLowerCase())

export function setupInputEventListeners(
	window: Window, store: Store<IClientAppState>, audioContext: AudioContext,
) {
	const isInputFocused = (): boolean => document.activeElement
		? document.activeElement.tagName === 'INPUT'
		: false

	window.addEventListener('mousedown', async _ => {
		if (audioContext.state === 'suspended') await audioContext.resume()
	})

	window.addEventListener('keydown', async e => {
		if (isInputFocused()) return
		if (audioContext.state === 'suspended') await audioContext.resume()
		onKeyEvent(e)
	})

	window.addEventListener('keyup', e => {
		// Don't block keyup when input is focused, or else music key might get stuck down
		onKeyEvent(e)
	})

	window.addEventListener('keypress', e => {
		if (isInputFocused()) return
		onKeyEvent(e)
	})

	window.addEventListener('blur', () => {
		store.dispatch(windowBlur())
	})

	function onKeyEvent(event: KeyboardEvent) {
		const prefix = ['Control'].includes(event.key)
			? ''
			:	event.shiftKey
				? Shift + Plus
				: event.ctrlKey || event.metaKey
					? Control + Plus
					: event.altKey
						? Alt + Plus
						: ''

		const keyboardShortcut = keyboardShortcuts.get(prefix + event.key.toLowerCase())

		if (!keyboardShortcut) return

		if (event.repeat && keyboardShortcut.allowRepeat === false) return

		if (selectIsLocalClientInLimitedMode(store.getState()) && keyboardShortcut.allowInLimitedMode !== true) return

		const actionPropToUse = getPropNameForEventType(event.type)
		const action = keyboardShortcut[actionPropToUse]

		if (!action) return

		if (typeof action === 'function') {
			const actualAction = action(event, store.getState())
			if (actualAction !== undefined) {
				store.dispatch(actualAction)
			}
		} else {
			store.dispatch(action)
		}

		if (!isInputFocused() && keyboardShortcut.preventDefault) {
			event.preventDefault()
		}
	}

	const mouseMoveUpdateIntervalMs = 50

	const onMouseMove = (e: MouseEvent) => dispatchPointersUpdate(e.clientX, e.clientY)
	window.addEventListener('mousemove', rateLimitedDebounce(onMouseMove, mouseMoveUpdateIntervalMs))

	const onWheel = () => setTimeout(() => dispatchPointersUpdate(), 0)
	window.addEventListener('wheel', rateLimitedDebounce(onWheel, mouseMoveUpdateIntervalMs))

	let lastMousePosition = {
		x: 0,
		y: 0,
	}

	function dispatchPointersUpdate(
		x = lastMousePosition.x, y = lastMousePosition.y
	) {
		const state = store.getState()

		if (selectClientInfo(state).isClientReady !== true) return

		const localClientId = selectLocalClient(state).id

		lastMousePosition = {x, y}

		store.dispatch(pointersActions.update(localClientId, mouseFromScreenToBoard({x, y})))
	}
}

function getPropNameForEventType(eventType: string) {
	switch (eventType) {
		case 'keydown': return 'actionOnKeyDown'
		case 'keyup': return 'actionOnKeyUp'
		case 'keypress': return 'actionOnKeyPress'
		default: throw new Error('unsupported eventType: ' + eventType)
	}
}
