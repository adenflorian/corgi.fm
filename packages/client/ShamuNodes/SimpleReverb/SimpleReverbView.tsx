import {stripIndents} from 'common-tags'
import {List} from 'immutable'
import React from 'react'
import {Dispatch} from 'redux'
import {allBuiltInBQFilterTypes} from '@corgifm/common/OscillatorTypes'
import {
	findNodeInfo, selectSimpleReverb, setSimpleReverbParam,
	shamuConnect, SimpleReverbParam, SimpleReverbState,
} from '@corgifm/common/redux'
import {adsrValueToString, filterValueToString, percentageValueString} from '../../client-constants'
import {Knob} from '../../Knob/Knob'
import {KnobSnapping} from '../../Knob/KnobSnapping'
import {Panel} from '../../Panel/Panel'

interface ISimpleReverbProps {
	color: string
	id: Id
}

interface ISimpleReverbReduxProps {
	isPlaying: boolean
	lpf: number
	time: number
	dry: number
	wet: number
	reverse: boolean
	decay: number
	filterType: BiquadFilterType
}

interface ISimpleReverbDispatchProps {
	changeParam: (paramType: SimpleReverbParam, value: number | string | boolean) => void
}

type ISimpleReverbAllProps = ISimpleReverbProps & ISimpleReverbReduxProps & ISimpleReverbDispatchProps

export const SimpleReverbView: React.FC<ISimpleReverbAllProps> =
	React.memo(function _SimpleReverbView({id, color, isPlaying, time, lpf, changeParam, dry, wet, reverse, decay, filterType}) {
		return (
			<Panel
				className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				id={id}
				color={color}
				saturate={isPlaying}
				label="Reverb"
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
					}}
				>
					<Knob
						label="Time"
						min={0}
						max={30}
						curve={3}
						value={time}
						defaultValue={5}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.time}
						tooltip="Length of reverb in seconds"
						valueString={adsrValueToString}
					/>
					<Knob
						label="Decay"
						min={0}
						max={42}
						value={decay}
						defaultValue={SimpleReverbState.defaultDecay}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.decay}
						tooltip={stripIndents`How fast the reverb decays
							Higher value means faster decay`}
					/>
					<Knob
						label="Filter"
						min={0}
						max={20000}
						curve={2}
						value={lpf}
						defaultValue={2000}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.lowPassFilterCutoffFrequency}
						tooltip="Changes the sound in some way..."
						valueString={filterValueToString}
					/>
					<KnobSnapping
						label="Filter Type"
						value={filterType}
						defaultIndex={0}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.filterType}
						tooltip="So many filters..."
						possibleValues={allBuiltInBQFilterTypes}
					/>
					<KnobSnapping
						label="Reverse"
						value={reverse}
						defaultIndex={0}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.reverse}
						tooltip="Reverses the impulse, causing the reverb to play backwards"
						possibleValues={List([false, true])}
					/>
					<Knob
						label="Dry"
						min={0}
						max={1}
						value={dry}
						defaultValue={SimpleReverbState.defaultDry}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.dry}
						tooltip="How much of the original sound do you want to hear?"
						valueString={percentageValueString}
					/>
					<Knob
						label="Wet"
						min={0}
						max={1}
						value={wet}
						defaultValue={SimpleReverbState.defaultWet}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.wet}
						tooltip="How much of the reverberated goodness do you want to hear?"
						valueString={percentageValueString}
					/>
				</div>
			</Panel>
		)
	})

export const ConnectedSimpleReverb = shamuConnect(
	(state, {id}: ISimpleReverbProps): ISimpleReverbReduxProps => {
		const simpleReverbState = selectSimpleReverb(state.room, id)

		return {
			isPlaying: findNodeInfo(simpleReverbState.type)
				.selectIsPlaying(state.room, id),
			lpf: simpleReverbState.lowPassFilterCutoffFrequency,
			time: simpleReverbState.time,
			dry: simpleReverbState.dry,
			wet: simpleReverbState.wet,
			reverse: simpleReverbState.reverse,
			decay: simpleReverbState.decay,
			filterType: simpleReverbState.filterType,
		}
	},
	(dispatch: Dispatch, {id}: ISimpleReverbProps): ISimpleReverbDispatchProps => ({
		changeParam: (paramType: SimpleReverbParam, value: number | string | boolean) => dispatch(setSimpleReverbParam(id, paramType, value)),
	}),
)(SimpleReverbView)

// private readonly _dispatchChangeInstrumentParam = (paramType: BasicSamplerParam, value: any) =>
// this.props.dispatch(setBasicSamplerParam(this.props.id, paramType, value))
