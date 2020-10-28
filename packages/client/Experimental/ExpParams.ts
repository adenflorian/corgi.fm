import React, {useContext} from 'react'
import * as Immutable from 'immutable'
import {SignalRange} from '@corgifm/common/common-types'
import {
	clampPolarized, CurveFunctions, defaultBipolarCurveFunctions,
	defaultUnipolarCurveFunctions,
} from '@corgifm/common/common-utils'
import {ButtonSelectOption} from '../ButtonSelect/ButtonSelect'
import {CorgiNumberChangedEvent, CorgiEnumChangedEvent, CorgiStringChangedEvent,
	CorgiObjectChangedEvent, ReadonlyCorgiNumberChangedEvent,
	ReadonlyCorgiObjectChangedEvent,
	ReadonlyCorgiStringChangedEvent,
	ReadonlyCorgiSetChangedEvent,
	CorgiSetChangedEvent} from './CorgiEvents'
import {LabAudioParam, KelpieAudioNode} from './Nodes/PugAudioNode/Lab'
import {ExpMidiClip, makeExpMidiClip} from '@corgifm/common/midi-types'
import {CorgiNode} from './CorgiNode'
import {nodeToNodeActions} from '@corgifm/common/server-constants'
import {ExpReferenceParamState, ExpReferenceTargetType,
	ExpMidiPatternViewState, ExpMidiTimelineClipState,
	ExpMidiTimelineTrackState} from '@corgifm/common/redux'
import {SeqPatternView, SeqPattern, SeqTimelineClip,
	SeqTimelineClips, SeqTimelineTrack} from '@corgifm/common/SeqStuff'

export interface ExpParam {
	readonly id: Id
}

export const AudioParamContext = React.createContext<null | ExpAudioParam>(null)

export function useAudioParamContext() {
	const context = useContext(AudioParamContext)

	if (!context) throw new Error(`missing audio param context, maybe there's no provider`)

	return context
}

export interface ExpAudioParamOptions {
	readonly valueString?: (v: number) => string
	readonly curveFunctions?: CurveFunctions
}

export type ExpAudioParams = ReadonlyMap<Id, ExpAudioParam>
export class ExpAudioParam<T extends KelpieAudioNode = KelpieAudioNode> implements ExpParam {
	public readonly onChange: CorgiNumberChangedEvent
	public readonly onModdedLiveValueChange: CorgiNumberChangedEvent
	public readonly valueString?: (v: number) => string
	public readonly curveFunctions: CurveFunctions
	public readonly defaultNormalizedValue: number

	public constructor(
		public readonly id: Id,
		public readonly audioParam: LabAudioParam<T>,
		public readonly defaultValue: number,
		public readonly maxValue: number,
		public readonly paramSignalRange: SignalRange,
		options: ExpAudioParamOptions = {},
	) {
		this.valueString = options.valueString
		this.curveFunctions = options.curveFunctions || (
			paramSignalRange === 'bipolar'
				? defaultBipolarCurveFunctions
				: defaultUnipolarCurveFunctions)

		this.defaultNormalizedValue = clampPolarized(this.curveFunctions.unCurve(defaultValue / maxValue), paramSignalRange)

		this.onChange = new CorgiNumberChangedEvent(this.defaultNormalizedValue)
		this.onModdedLiveValueChange = new CorgiNumberChangedEvent(this.defaultNormalizedValue)
	}
}

export type ExpCustomNumberParams = ReadonlyMap<Id, ExpCustomNumberParam>
export type ExpCustomNumberParamReadonly = ExpCustomNumberParam & {
	onChange: ReadonlyCorgiNumberChangedEvent
}
export interface ExpCustomNumberParamOptions {
	readonly hideFromDebugView?: boolean
	readonly curve?: number
	readonly valueString?: (v: number) => string
}
export class ExpCustomNumberParam {
	public get value() {return this.onChange.current}
	public readonly onChange: CorgiNumberChangedEvent
	public readonly curve: number
	public readonly valueString?: (v: number) => string

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: number,
		public readonly min: number,
		public readonly max: number,
		public readonly options: ExpCustomNumberParamOptions = {},
	) {
		this.curve = options.curve !== undefined ? options.curve : 1
		this.valueString = options.valueString

		this.onChange = new CorgiNumberChangedEvent(this.defaultValue)
	}
}

export interface NumberParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: number
}

export type ExpCustomEnumParams = ReadonlyMap<Id, ExpCustomEnumParam>
export class ExpCustomEnumParam<TEnum extends string = string> {
	public value: TEnum
	public readonly onChange: CorgiEnumChangedEvent<TEnum>

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: TEnum,
		public readonly options: readonly TEnum[],
	) {
		this.value = this.defaultValue
		this.onChange = new CorgiEnumChangedEvent(this.defaultValue)
	}

	public buildSelectOptions(): readonly ButtonSelectOption<TEnum>[] {
		return this.options.map((option): ButtonSelectOption<TEnum> => {
			return {
				label: option,
				value: option,
			}
		})
	}
}

export interface EnumParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: string
}

export type ExpCustomSetParams = ReadonlyMap<Id, ExpCustomSetParam>
export type ExpCustomSetParamReadonly<TElement> = ExpCustomSetParam<TElement> & {
	onChange: ReadonlyCorgiSetChangedEvent<TElement>
}
export class ExpCustomSetParam<TElement = any> {
	public value: Immutable.Set<TElement>
	public readonly onChange: CorgiSetChangedEvent<TElement>

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: Immutable.Set<TElement>,
	) {
		this.value = this.defaultValue
		this.onChange = new CorgiSetChangedEvent(this.defaultValue)
	}
}

export interface SetParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: Immutable.Set<unknown>
}

export type ExpCustomStringParams = ReadonlyMap<Id, ExpCustomStringParam>
export type ExpCustomStringParamReadonly = ExpCustomStringParam & {
	value: ReadonlyCorgiStringChangedEvent
}
export class ExpCustomStringParam {
	public readonly value: CorgiStringChangedEvent

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: string,
		public readonly showInDebugView = true,
	) {
		this.value = new CorgiStringChangedEvent(this.defaultValue)
	}
}

export interface StringParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: string
}

export type ExpMidiClipParams = ReadonlyMap<Id, ExpMidiClipParam>
export class ExpMidiClipParam {
	public readonly value: CorgiObjectChangedEvent<ExpMidiClip>

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: ExpMidiClip = makeExpMidiClip(),
	) {
		this.value = new CorgiObjectChangedEvent<ExpMidiClip>(this.defaultValue)
	}
}

export interface MidiClipParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: ExpMidiClip
}

export type ExpReferenceParams = ReadonlyMap<Id, ExpReferenceParam>
export type ExpReferenceParamReadonly<T extends IdObject> = ExpReferenceParam<T> & {
	value: ReadonlyCorgiObjectChangedEvent<T>
}
export class ExpReferenceParam<T extends IdObject = IdObject> {
	public readonly value: CorgiObjectChangedEvent<T>
	private _target?: CorgiObjectChangedEvent<T>

	public constructor(
		public readonly id: Id,
		public readonly defaultValue: T,
		public readonly targetType: ExpReferenceTargetType,
	) {
		this.value = new CorgiObjectChangedEvent<T>(this.defaultValue)
	}

	public readonly newTarget = (newTarget: CorgiObjectChangedEvent<T>) => {
		if (this._target) this._target.unsubscribe(this._onTargetUpdated)
		this._target = newTarget
		console.log({sub: this._target.subscribe, _target: this._target.subscribe, newTarget})
		this._target.subscribe(this._onTargetUpdated)
	}

	private readonly _onTargetUpdated = (updatedTarget: T) => {
		this.value.invokeImmediately(updatedTarget)
	}

	public readonly dispose = () => {
		if (this._target) this._target.unsubscribe(this._onTargetUpdated)
	}
}

export interface ExpReferenceParamChange {
	readonly nodeId: Id
	readonly paramId: Id
	readonly newValue: ExpReferenceParamState
}

export type ExpButtons = ReadonlyMap<Id, ExpButton>
export class ExpButton {
	public readonly onPress = new CorgiStringChangedEvent('not pressed')

	public constructor(
		public readonly id: Id,
		public readonly node: CorgiNode,
	) {}

	public readonly press = () => {
		const action = nodeToNodeActions.buttonPress(this.node.id, this.id)
		this.node.singletonContext.webSocketService.nodeToNode(action)
		this.onPress.invokeImmediately(action.pressId)
	}
}

export class SeqPatternViewContainer {
	public readonly patternView: CorgiObjectChangedEvent<SeqPatternView>

	constructor(
		patternViewState: ExpMidiPatternViewState,
		private _pattern: CorgiObjectChangedEvent<SeqPattern>,
	) {
		this.patternView = new CorgiObjectChangedEvent({
			...patternViewState.toJS(),
			pattern: this._pattern.current,
		})
		this._pattern.subscribe(this._onPatternUpdated)
	}

	public readonly changePattern = (newPattern: CorgiObjectChangedEvent<SeqPattern>) => {
		this._pattern.unsubscribe(this._onPatternUpdated)
		this._pattern = newPattern
		this._pattern.subscribe(this._onPatternUpdated)
	}

	public readonly update = (updatedPatternView: ExpMidiPatternViewState) => {
		this.patternView.invokeImmediately({
			...updatedPatternView.toJS(),
			pattern: this.patternView.current.pattern,
		})
	}

	private readonly _onPatternUpdated = (updatedPattern: SeqPattern) => {
		this.patternView.invokeImmediately({
			...this.patternView.current,
			pattern: updatedPattern,
		})
	}

	public readonly dispose = () => {
		this._pattern.unsubscribe(this._onPatternUpdated)
	}
}

export class SeqTimelineClipContainer {
	public readonly timelineClip: CorgiObjectChangedEvent<SeqTimelineClip>

	constructor(
		timelineClipState: ExpMidiTimelineClipState,
		private _patternView: SeqPatternViewContainer,
	) {
		this.timelineClip = new CorgiObjectChangedEvent({
			...timelineClipState.toJS() as SeqTimelineClip,
			patternView: this._patternView.patternView.current,
		} as SeqTimelineClip)
		this._patternView.patternView.subscribe(this._onPatternUpdated)
	}

	public readonly changePatternView = (newPatternView: SeqPatternViewContainer) => {
		this._patternView.patternView.unsubscribe(this._onPatternUpdated)
		this._patternView = newPatternView
		this._patternView.patternView.subscribe(this._onPatternUpdated)
	}

	public readonly update = (updatedClip: ExpMidiTimelineClipState) => {
		this.timelineClip.invokeImmediately({
			...updatedClip.toJS(),
			patternView: this.timelineClip.current.patternView,
		})
	}

	private readonly _onPatternUpdated = (updatedPatternView: SeqPatternView) => {
		this.timelineClip.invokeImmediately({
			...this.timelineClip.current,
			patternView: updatedPatternView,
		})
	}

	public readonly dispose = () => {
		this._patternView.patternView.unsubscribe(this._onPatternUpdated)
	}
}

export class SeqTimelineTrackContainer {
	public readonly timelineTrack: CorgiObjectChangedEvent<SeqTimelineTrack>

	constructor(
		timelineTrackState: ExpMidiTimelineTrackState,
		private _timelineClips: Immutable.Map<Id, SeqTimelineClipContainer>,
	) {
		this.timelineTrack = new CorgiObjectChangedEvent({
			...timelineTrackState.toJS(),
			timelineClips: this._timelineClips.map(x => x.timelineClip.current) as SeqTimelineClips,
		} as SeqTimelineTrack)
		this._timelineClips.forEach(x => x.timelineClip.subscribe(this._onClipUpdated))
	}

	public readonly addTimelineClip = (newClip: SeqTimelineClipContainer) => {
		const oldClip = this._timelineClips.get(newClip.timelineClip.current.id, null)
		if (oldClip) {
			oldClip.timelineClip.unsubscribe(this._onClipUpdated)
		}
		this._timelineClips = this._timelineClips.set(newClip.timelineClip.current.id, newClip)
		newClip.timelineClip.subscribe(this._onClipUpdated)
	}

	public readonly removeTimelineClip = (oldClip: SeqTimelineClipContainer) => {
		oldClip.timelineClip.unsubscribe(this._onClipUpdated)
		this._timelineClips = this._timelineClips.delete(oldClip.timelineClip.current.id)
	}

	public readonly update = (updatedTrack: ExpMidiTimelineTrackState) => {
		this.timelineTrack.invokeImmediately({
			...updatedTrack.toJS(),
			timelineClips: this.timelineTrack.current.timelineClips,
		})
	}

	private readonly _onClipUpdated = (updatedClip: SeqTimelineClip) => {
		this.timelineTrack.invokeImmediately({
			...this.timelineTrack.current,
			timelineClips: this.timelineTrack.current.timelineClips.set(updatedClip.id, updatedClip),
		})
	}

	public readonly dispose = () => {
		this._timelineClips.forEach(x => x.timelineClip.unsubscribe(this._onClipUpdated))
	}
}