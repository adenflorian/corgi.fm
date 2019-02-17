import * as React from 'react'
import {
	IoMdPlay as Play, IoMdSquare as Stop,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {
	IClientAppState, MASTER_CLOCK_SOURCE_ID, playAll,
	selectGlobalClockState, stopAll,
} from '../common/redux'
import './MasterControls.less'
import {Panel} from './Panel/Panel'

interface IMasterControlsProps {
	color: string
}

interface IMasterControlsReduxProps {
	isAnythingPlaying: boolean
	index: number
}

interface IMasterControlsDispatchProps {
	onPlay: () => void
	onStop: () => void
}

export const MasterControls: React.FC<IMasterControlsProps & IMasterControlsReduxProps & IMasterControlsDispatchProps> =
	React.memo(({onPlay, onStop, isAnythingPlaying, color, index}) =>
		<Panel
			id={MASTER_CLOCK_SOURCE_ID}
			color={color}
			saturate={isAnythingPlaying}
			className={`${isAnythingPlaying ? 'isPlaying' : 'isNotPlaying'}`}
		>
			<div className="masterControls">
				<div className="masterControls-label colorize">
					Master Clock
				</div>
				<div className="controls">
					<span
						className={`play ${index % 2 === 0 ? 'highlight' : ''}`}
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
	(state: IClientAppState): IMasterControlsReduxProps => {
		const globalClock = selectGlobalClockState(state.room)

		return {
			isAnythingPlaying: globalClock.isPlaying,
			// isAnythingPlaying: selectIsAnythingPlaying(state.room),
			index: globalClock.index,
		}
	},
	{onPlay: playAll, onStop: stopAll},
)(MasterControls)
