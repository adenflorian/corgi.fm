import * as React from 'react'
import {Dispatch} from 'redux'
import {
	getConnectionNodeInfo, selectSimpleReverb, setSimpleReverbParam,
	shamuConnect, SimpleReverbParam,
} from '../../../common/redux'
import {adsrValueToString, filterValueToString} from '../../client-constants'
import {Knob} from '../../Knob/Knob'
import {Panel} from '../../Panel/Panel'

interface ISimpleReverbProps {
	color: string
	id: string
}

interface ISimpleReverbReduxProps {
	isPlaying: boolean
	lpf: number
	time: number
}

interface ISimpleReverbDispatchProps {
	changeParam: (paramType: SimpleReverbParam, value: number) => void
}

type ISimpleReverbAllProps = ISimpleReverbProps & ISimpleReverbReduxProps & ISimpleReverbDispatchProps

export const SimpleReverbView: React.FC<ISimpleReverbAllProps> =
	React.memo(function _SimpleReverbView({id, color, isPlaying, time, lpf, changeParam}) {
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
						tooltip="Length or reverb in seconds"
						valueString={adsrValueToString}
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
						tooltip="Low pass filter"
						valueString={filterValueToString}
					/>
				</div>
			</Panel>
		)
	})

export const ConnectedSimpleReverb = shamuConnect(
	(state, {id}: ISimpleReverbProps): ISimpleReverbReduxProps => {
		const simpleReverbState = selectSimpleReverb(state.room, id)

		return {
			isPlaying: getConnectionNodeInfo(simpleReverbState.type)
				.selectIsPlaying(state.room, id),
			lpf: simpleReverbState.lowPassFilterCutoffFrequency,
			time: simpleReverbState.time,
		}
	},
	(dispatch: Dispatch, {id}: ISimpleReverbProps): ISimpleReverbDispatchProps => ({
		changeParam: (paramType: SimpleReverbParam, value: number) => dispatch(setSimpleReverbParam(id, paramType, value)),
	}),
)(SimpleReverbView)

	// private readonly _dispatchChangeInstrumentParam = (paramType: BasicSamplerParam, value: any) =>
	// this.props.dispatch(setBasicSamplerParam(this.props.id, paramType, value))
