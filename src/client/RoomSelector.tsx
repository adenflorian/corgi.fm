import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {logger} from '../common/logger'
import {IAppState} from '../common/redux/configureStore'
import {changeRoom, createRoom, selectActiveRoom, selectAllRooms} from '../common/redux/rooms-redux'

interface IRoomSelectorProps {
	activeRoom?: string
	dispatch?: Dispatch
	rooms?: string[]
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
				<div>
					<label htmlFor="roomSelect">Room </label>
					<select name="roomSelect" value={activeRoom} onChange={this.onRoomSelect} >
						{rooms.map(room => <option key={room || 'null'} value={room} label={room}>{room}</option>)}
					</select>
				</div>
				<div>
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
		this.props.dispatch(createRoom())
	}
}

export const ConnectedRoomSelector = connect((state: IAppState) => ({
	activeRoom: selectActiveRoom(state),
	rooms: selectAllRooms(state),
}))(RoomSelector)
