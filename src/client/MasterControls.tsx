import * as React from 'react'
import {connect} from 'react-redux'
import {playAll, stopAll} from '../common/redux/common-actions'
import {Panel} from './Panel'

interface IMasterControlsProps {
	onPlay: () => void,
	onStop: () => void
}

export const MasterControls = ({onPlay, onStop}: IMasterControlsProps) =>
	<Panel className="masterControls" color="lightGray">
		<div style={{margin: 8}}>
			<div>
				Master Controls
			</div>
			<span
				className="play"
				onClick={() => onPlay()}
			>
				▶
			</span>
			<span
				className="stop"
				onClick={() => onStop()}
			>
				◼
			</span>
		</div>
	</Panel>

export const ConnectedMasterControls = connect(
	null,
	{onPlay: playAll, onStop: stopAll},
)(MasterControls)
