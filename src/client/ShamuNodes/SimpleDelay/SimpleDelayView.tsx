import React from 'react'
import {Dispatch} from 'redux'
import {
	getConnectionNodeInfo, selectSimpleDelay, setSimpleDelayParam,
	shamuConnect, SimpleDelayParam, SimpleDelayState,
} from '../../../common/redux'
import {Knob} from '../../Knob/Knob'
import {Panel} from '../../Panel/Panel'

interface ISimpleDelayProps {
	color: string
	id: string
}

interface ISimpleDelayReduxProps {
	isPlaying: boolean
	time: number
}

interface ISimpleDelayDispatchProps {
	changeParam: (paramType: SimpleDelayParam, value: number) => void
}

type ISimpleDelayAllProps = ISimpleDelayProps & ISimpleDelayReduxProps & ISimpleDelayDispatchProps

export const SimpleDelayView: React.FC<ISimpleDelayAllProps> =
	React.memo(function _SimpleDelayView({id, color, isPlaying, time, changeParam}) {
		return (
			<Panel
				className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				id={id}
				color={color}
				saturate={isPlaying}
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
						label="Time"
						min={0}
						max={5}
						value={time}
						defaultValue={SimpleDelayState.defaultTime}
						onChange={changeParam}
						onChangeId={SimpleDelayParam.time}
						tooltip="How long the audio is delayed before you hear it again"
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
			time: simpleDelayState.time,
		}
	},
	(dispatch: Dispatch, {id}: ISimpleDelayProps): ISimpleDelayDispatchProps => ({
		changeParam: (paramType: SimpleDelayParam, value: number) => dispatch(setSimpleDelayParam(id, paramType, value)),
	}),
)(SimpleDelayView)
