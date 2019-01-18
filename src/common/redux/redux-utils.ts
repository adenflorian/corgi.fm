import {isEqual} from 'lodash'
import {connect, DispatchProp, InferableComponentEnhancerWithProps, MapStateToPropsParam} from 'react-redux'
import {Action} from 'redux'
import {createSelectorCreator, defaultMemoize} from 'reselect'
import {IClientAppState} from './common-redux-types'

export function makeActionCreator(type: string, ...argNames: any[]) {
	argNames.forEach(arg => {
		if (arg === 'type') {
			throw new Error(`can't make arg name *type*, because it's reserved for the action type`)
		}
	})
	return (...args: any[]): Action => {
		const action: ISomeAction = {type}
		argNames.forEach((arg, index) => {
			action[arg] = args[index]
		})
		return action
	}
}

interface ISomeAction extends Action {
	[key: string]: any
}

export const SERVER_ACTION = 'SERVER_ACTION'
export const BROADCASTER_ACTION = 'BROADCASTER_ACTION'

export enum NetworkActionType {
	SERVER_ACTION = 'SERVER_ACTION',
	BROADCASTER = 'BROADCASTER_ACTION',
	SERVER_AND_BROADCASTER = 'SERVER_AND_BROADCASTER',
	NO = 'NO',
}

export interface IReducerHandlers<S> {
	[key: string]: (state: S, action: Action | any) => S
}

export function createReducer<S>(initialState: S, handlers: IReducerHandlers<S>) {
	return function reducer(state = initialState, action: Action): S {
		if (handlers.hasOwnProperty(action.type)) {
			return handlers[action.type](state, action)
		} else {
			return state
		}
	}
}

export const createDeepEqualSelector = createSelectorCreator(
	defaultMemoize,
	isEqual,
)

type shamuConnect2 = <TStateProps = {}, no_dispatch = {}, TOwnProps = {}, State = IClientAppState>(
	mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
) => InferableComponentEnhancerWithProps<TStateProps & DispatchProp, TOwnProps>

export const shamuConnect = connect as shamuConnect2
