import {List} from 'immutable'
import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {logger} from '../common/logger'
import {IClientAppState} from '../common/redux/common-redux-types'
import {changeRoom, requestCreateRoom, selectActiveRoom, selectAllRoomNames} from '../common/redux/rooms-redux'
import {Button} from './Button/Button'
import {Select} from './Select/Select'

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
			<div
				id="roomSelector"
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'flex-end',
				}}
			>
				<Select
					label="Room"
					name="roomSelect"
					onChange={this.onRoomSelect}
					options={rooms}
					value={activeRoom}
				/>
				<Button
					buttonProps={{id: 'newRoomButton', onClick: this.onNewRoomButtonClick}}
				>
					New Room
				</Button>
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
