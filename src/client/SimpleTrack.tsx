import * as React from 'react'
import {Component} from 'react'
import {connect, Dispatch} from 'react-redux'
import {IAppState} from './redux/configureStore'
import {selectSimpleTrackState, setSimpleTrackNote} from './redux/simple-track-redux'
import './SimpleTrack.less'

interface ISimpleTrackProps {
	notes: boolean[]
	setNote: any
}

export class SimpleTrack extends Component<ISimpleTrackProps> {
	public static defaultProps = {
		notes: [false, false, false, false],
	}

	public render() {
		const {notes, setNote} = this.props

		return (
			<div className="simpleTrack">
				<div>track</div>
				<div className="noteCells">
					{notes.map((note, index) => {
						return (
							<div
								className={`noteCell ${note ? 'on' : ''}`}
								onClick={() => setNote(index, !note)}
							/>
						)
					})}
				</div>
			</div>
		)
	}
}

const mapStateToProps = (state: IAppState) => ({
	notes: selectSimpleTrackState(state),
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
	setNote: (index: number, enabled: boolean) => dispatch(setSimpleTrackNote(index, enabled)),
})

export const ConnectedSimpleTrack = connect(
	mapStateToProps,
	mapDispatchToProps,
)(SimpleTrack)
