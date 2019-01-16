import * as React from 'react'
import {connect} from 'react-redux'
import {selectClientCount} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {selectMemberCount} from '../common/redux/room-members-redux'
import {Options} from './Options/Options'
import {ConnectedRoomSelector} from './RoomSelector'
import './TopDiv.less'

interface ITopDivProps {
	memberCount: number,
	clientCount: number,
	info: string
}

export const TopDiv = ({memberCount, clientCount, info}: ITopDivProps) =>
	<div id="topDiv" style={{marginBottom: 'auto'}}>
		<div className="left">
			<div style={{margin: 8}}>{info}</div>
			<div id="fps" style={{margin: 8}}>FPS</div>
			<div style={{margin: 8}}>{memberCount} Room Member{memberCount > 1 ? 's' : ''}</div>
			<div style={{margin: 8}}>{clientCount} Total User{clientCount > 1 ? 's' : ''}</div>
		</div>
		<div className="right">
			<ConnectedRoomSelector />
			<Options />
			<a href="/newsletter" target="_blank" style={{margin: 8}}>Newsletter</a>
			<a href="https://discord.gg/qADwrxd" target="_blank" style={{margin: 8}}>Discord</a>
		</div>
	</div>

export const ConnectedTopDiv = connect((state: IClientAppState) => ({
	clientCount: selectClientCount(state),
	info: state.websocket.info,
	memberCount: selectMemberCount(state.room),
}))(TopDiv)
