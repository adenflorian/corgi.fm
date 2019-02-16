import * as React from 'react'
import {
	IoMdPlay as Play, IoMdSquare as Stop,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {
	IClientAppState, MASTER_CLOCK_SOURCE_ID, playAll,
	selectIsAnythingPlaying, stopAll,
} from '../common/redux'
import './MasterControls.less'
import {Panel} from './Panel/Panel'

interface IMasterControlsProps {
	color: string
}

interface IMasterControlsReduxProps {
	isAnythingPlaying: boolean
}

interface IMasterControlsDispatchProps {
	onPlay: () => void
	onStop: () => void
}

export const MasterControls: React.FC<IMasterControlsProps & IMasterControlsReduxProps & IMasterControlsDispatchProps> =
	React.memo(({onPlay, onStop, isAnythingPlaying, color}) =>
		<Panel
			id={MASTER_CLOCK_SOURCE_ID}
			color={color}
			saturate={isAnythingPlaying}
		>
			<div className="masterControls">
				<div className="masterControls-label">
					Master Clock
				</div>
				<div className="controls">
					<span
						className="play"
						onClick={() => onPlay()}
					>
						<Play />
					</span>
					<span
						className="stop"
						onClick={() => onStop()}
					>
						<Stop />
					</span>
				</div>
			</div>
		</Panel>,
	)

export const ConnectedMasterControls = connect(
	(state: IClientAppState): IMasterControlsReduxProps => ({
		isAnythingPlaying: selectIsAnythingPlaying(state.room),
	}),
	{onPlay: playAll, onStop: stopAll},
)(MasterControls)
