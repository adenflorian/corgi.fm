import * as React from 'react'
import {connect} from 'react-redux'
import {selectClientCount} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {selectMemberCount} from '../common/redux/room-members-redux'
import {NewsletterSignupButton} from './Newsletter/NewsletterSignupButton'
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
			<div>{info}</div>
			<div id="fps">FPS</div>
			<Options />
		</div>
		<div className="right">
			<NewsletterSignupButton />
			<ConnectedRoomSelector />
			<div style={{margin: 8}}>{memberCount} room member{memberCount > 1 ? 's' : ''}</div>
			<div style={{margin: 8}}>{clientCount} total user{clientCount > 1 ? 's' : ''}</div>
		</div>
	</div>

export const ConnectedTopDiv = connect((state: IClientAppState) => ({
	clientCount: selectClientCount(state),
	info: state.websocket.info,
	memberCount: selectMemberCount(state.room),
}))(TopDiv)
