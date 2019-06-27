import React from 'react'
import {Dispatch} from 'redux'
import {BuiltInBQFilterType} from '../../../common/OscillatorTypes'
import {
	getConnectionNodeInfo, selectSimpleDelay, setSimpleDelayParam,
	shamuConnect, SimpleDelayParam, SimpleDelayState,
} from '../../../common/redux'
import {adsrValueToString, percentageValueString} from '../../client-constants'
import {Knob} from '../../Knob/Knob'
import {Panel} from '../../Panel/Panel'

interface ISimpleDelayProps {
	color: string
	id: string
}

interface ISimpleDelayReduxProps {
	isPlaying: boolean
	timeLeft: number
	timeRight: number
	feedback: number
	bpmSync: boolean
	mix: number
	link: boolean
	filterFreq: number
	filterQ: number
	filterType: BuiltInBQFilterType
	pingPong: boolean
}

interface ISimpleDelayDispatchProps {
	changeParam: (paramType: SimpleDelayParam, value: number) => void
}

type ISimpleDelayAllProps = ISimpleDelayProps & ISimpleDelayReduxProps & ISimpleDelayDispatchProps

export const SimpleDelayView: React.FC<ISimpleDelayAllProps> =
	React.memo(function _SimpleDelayView(props) {
		return (
			<Panel
				className={`${props.isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				id={props.id}
				color={props.color}
				saturate={props.isPlaying}
				label="Delay"
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						padding: '0 8px',
						width: '100%',
						justifyContent: 'space-around',
					}}
				>
					<Knob
						label="Left Time"
						min={0.001}
						max={5}
						curve={4}
						value={props.timeLeft}
						defaultValue={SimpleDelayState.defaultTimeLeft}
						onChange={props.changeParam}
						onChangeId={SimpleDelayParam.timeLeft}
						tooltip="How long the audio is delayed before you hear it again"
						valueString={adsrValueToString}
					/>
					{/* <Knob
						label="Right Time"
						min={0.001}
						max={5}
						curve={4}
						value={props.timeRight}
						defaultValue={SimpleDelayState.defaultTimeRight}
						onChange={props.changeParam}
						onChangeId={SimpleDelayParam.timeRight}
						tooltip="How long the audio is delayed before you hear it again"
						valueString={adsrValueToString}
					/> */}
					<Knob
						label="Feedback"
						min={0}
						max={0.95}
						value={props.feedback}
						defaultValue={SimpleDelayState.defaultFeedback}
						onChange={props.changeParam}
						onChangeId={SimpleDelayParam.feedback}
						tooltip="Higher values mean things echo more times"
						valueString={percentageValueString}
					/>
					<Knob
						label="Mix"
						min={0}
						max={1}
						value={props.mix}
						defaultValue={SimpleDelayState.defaultMix}
						onChange={props.changeParam}
						onChangeId={SimpleDelayParam.mix}
						tooltip="The mix of dry and wet (0% is all dry and 100% is all wet)"
						valueString={percentageValueString}
					/>
				</div>
			</Panel>
		)
	})

export const ConnectedSimpleDelay = shamuConnect(
	(state, {id}: ISimpleDelayProps): ISimpleDelayReduxProps => {
		const simpleDelayState = selectSimpleDelay(state.room, id)

		return {
			isPlaying: getConnectionNodeInfo(simpleDelayState.type)
				.selectIsPlaying(state.room, id),
			timeLeft: simpleDelayState.timeLeft,
			timeRight: simpleDelayState.timeRight,
			feedback: simpleDelayState.feedback,
			bpmSync: simpleDelayState.bpmSync,
			mix: simpleDelayState.mix,
			link: simpleDelayState.link,
			filterFreq: simpleDelayState.filterFreq,
			filterQ: simpleDelayState.filterQ,
			filterType: simpleDelayState.filterType,
			pingPong: simpleDelayState.pingPong,
		}
	},
	(dispatch: Dispatch, {id}: ISimpleDelayProps): ISimpleDelayDispatchProps => ({
		changeParam: (paramType: SimpleDelayParam, value: number) => dispatch(setSimpleDelayParam(id, paramType, value)),
	}),
)(SimpleDelayView)
