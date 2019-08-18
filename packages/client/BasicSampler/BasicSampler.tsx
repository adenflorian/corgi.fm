import React from 'react'
import {useSelector} from 'react-redux'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	IClientAppState, findNodeInfo,
} from '@corgifm/common/redux'
import {Panel} from '../Panel/Panel'
import {
	ConnectedNoteSchedulerVisualPlaceholder,
} from '../WebAudio/SchedulerVisual'
import './BasicSampler.less'
import {Samples} from './Samples'
import {SamplerControls} from './SamplerControls'

interface Props {
	color: string
	id: Id
}

const samplerInfo = findNodeInfo(ConnectionNodeType.basicSampler)

const name = findNodeInfo(ConnectionNodeType.basicSampler).typeName

export const BasicSampler = React.memo(({id, color}: Props) => {

	const isPlaying = useSelector((state: IClientAppState) => samplerInfo
		.selectIsPlaying(state.room, id))

	return (
		<React.Fragment>
			<Panel
				className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
				id={id}
				color={color}
				saturate={isPlaying}
				label={name}
			>
				<div className="basicSampler">
					<Samples samplerId={id} />
					<SamplerControls id={id} />
				</div>
			</Panel>
			<ConnectedNoteSchedulerVisualPlaceholder id={id} />
		</React.Fragment>
	)
})
