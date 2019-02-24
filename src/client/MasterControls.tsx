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
	React.memo(({onPlay, restart, onStop, setField, masterClockState, color}) => {

		const knobs = <div className="knobs">
			<Knob
				label="bpm"
				min={0}
				max={999}
				value={masterClockState.bpm}
				onChange={(_, bpm) => setField({bpm})}
			/>
			<Knob
				label="offset"
				min={0}
				max={10}
				value={masterClockState.eventOffsetSeconds}
				onChange={(_, eventOffsetSeconds) => setField({eventOffsetSeconds})}
			/>
			<Knob
				label="window"
				min={0}
				max={10}
				value={masterClockState.eventWindowSeconds}
				onChange={(_, eventWindowSeconds) => setField({eventWindowSeconds})}
			/>
			<Knob
				label="MRA"
				min={0}
				max={10}
				value={masterClockState.maxReadAheadSeconds}
				onChange={(_, maxReadAheadSeconds) => setField({maxReadAheadSeconds})}
			/>
			<Knob
				label="MRW"
				min={0}
				max={10}
				value={masterClockState.maxReadWindowSeconds}
				onChange={(_, maxReadWindowSeconds) => setField({maxReadWindowSeconds})}
			/>
		</div>

		return (
			<Panel
				id={MASTER_CLOCK_SOURCE_ID}
				color={color}
				saturate={masterClockState.isPlaying}
				className={`${masterClockState.isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
			>
				<div className="masterControls">
					<div className="masterControls-label colorize">
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
					{knobs}
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
