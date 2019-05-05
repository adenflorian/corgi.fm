import * as React from 'react'
import {Dispatch} from 'redux'
import {shamuConnect} from '../common/redux'
import {selectMemberCount} from '../common/redux'
import {requestCreateRoom} from '../common/redux'
import {selectClientCount} from '../common/redux'
import {Button} from './Button/Button'
import {localActions} from './local-middleware'
import {Options} from './Options/Options'
import {ConnectedRoomSelector} from './RoomSelector'
import {SavingAndLoading} from './SavingAndLoading/SavingAndLoading'
import './TopDiv.less'

interface ReduxProps {
	memberCount: number
	clientCount: number
	info: string
}

type AllProps = ReduxProps & {dispatch: Dispatch}

export const TopDiv = ({memberCount, clientCount, info, dispatch}: AllProps) =>
	<div id="topDiv" style={{marginBottom: 'auto'}}>
		<div className="left">
			<div>{info}</div>
			<div id="fps" style={{width: 180, overflow: 'hidden'}}>FPS</div>
			<div style={{width: 180, overflow: 'hidden'}}>Zoom <span id="zoomText">1</span></div>
			<div>{memberCount} Room Member{memberCount > 1 ? 's' : ''}</div>
			<div>{clientCount} Total User{clientCount > 1 ? 's' : ''}</div>
		</div>
		<div className="right">
			<ConnectedRoomSelector />
			<Button
				buttonProps={{id: 'newRoomButton', onClick: () => dispatch(requestCreateRoom())}}
			>
				New Room
			</Button>
			<Button
				buttonProps={{className: 'saveRoomButton', onClick: () => dispatch(localActions.saveRoom())}}
			>
				Save Room
			</Button>
			<SavingAndLoading dispatch={dispatch} />
			<Options />
			<a href="/newsletter" target="_blank">Newsletter</a>
			<a href="https://discord.gg/qADwrxd" target="_blank">Discord</a>
		</div>
	</div>

export const ConnectedTopDiv = shamuConnect(
	(state): ReduxProps => ({
		clientCount: selectClientCount(state),
		info: state.websocket.info,
		memberCount: selectMemberCount(state.room),
	}),
)(TopDiv)
