import * as React from 'react'
import {
	IoMdPlay as Play, IoMdSquare as Stop,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {playAll, stopAll} from '../common/redux/common-actions'
import {IClientAppState} from '../common/redux/common-redux-types'
import {ConnectionNodeType, getConnectionNodeInfo, MASTER_CLOCK_SOURCE_ID} from '../common/redux/connections-redux'
import {selectIsAnythingPlaying} from '../common/redux/grid-sequencers-redux'
import './MasterControls.less'
import {Panel} from './Panel/Panel'

interface IMasterControlsReduxProps {
	isAnythingPlaying: boolean
	color: string
}

interface IMasterControlsDispatchProps {
	onPlay: () => void
	onStop: () => void
}

export const MasterControls: React.FunctionComponent<IMasterControlsReduxProps & IMasterControlsDispatchProps> =
	({onPlay, onStop, isAnythingPlaying, color}) =>
		<div
			className={
				`masterControls ` +
				`${isAnythingPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`
			}
		>
			<Panel
				id={MASTER_CLOCK_SOURCE_ID}
				color={color}
			>
				<div>
					<div style={{margin: 8, marginBottom: 0}}>
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
			</Panel>
		</div>

export const ConnectedMasterControls = connect(
	(state: IClientAppState): IMasterControlsReduxProps => ({
		isAnythingPlaying: selectIsAnythingPlaying(state.room),
		color: getConnectionNodeInfo(ConnectionNodeType.masterClock)
			.stateSelector(state.room, MASTER_CLOCK_SOURCE_ID)
			.color,
	}),
	{onPlay: playAll, onStop: stopAll},
)(MasterControls)
