import {Map, Record, Set} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {IClientAppState} from './common-redux-types'
import {LocalAction} from '.'

export const animationActions = {
	trigger: (parentIds: Set<AnimKey>, uid: AnimKey) => ({
		type: 'TRIGGER_ANIMATION',
		parentIds,
		uid,
	} as const),
	on: (parentIds: Set<AnimKey>, uid: AnimKey) => ({
		type: 'ANIMATION_ON',
		parentIds,
		uid,
	} as const),
	off: (parentIds: Set<AnimKey>, uid: AnimKey) => ({
		type: 'ANIMATION_OFF',
		parentIds,
		uid,
	} as const),
} as const

type AnimKey = Id | string | number

const defaultAnimValue = Object.freeze({
	frame: 0,
	flag: false,
})

const makeAnimValue = Record(defaultAnimValue)

type AnimValue = typeof defaultAnimValue

const makeAnimationState = () =>
	Map<AnimKey, Map<AnimKey, AnimValue>>()

interface AnimationState extends ReturnType<typeof makeAnimationState> {}

export type AnimationAction = ActionType<typeof animationActions> | LocalAction

export const animationReducer = (
	state = makeAnimationState(), action: AnimationAction
): AnimationState => {
	switch (action.type) {
		case 'TRIGGER_ANIMATION':
			return foo(state, action.parentIds, action.uid, animate)
		case 'PLAY_SHORT_NOTE_ON_TARGET':
			return foo(state, Set([action.targetId]), action.note, animate)
		case 'ANIMATION_ON':
			return foo(state, action.parentIds, action.uid, on)
		case 'ANIMATION_OFF':
			return foo(state, action.parentIds, action.uid, off)
		default: return state
	}
}

type BarBar = (state: AnimationState, parentId: AnimKey, uid: AnimKey) => AnimationState

function foo(state: AnimationState, parentIds: Set<AnimKey>, uid: AnimKey, bar: BarBar): AnimationState {
	return parentIds.reduce((result, parentId) => {
		return bar(result, parentId, uid)
	}, state)
}

function animate(state: AnimationState, parentId: AnimKey, uid: AnimKey) {
	return state.updateIn([parentId, uid], incrementAnimValue)
}

function incrementAnimValue(value?: AnimValue): AnimValue {
	return value
		? {...value, frame: value.frame + 1}
		: makeAnimValue()
}

function on(state: AnimationState, parentId: AnimKey, uid: AnimKey) {
	return state.updateIn([parentId, uid], makeAnimValueToggle(true))
}

function off(state: AnimationState, parentId: AnimKey, uid: AnimKey) {
	return state.updateIn([parentId, uid], makeAnimValueToggle(false))
}

function makeAnimValueToggle(flag: boolean) {
	const frameDelta = flag ? 1 : 0
	return (value: AnimValue): AnimValue => value
		? {...value, flag, frame: value.frame + frameDelta}
		: makeAnimValue({flag})
}

export function createAnimationFrameSelector(parentId: AnimKey, uid: AnimKey) {
	return (state: IClientAppState): number =>
		(state.animation.getIn([parentId, uid], 0) as AnimValue).frame
}

export function createAnimationFlagSelector(parentId: AnimKey, uid: AnimKey) {
	return (state: IClientAppState): boolean =>
		(state.animation.getIn([parentId, uid], 0) as AnimValue).flag
}
