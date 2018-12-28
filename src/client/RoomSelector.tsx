import {List} from 'immutable'
import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {logger} from '../common/logger'
import {IClientAppState} from '../common/redux/common-redux-types'
import {changeRoom, requestCreateRoom, selectActiveRoom, selectAllRoomNames} from '../common/redux/rooms-redux'

interface IRoomSelectorProps {
	activeRoom: string
	rooms: List<string>
}

export class RoomSelector extends Component<IRoomSelectorProps & {dispatch: Dispatch}> {
	public static defaultProps = {
		rooms: List<string>(),
		activeRoom: '',
	}

	public render() {
		const {activeRoom, rooms} = this.props

		return (
			<div id="roomSelector">
				<div className="buttonContainer">
					<div className="isometricBoxShadow" />
					<button id="newRoomButton" onClick={this.onNewRoomButtonClick}>New Room</button>
				</div>
				<div className="selectRow">
					<label htmlFor="roomSelect">Room </label>
					<div className="selectContainer">
						<div className="isometricBoxShadow" />
						<select name="roomSelect" value={activeRoom} onChange={this.onRoomSelect}>
							{rooms.map(room => <option key={room} value={room} label={room}>{room}</option>)}
						</select>
						<div className="arrow">
							<div>▼</div>
						</div>
					</div>
				</div>
			</div>
		)
	}

	private readonly onRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newRoom = e.target.value

		if (newRoom !== this.props.activeRoom) {
			this.props.dispatch(changeRoom(newRoom))
		}
	}

	private readonly onNewRoomButtonClick = () => {
		logger.log('new room')
		this.props.dispatch(requestCreateRoom())
	}
}

export const ConnectedRoomSelector = connect((state: IClientAppState): IRoomSelectorProps => ({
	activeRoom: selectActiveRoom(state),
	rooms: selectAllRoomNames(state),
}))(RoomSelector)
