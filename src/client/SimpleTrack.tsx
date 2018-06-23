import {Component} from 'react'
import * as React from 'react'
import {connect, Dispatch} from 'react-redux'
import {IMidiNote} from '../common/MidiNote'
import {IAppState} from '../common/redux/configureStore'
import {
	ISimpleTrackNote,
	selectSimpleTrackEvents,
	selectSimpleTrackIndex,
	setSimpleTrackNote,
} from '../common/redux/simple-track-redux'
import {
	playSimpleTrack,
	refreshSimpleTrackPlayerEvents,
	restartSimpleTrack,
	stopSimpleTrack,
} from '../common/redux/track-player-middleware'
import {isWhiteKey} from './Keyboard/Keyboard'
import './SimpleTrack.less'

interface ISimpleTrackProps {
	events: ISimpleTrackNote[]
	setNote: any
	play: any
	stop: any
	restart: any
	activeIndex: number
	isPlaying?: boolean
	color?: string
}

export class SimpleTrack extends Component<ISimpleTrackProps> {
	public static defaultProps = {
		events: Array.apply({enabled: false, notes: []}, new Array(8)),
		color: 'gray',
	}

	public render() {
		const {color, events, setNote, play, stop, restart, activeIndex, isPlaying} = this.props

		return (
			<div
				className={`simpleTrack ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
				style={{color}}
			>
				<div className="label transitionAllColor">track-1</div>
				<div className="container">
					<div className="isometricBoxShadow"></div>
					<div className="controls unselectable">
						<div
							className="play colorTransition"
							onClick={play}
						>
							▶
						</div>
						<div
							className="stop colorTransition"
							onClick={stop}
						>
							◼
						</div>
						<div
							className="restart colorTransition"
							onClick={restart}
						>
							↻
						</div>
					</div>
					<div className="events">
						{events.map((event, index) => {
							const isActiveIndex = activeIndex === index
							return (
								<div
									key={index}
									className={`event ${isActiveIndex ? 'active' : 'transitionAllColor'}`}
								>
									{Array.apply(0, new Array(36)).map((_, i2) => {
										const isEnabled = event.notes.some(x => x === i2)
										return (
											<div
												key={i2}
												className={`note ${isEnabled ? 'on' : ''} ${isWhiteKey(i2) ? 'white' : 'black'}`}
												onClick={() => setNote(index, !isEnabled, i2)}
											/>
										)
									})}
								</div>
							)
						})}
					</div>
				</div>
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	events: selectSimpleTrackEvents(state),
	activeIndex: selectSimpleTrackIndex(state),
	isPlaying: state.simpleTrack.isPlaying,
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
	setNote: (index: number, enabled: boolean, note: IMidiNote) => {
		dispatch(setSimpleTrackNote(index, enabled, note))
		dispatch(refreshSimpleTrackPlayerEvents())
	},
	play: () => dispatch(playSimpleTrack()),
	stop: () => dispatch(stopSimpleTrack()),
	restart: () => dispatch(restartSimpleTrack()),
})

export const ConnectedSimpleTrack = connect(
	mapStateToProps,
	mapDispatchToProps,
)(SimpleTrack)
