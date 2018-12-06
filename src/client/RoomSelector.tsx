import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../common/redux/configureStore'
import {changeRoom, selectActiveRoom, selectAllRooms} from '../common/redux/rooms-redux'

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
				<label htmlFor="roomSelect">Room </label>
				<select name="roomSelect" value={activeRoom} onChange={this.onRoomSelect} >
					{rooms.map(room => <option key={room}>{room}</option>)}
				</select>
			</div>
		)
	}

	private onRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newRoom = e.target.value

		if (newRoom !== this.props.activeRoom) {
			this.props.dispatch(changeRoom(newRoom))
		}
	}
}

export const ConnectedRoomSelector = connect((state: IAppState) => ({
	activeRoom: selectActiveRoom(state),
	rooms: selectAllRooms(state),
}))(RoomSelector)
