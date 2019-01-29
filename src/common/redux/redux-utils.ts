import {isEqual} from 'lodash'
import {
	connect, DispatchProp, InferableComponentEnhancer,
	InferableComponentEnhancerWithProps, MapDispatchToPropsNonObject,
	MapDispatchToPropsParam, MapStateToPropsParam, MergeProps, Options, ResolveThunks,
} from 'react-redux'
import {Action} from 'redux'
import {createSelectorCreator, defaultMemoize} from 'reselect'
import {IClientAppState} from './index'

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

/**
 * Will dispatch on the server.
 * Use if you want the server to remember the result of dispatching this action.
 */
export const SERVER_ACTION = 'SERVER_ACTION'

/**
 * Will be dispatched on all other clients.
 * Use if you want other clients to see the result of dispatching this action.
 */
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

interface ShamuConnect2 {
	(): InferableComponentEnhancer<DispatchProp>

	<TStateProps = {}, no_dispatch = {}, TOwnProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
	): InferableComponentEnhancerWithProps<TStateProps & DispatchProp, TOwnProps>

	<no_state = {}, TDispatchProps = {}, TOwnProps = {}>(
		mapStateToProps: null | undefined,
		mapDispatchToProps: MapDispatchToPropsNonObject<TDispatchProps, TOwnProps>,
	): InferableComponentEnhancerWithProps<TDispatchProps, TOwnProps>

	<no_state = {}, TDispatchProps = {}, TOwnProps = {}>(
		mapStateToProps: null | undefined,
		mapDispatchToProps: TDispatchProps,
	): InferableComponentEnhancerWithProps<
		ResolveThunks<TDispatchProps>,
		TOwnProps
	>

	<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
		mapDispatchToProps: MapDispatchToPropsNonObject<TDispatchProps, TOwnProps>,
	): InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>

	<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
		mapDispatchToProps: TDispatchProps,
	): InferableComponentEnhancerWithProps<
		TStateProps & ResolveThunks<TDispatchProps>,
		TOwnProps
	>

	<TStateProps = {}, no_dispatch = {}, TOwnProps = {}, TMergedProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
		mapDispatchToProps: null | undefined,
		mergeProps: MergeProps<TStateProps, undefined, TOwnProps, TMergedProps>,
	): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>

	<no_state = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}>(
		mapStateToProps: null | undefined,
		mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
		mergeProps: MergeProps<undefined, TDispatchProps, TOwnProps, TMergedProps>,
	): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>

	<no_state = {}, no_dispatch = {}, TOwnProps = {}, TMergedProps = {}>(
		mapStateToProps: null | undefined,
		mapDispatchToProps: null | undefined,
		mergeProps: MergeProps<undefined, undefined, TOwnProps, TMergedProps>,
	): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>

	<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, TMergedProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
		mapDispatchToProps: MapDispatchToPropsParam<TDispatchProps, TOwnProps>,
		mergeProps: MergeProps<TStateProps, TDispatchProps, TOwnProps, TMergedProps>,
		options?: Options<State, TStateProps, TOwnProps, TMergedProps>,
	): InferableComponentEnhancerWithProps<TMergedProps, TOwnProps>

	<TStateProps = {}, no_dispatch = {}, TOwnProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
		mapDispatchToProps: null | undefined,
		mergeProps: null | undefined,
		options: Options<State, TStateProps, TOwnProps>,
	): InferableComponentEnhancerWithProps<DispatchProp & TStateProps, TOwnProps>

	<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}>(
		mapStateToProps: null | undefined,
		mapDispatchToProps: MapDispatchToPropsNonObject<TDispatchProps, TOwnProps>,
		mergeProps: null | undefined,
		options: Options<{}, TStateProps, TOwnProps>,
	): InferableComponentEnhancerWithProps<TDispatchProps, TOwnProps>

	<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}>(
		mapStateToProps: null | undefined,
		mapDispatchToProps: TDispatchProps,
		mergeProps: null | undefined,
		options: Options<{}, TStateProps, TOwnProps>,
	): InferableComponentEnhancerWithProps<
		ResolveThunks<TDispatchProps>,
		TOwnProps
	>

	<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
		mapDispatchToProps: MapDispatchToPropsNonObject<TDispatchProps, TOwnProps>,
		mergeProps: null | undefined,
		options: Options<State, TStateProps, TOwnProps>,
	): InferableComponentEnhancerWithProps<TStateProps & TDispatchProps, TOwnProps>

	<TStateProps = {}, TDispatchProps = {}, TOwnProps = {}, State = IClientAppState>(
		mapStateToProps: MapStateToPropsParam<TStateProps, TOwnProps, State>,
		mapDispatchToProps: TDispatchProps,
		mergeProps: null | undefined,
		options: Options<State, TStateProps, TOwnProps>,
	): InferableComponentEnhancerWithProps<
		TStateProps & ResolveThunks<TDispatchProps>,
		TOwnProps
	>
}

export const shamuConnect = connect as ShamuConnect2
