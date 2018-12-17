import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {logger} from '../common/logger'
import {IClientAppState} from '../common/redux/common-redux-types'
import {changeRoom, createRoom, requestCreateRoom, selectActiveRoom, selectAllRooms} from '../common/redux/rooms-redux'

interface IRoomSelectorProps {
	activeRoom: string
	dispatch: Dispatch
	rooms: string[]
}

export class RoomSelector extends Component<IRoomSelectorProps> {
	public static defaultProps = {
		rooms: [],
		activeRoom: '',
	}

	public render() {
		const {activeRoom, rooms} = this.props

		return (
			<div id="roomSelector">
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

				<div className="buttonContainer">
					<div className="isometricBoxShadow" />
					<button id="newRoomButton" onClick={this.onNewRoomButtonClick}>New Room</button>
				</div>
			</div>
		)
	}

	private onRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newRoom = e.target.value

		if (newRoom !== this.props.activeRoom) {
			this.props.dispatch(changeRoom(newRoom))
		}
	}

	private onNewRoomButtonClick = () => {
		logger.log('new room')
		this.props.dispatch(requestCreateRoom())
	}
}

export const ConnectedRoomSelector = connect((state: IClientAppState) => ({
	activeRoom: selectActiveRoom(state),
	rooms: selectAllRooms(state),
}))(RoomSelector)
