import * as React from 'react'
import {Dispatch} from 'redux'
import {selectClientInfo, shamuConnect} from '../common/redux'
import {selectMemberCount} from '../common/redux'
import {requestCreateRoom} from '../common/redux'
import {selectClientCount} from '../common/redux'
import {CssColor} from '../common/shamu-color'
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
	isClientReady: boolean
}

type AllProps = ReduxProps & {dispatch: Dispatch}

export const TopDiv = ({memberCount, clientCount, info, isClientReady, dispatch}: AllProps) =>
	<div id="topDiv" style={{marginBottom: 'auto'}}>
		<div className="left">
			<div>{info}</div>
			<div id="fps" style={{width: 180, overflow: 'hidden'}}>FPS</div>
			<div style={{width: 180, overflow: 'hidden'}}>Zoom <span id="zoomText">1</span></div>
			<div>{memberCount} Room Member{memberCount > 1 ? 's' : ''}</div>
			<div>{clientCount} Total User{clientCount > 1 ? 's' : ''}</div>
			{!isClientReady &&
				<div
					style={{
						fontSize: '1.4em',
						lineHeight: '1.2em',
						color: CssColor.brightRed,
					}}
				>
					<p>Not connected!</p>
					<p>Save your work before it reconnects!</p>
					<p>All unsaved work might get lost!</p>
				</div>
			}
		</div>
		<div className="right">
			<ConnectedRoomSelector />
			<Button
				buttonProps={{id: 'newRoomButton', onClick: () => dispatch(requestCreateRoom())}}
			>
				New Room
			</Button>
			<Button
				buttonProps={{className: 'saveRoomButton', onClick: () => dispatch(localActions.saveRoomToBrowser())}}
			>
				Save Room To Browser
			</Button>
			<Button
				buttonProps={{
					className: 'saveRoomButton',
					onClick: () => dispatch(localActions.saveRoomToFile()),
					title: 'Will be able to load from file at a later date',
				}}
			>
				Save Room To File
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
		isClientReady: selectClientInfo(state).isClientReady,
	}),
)(TopDiv)
