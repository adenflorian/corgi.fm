import * as React from 'react'
import {
	IoMdPlay as Play, IoMdSquare as Stop,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {
	globalClockActions, IClientAppState,
	IGlobalClockState,
	MASTER_CLOCK_SOURCE_ID,
	selectGlobalClockState,
} from '../common/redux'
import {isNewNoteScannerEnabled} from './is-prod-client'
import {Knob} from './Knob/Knob'
import './MasterControls.less'
import {Panel} from './Panel/Panel'

interface IMasterControlsProps {
	color: string
}

interface IMasterControlsReduxProps {
	masterClockState: IGlobalClockState
}

interface IMasterControlsDispatchProps {
	onPlay: typeof globalClockActions.start
	restart: typeof globalClockActions.restart
	onStop: typeof globalClockActions.stop
	setField: typeof globalClockActions.update
}

export const MasterControls: React.FC<IMasterControlsProps & IMasterControlsReduxProps & IMasterControlsDispatchProps> =
	React.memo(function _MasterControls({onPlay, restart, onStop, setField, masterClockState, color}) {

		const knobs = <div className="knobs">
			<Knob
				label="BPM"
				min={0.000001}
				max={999}
				curve={2}
				value={masterClockState.bpm}
				defaultValue={120}
				onChange={(_, bpm) => setField({bpm})}
				tooltip="beats per minute"
			/>
			{/* <Knob
				label="Max Read Ahead"
				min={0.0001}
				max={5}
				curve={2}
				value={masterClockState.maxReadAheadSeconds}
				onChange={(_, maxReadAheadSeconds) => setField({maxReadAheadSeconds})}
			/> */}
		</div>

		return (
			<Panel
				id={MASTER_CLOCK_SOURCE_ID}
				color={color}
				saturate={masterClockState.isPlaying}
				className={`${masterClockState.isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
			>
				<div className="masterControls">
					<div className="masterControls-label colorize largeFont">
						Master Clock
					</div>
					<div className="controls">
						<span
							className={`play ${masterClockState.index % 2 === 0 ? 'highlight' : ''}`}
							onClick={masterClockState.isPlaying ? restart : onPlay}
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
					{isNewNoteScannerEnabled() &&
						knobs
					}
				</div>
			</Panel>
		)
	})

export const ConnectedMasterControls = connect(
	(state: IClientAppState): IMasterControlsReduxProps => {
		return {
			masterClockState: selectGlobalClockState(state.room),
		}
	},
	{
		onPlay: globalClockActions.start,
		restart: globalClockActions.restart,
		onStop: globalClockActions.stop,
		setField: globalClockActions.update,
	},
)(MasterControls)
