import {Map} from 'immutable'
import {ActionType} from 'typesafe-actions'
import {IClientAppState} from './common-redux-types'
import {LocalAction} from '.'

export const animationActions = {
	trigger: (parentId: AnimKey, uid: AnimKey) => ({
		type: 'TRIGGER_ANIMATION',
		parentId,
		uid,
	} as const),
} as const

type AnimKey = Id | string | number

const makeAnimationState = () =>
	Map<AnimKey, Map<AnimKey, number>>()

interface AnimationState extends ReturnType<typeof makeAnimationState> {}

export type AnimationAction = ActionType<typeof animationActions> | LocalAction

export const animationReducer = (
	state = makeAnimationState(), action: AnimationAction
): AnimationState => {
	switch (action.type) {
		case 'TRIGGER_ANIMATION':
			return animate(state, action.parentId, action.uid)
		case 'PLAY_SHORT_NOTE_ON_TARGET':
			return animate(state, action.targetId, action.note)
		default: return state
	}
}

function animate(state: AnimationState, parentId: AnimKey, uid: AnimKey) {
	return state.updateIn(
		[parentId, uid],
		x => x === undefined ? 1 : x + 1)
}

export function createAnimationFrameSelector(parentId: AnimKey, uid: AnimKey) {
	return (state: IClientAppState): number =>
		state.animation.getIn([parentId, uid], 0) as number
}
