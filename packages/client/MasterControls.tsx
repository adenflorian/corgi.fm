import React from 'react'
import {
	IoMdPlay as Play, IoMdSquare as Stop,
} from 'react-icons/io'
import {connect} from 'react-redux'
import {
	globalClockActions, IClientAppState, IGlobalClockState,
	MASTER_CLOCK_SOURCE_ID, selectGlobalClockState, MIN_BPM, MAX_BPM,
} from '@corgifm/common/redux'
import {KnobIncremental} from './Knob/KnobIncremental'
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
	setBpm: typeof globalClockActions.setBpm
}

type AllProps = IMasterControlsProps & IMasterControlsReduxProps &
IMasterControlsDispatchProps

export const MasterControls = (
	{onPlay, restart, onStop, setBpm, masterClockState, color}: AllProps
) => {
	const knobs = (
		<div className="knobs">
			<KnobIncremental
				label="Tempo"
				min={MIN_BPM}
				max={MAX_BPM}
				value={masterClockState.bpm}
				defaultValue={120}
				onChange={(_, bpm) => setBpm(bpm)}
				tooltip="Beats per minute"
				valueString={v => `${v.toFixed(2).replace('.00', '')} bpm`}
				increment={1}
				fineIncrement={0.01}
				allowAltKey={true}
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
	)

	return (
		<Panel
			id={MASTER_CLOCK_SOURCE_ID}
			color={color}
			saturate={masterClockState.isPlaying}
			className={`${masterClockState.isPlaying ? 'isPlaying' : 'isNotPlaying'}`}
			label="Master Clock"
		>
			<div className="masterControls">
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
}

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
		setBpm: globalClockActions.setBpm,
	},
)(MasterControls)
