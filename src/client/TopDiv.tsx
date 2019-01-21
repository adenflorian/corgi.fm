import * as React from 'react'
import {selectClientCount} from '../common/redux/clients-redux'
import {shamuConnect} from '../common/redux/redux-utils'
import {selectMemberCount} from '../common/redux/room-members-redux'
import {requestCreateRoom} from '../common/redux/rooms-redux'
import {Button} from './Button/Button'
import {Options} from './Options/Options'
import {ConnectedRoomSelector} from './RoomSelector'
import './TopDiv.less'

interface ITopDivProps {
	memberCount: number
	clientCount: number
	info: string
	createRoom: typeof requestCreateRoom
}

export const TopDiv = ({memberCount, clientCount, info, createRoom}: ITopDivProps) =>
	<div id="topDiv" style={{marginBottom: 'auto'}}>
		<div className="left">
			<div>{info}</div>
			<div id="fps">FPS</div>
			<div>Zoom <span id="zoomText">1</span></div>
			<div>{memberCount} Room Member{memberCount > 1 ? 's' : ''}</div>
			<div>{clientCount} Total User{clientCount > 1 ? 's' : ''}</div>
		</div>
		<div className="right">
			<ConnectedRoomSelector />
			<Button
				buttonProps={{id: 'newRoomButton', onClick: createRoom}}
			>
				New Room
			</Button>
			<Options />
			<a href="/newsletter" target="_blank">Newsletter</a>
			<a href="https://discord.gg/qADwrxd" target="_blank">Discord</a>
		</div>
	</div>

export const ConnectedTopDiv = shamuConnect(
	state => ({
		clientCount: selectClientCount(state),
		info: state.websocket.info,
		memberCount: selectMemberCount(state.room),
	}),
	{
		createRoom: requestCreateRoom,
	},
)(TopDiv)
