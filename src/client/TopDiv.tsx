import * as React from 'react'
import {Dispatch} from 'redux'
import {selectClientInfo, shamuConnect} from '../common/redux'
import {selectMemberCount} from '../common/redux'
import {requestCreateRoom} from '../common/redux'
import {selectClientCount} from '../common/redux'
import {CssColor} from '../common/shamu-color'
import {Button} from './Button/Button'
import {ButtonLink} from './Button/ButtonLink'
import {localActions} from './local-middleware'
import {ConnectedNameChanger} from './NameChanger'
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
			<div className="blob">
				<div className="blobDark">WebSocket</div>
				<div>{info}</div>
			</div>
			<div className="blob">
				<div className="blobDark" title="Frames per second">FPS</div>
				<div id="fps" style={{width: 32, overflow: 'hidden'}}></div>
			</div>
			<div className="blob" style={{overflow: 'hidden'}}>
				<span className="blobDark">Zoom</span>
				<span id="zoomText">1</span>
			</div>
			<div className="blob">
				<div className="blobDark">Room Members</div>
				<div>{memberCount}</div>
			</div>
			<div className="blob">
				<div className="blobDark">Total Members</div>
				<div>{clientCount}</div>
			</div>
			{!isClientReady &&
				<div
					className="blob"
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
			<ConnectedNameChanger />
			<ConnectedRoomSelector />
			<Button
				buttonProps={{id: 'newRoomButton', onClick: () => dispatch(requestCreateRoom())}}
			>
				New Room
			</Button>
			<Button
				buttonProps={{onClick: () => dispatch(localActions.saveRoomToBrowser())}}
			>
				Save Room To Browser
			</Button>
			<Button
				buttonProps={{
					onClick: () => dispatch(localActions.saveRoomToFile()),
					title: 'Will be able to load from file at a later date',
				}}
			>
				Save Room To File
			</Button>
			<SavingAndLoading dispatch={dispatch} />
			<Button
				buttonProps={{
					onClick: () => confirm('Are you sure you want to delete all nodes with no connections in this room?\nThis cannot be undone!') ? dispatch(localActions.pruneRoom()) : undefined,
					title: 'Will delete nodes with no connections on them',
				}}
			>
				Prune Room
			</Button>
			<Options />
			<ButtonLink href="/newsletter" newTab={true}>Newsletter</ButtonLink>
			<ButtonLink href="https://discord.gg/qADwrxd" newTab={true}>Discord</ButtonLink>
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
