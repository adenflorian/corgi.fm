import * as React from 'react'
import {Dispatch} from 'redux'
import {selectConnectionSourceColorByTargetId, selectConnectionSourceNotesByTargetId, selectSimpleReverb, setSimpleReverbParam, shamuConnect, SimpleReverbParam} from '../../../common/redux'
import {Knob} from '../../Knob/Knob'
import {Panel} from '../../Panel/Panel'

interface ISimpleReverbProps {
	id: string
}

interface ISimpleReverbReduxProps {
	color: string
	isPlaying: boolean
	lpf: number
	time: number
}

interface ISimpleReverbDispatchProps {
	changeParam: (paramType: SimpleReverbParam, value: number) => void
}

type ISimpleReverbAllProps = ISimpleReverbProps & ISimpleReverbReduxProps & ISimpleReverbDispatchProps

export const SimpleReverbView: React.FC<ISimpleReverbAllProps> =
	({id, color, isPlaying, time, lpf, changeParam}) => {
		return (
			<Panel
				className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				id={id}
				color={color}
				saturate={isPlaying}
			>
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						padding: '0 8px',
					}}
				>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						Simple Reverb (Convolution)
				</div>
					<Knob
						label="time"
						min={0}
						max={30}
						curve={3}
						value={time}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.time}
					/>
					<Knob
						label="lpf"
						min={0}
						max={10000}
						curve={2}
						value={lpf}
						onChange={changeParam}
						onChangeId={SimpleReverbParam.lowPassFilterCutoffFrequency}
					/>
				</div>
			</Panel>
		)
	}

export const ConnectedSimpleReverb = shamuConnect(
	(state, {id}: ISimpleReverbProps): ISimpleReverbReduxProps => {
		const simpleReverbState = selectSimpleReverb(state.room, id)

		return {
			color: selectConnectionSourceColorByTargetId(state.room, id),
			isPlaying: selectConnectionSourceNotesByTargetId(state.room, id).count() > 0,
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
