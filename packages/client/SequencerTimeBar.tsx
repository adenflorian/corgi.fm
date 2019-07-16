import React from 'react'
import {selectGlobalClockState, shamuConnect} from '@corgifm/common/redux'
import './SequencerTimeBar.less'

interface Props {
	isArmed: boolean
	lengthBeats: number
}

interface ReduxProps {
	bpm: number
	isGlobalPlaying: boolean
}

type AllProps = Props & ReduxProps

export const SequencerTimeBar
	= function _SequencerTimeBar(props: AllProps) {
		if (!props.isArmed || !props.isGlobalPlaying) return null

		return (
			<div
				className="sequencerTimeBarContainer"
				style={{
					// backgroundColor: 'red',
					position: 'absolute',
					width: '100%',
					height: '100%',
				}}
			>
				<div
					className="sequencerTimeBarBar"
					style={{
						backgroundColor: 'white',
						position: 'absolute',
						width: 2,
						height: '100%',
						zIndex: 10000,
						animationDuration: ((60 / props.bpm) * props.lengthBeats).toString() + 's',
						// willChange: 'transform',
					}}
				/>
			</div>
		)
	}

export const ConnectedSequencerTimeBar = shamuConnect(
	(state): ReduxProps => {
		const globalClockState = selectGlobalClockState(state.room)

		return {
			bpm: globalClockState.bpm,
			isGlobalPlaying: globalClockState.isPlaying,
		}
	},
)(SequencerTimeBar)
