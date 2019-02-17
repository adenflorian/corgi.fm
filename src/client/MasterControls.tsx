import * as React from 'react'
import {
	IoMdPlay as Play, IoMdSquare as Stop,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {
	IClientAppState, MASTER_CLOCK_SOURCE_ID,
	restartGlobalClock, selectGlobalClockState, setGlobalClockIsPlaying,
} from '../common/redux'
import './MasterControls.less'
import {Panel} from './Panel/Panel'

interface IMasterControlsProps {
	color: string
}

interface IMasterControlsReduxProps {
	isPlaying: boolean
	index: number
}

interface IMasterControlsDispatchProps {
	onPlay: () => void
	restart: () => void
	onStop: () => void
}

export const MasterControls: React.FC<IMasterControlsProps & IMasterControlsReduxProps & IMasterControlsDispatchProps> =
	React.memo(({onPlay, restart, onStop, isPlaying, color, index}) =>
		<Panel
			id={MASTER_CLOCK_SOURCE_ID}
			color={color}
			saturate={isPlaying}
			className={`${isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
		>
			<div className="masterControls">
				<div className="masterControls-label colorize">
					Master Clock
				</div>
				<div className="controls">
					<span
						className={`play ${index % 2 === 0 ? 'highlight' : ''}`}
						onClick={isPlaying ? restart : onPlay}
						title="Start (Space) or Restart (Ctrl + Space)"
					>
						<Play />
					</span>
					<span
						className="stop"
						onClick={() => onStop()}
						title="Stop (Space)"
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
			isPlaying: globalClock.isPlaying,
			index: globalClock.index,
		}
	},
	{
		onPlay: () => setGlobalClockIsPlaying(true),
		restart: () => restartGlobalClock(),
		onStop: () => setGlobalClockIsPlaying(false),
	},
)(MasterControls)
