import * as React from 'react'
import {ITrackEvent} from '../../common/redux/tracks-redux'
import {isWhiteKey} from '../Keyboard/Keyboard'

interface ITrackProps {
	activeIndex?: number
	color?: string
	events?: ITrackEvent[]
	id: string
	isPlaying?: boolean
	name?: string
	handlePlayButtonClicked: () => void
	handleStopButtonClicked: () => void
	handleRestartButtonClicked: () => void
	handleNoteClicked: (index, isEnabled, i2) => void
	handleMouseEnter: (index, isEnabled, i2, e) => void
	handleMouseDown: (index, isEnabled, i2, e) => void
}

export class Track extends React.PureComponent<ITrackProps> {
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
							onClick={this.props.handlePlayButtonClicked}
						>
							▶
						</div>
						<div
							className="stop colorTransition"
							onClick={this.props.handleStopButtonClicked}
						>
							◼
						</div>
						<div
							className="restart colorTransition"
							onClick={this.props.handleRestartButtonClicked}
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
												onClick={() => this.props.handleNoteClicked(index, isEnabled, i2)}
												onMouseEnter={e => this.props.handleMouseEnter(index, isEnabled, i2, e)}
												onMouseDown={e => this.props.handleMouseDown(index, isEnabled, i2, e)}
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
