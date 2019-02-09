import * as React from 'react'
import {shamuConnect} from '../../../common/redux'
import {Knob} from '../../Knob/Knob'
import {Panel} from '../../Panel/Panel'

interface ISimpleReverbProps {
	id: string
}

interface ISimpleReverbReduxProps {
	color: string
	isPlaying: boolean
}

type ISimpleReverbAllProps = ISimpleReverbProps & ISimpleReverbReduxProps

export const SimpleReverbView: React.FC<ISimpleReverbAllProps> = ({id, color, isPlaying}) => {
	return (
		<Panel
			className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
			id={id}
			color={color}
			saturate={isPlaying}
		>
			<Knob
				label="time"
				min={0}
				max={30}
				curve={3}
				readOnly={true}
				value={5}
			/>
			<Knob
				label="lpf"
				min={0}
				max={10000}
				curve={2}
				value={10000}
			// onChange={this._dispatchChangeInstrumentParam}
			// onChangeId={BasicSynthesizerParam.lowPassFilterCutoffFrequency}
			/>
		</Panel>
	)
}

export const ConnectedSimpleReverb = shamuConnect(
	(state, {id}: ISimpleReverbProps): ISimpleReverbReduxProps => {
		// const samplerState = selectSampler(state.room, id)

		return {
			color: 'red',
			isPlaying: false,
			// color: selectConnectionSourceColorByTargetId(state.room, id),
			// isPlaying: selectConnectionSourceNotesByTargetId(state.room, id).count() > 0,
		}
	},
)(SimpleReverbView)
