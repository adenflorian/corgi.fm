import {List} from 'immutable'
import React from 'react'
import {Component} from 'react'
import {changeRoom, selectActiveRoom, selectAllRoomNames, shamuConnect} from '../common/redux'
import {Select} from './Select/Select'

interface IRoomSelectorReduxProps {
	activeRoom: string
	rooms: List<string>
}

interface IRoomSelectorDispatchProps {
	changeRoom: typeof changeRoom
}

type IRoomSelectorAllProps = IRoomSelectorReduxProps & IRoomSelectorDispatchProps

export class RoomSelector extends Component<IRoomSelectorAllProps> {
	public readonly render = () =>
		<Select
			label="Room"
			name="roomSelect"
			onChange={this.onRoomSelect}
			options={this.props.rooms}
			value={this.props.activeRoom}
		/>

	private readonly onRoomSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newRoom = e.target.value

		if (newRoom !== this.props.activeRoom) {
			this.props.changeRoom(newRoom)
		}
	}
}

export const ConnectedRoomSelector = shamuConnect(
	(state): IRoomSelectorReduxProps => ({
		activeRoom: selectActiveRoom(state),
		rooms: selectAllRoomNames(state),
	}), {
		changeRoom,
	} as IRoomSelectorDispatchProps,
)(RoomSelector)
