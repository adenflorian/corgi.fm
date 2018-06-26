import {Component} from 'react'
import * as React from 'react'
import {connect, Dispatch} from 'react-redux'
import {logger} from '../common/logger'
import {IAppState} from '../common/redux/configureStore'
import {playTrack, refreshTrackPlayerEvents, restartTrack, stopTrack} from '../common/redux/track-player-middleware'
import {ITrackEvent, selectTrack, setTrackNote} from '../common/redux/tracks-redux'
import {isWhiteKey} from './Keyboard/Keyboard'
import './TrackView.less'

interface ITrackViewProps {
	events?: ITrackEvent[]
	activeIndex?: number
	isPlaying?: boolean
	color?: string
	dispatch?: Dispatch
	id: string
	name: string
}

export class TrackView extends Component<ITrackViewProps> {
	public static defaultProps = {
		events: Array.apply({enabled: false, notes: []}, new Array(8)),
		color: 'gray',
	}

	public render() {
		const {color, events, activeIndex, isPlaying} = this.props

		return (
			<div
				className={`track ${isPlaying ? 'isPlaying saturate' : 'isNotPlaying'}`}
				style={{color}}
			>
				<div className="label transitionAllColor">{this.props.name}</div>
				<div id={this.props.id} className="container">
					<div className="isometricBoxShadow"></div>
					<div className="controls unselectable">
						<div
							className="play colorTransition"
							onClick={this.handlePlayButtonClicked}
						>
							▶
						</div>
						<div
							className="stop colorTransition"
							onClick={this.handleStopButtonClicked}
						>
							◼
						</div>
						<div
							className="restart colorTransition"
							onClick={this.handleRestartButtonClicked}
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
										i2 += 48
										const isEnabled = event.notes.some(x => x === i2)
										return (
											<div
												key={i2}
												className={`note ${isEnabled ? 'on' : ''} ${isWhiteKey(i2) ? 'white' : 'black'}`}
												onClick={() => this.handleNoteClicked(index, !isEnabled, i2)}
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

	private handlePlayButtonClicked = () => {
		this.props.dispatch(playTrack(this.props.id))
	}

	private handleStopButtonClicked = () => {
		this.props.dispatch(stopTrack(this.props.id))
	}

	private handleRestartButtonClicked = () => {
		logger.warn('restart not yet impl')
		this.props.dispatch(restartTrack(this.props.id))
	}

	private handleNoteClicked = (index: number, isEnabled: boolean, noteNumber: number) => {
		this.props.dispatch(setTrackNote(this.props.id, index, isEnabled, noteNumber))
		this.props.dispatch(refreshTrackPlayerEvents())
	}
}

const mapStateToProps = (state: IAppState, props: ITrackViewProps) => {
	const track = selectTrack(state, props.id)
	return {
		events: track.notes,
		activeIndex: track.index,
		isPlaying: track.isPlaying,
		color: track.color,
		name: track.name,
	}
}

export const ConnectedTrackView = connect(
	mapStateToProps,
)(TrackView)
