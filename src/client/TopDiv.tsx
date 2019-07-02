import React from 'react'
import {Dispatch} from 'redux'
import {rateLimitedDebounceNoTrail} from '../common/common-utils'
import {IClientState, selectClientById, selectLocalClientId, selectMemberCount, selectRoomSettings} from '../common/redux'
import {selectClientCount} from '../common/redux'
import {selectClientInfo, shamuConnect} from '../common/redux'
import {requestCreateRoom} from '../common/redux'
import {CssColor} from '../common/shamu-color'
import {Button} from './Button/Button'
import {ButtonLink} from './Button/ButtonLink'
import {localActions} from './local-middleware'
import {ConnectedNameChanger} from './NameChanger'
import {ConnectedOptions} from './Options/Options'
import {ConnectedRoomSelector} from './RoomSelector'
import {SavingAndLoading} from './SavingAndLoading/SavingAndLoading'
import './TopDiv.less'

interface ReduxProps {
	memberCount: number
	clientCount: number
	info: string
	isClientReady: boolean
	roomOwner: IClientState
	onlyOwnerCanDoStuff: boolean
	isLocalClientRoomOwner: boolean
}

type AllProps = ReduxProps & {dispatch: Dispatch}

export const TopDiv = ({memberCount, clientCount, info, isClientReady, roomOwner, onlyOwnerCanDoStuff, isLocalClientRoomOwner, dispatch}: AllProps) =>
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
				<span id="zoomText">0.0</span>
			</div>
			<div className="blob">
				<div className="blobDark">Online Users</div>
				<div>{clientCount}</div>
			</div>
			<div className="blob">
				<div className="blobDark">Room Members</div>
				<div>{memberCount}</div>
			</div>
			<div className="blob">
				<div className="blobDark">Room Owner</div>
				<div><span className="usernameFont" style={{color: roomOwner.color}}>{roomOwner.name}</span>{isLocalClientRoomOwner ? <span style={{marginLeft: 8, color: CssColor.disabledGray}}>(You)</span> : ''}</div>
			</div>
			<div className="blob">
				<div className="blobDark">Room Status</div>
				<div
					style={{color: onlyOwnerCanDoStuff ? CssColor.orange : CssColor.green}}
					title={onlyOwnerCanDoStuff ? 'Limited: anyone can join, but only room owner can do stuff' : 'Public: anyone can join and do stuff'}
				>
					{onlyOwnerCanDoStuff ? 'Limited' : 'Public'}
				</div>
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
				buttonProps={{onClick: rateLimitedDebounceNoTrail(() => dispatch(localActions.saveRoomToBrowser()), 1000)}}
			>
				Save Room To Browser
			</Button>
			<Button
				buttonProps={{
					onClick: rateLimitedDebounceNoTrail(() => dispatch(localActions.saveRoomToFile()), 2000),
					title: 'Will be able to load from file at a later date',
				}}
			>
				Save Room To File
			</Button>
			<SavingAndLoading dispatch={dispatch} />
			<Button
				buttonProps={{
					onClick: () => confirm('Are you sure you want to delete all nodes with no connections in this room?\nThis cannot be undone!') ? dispatch(localActions.pruneRoom()) : undefined,
					title: 'Will delete nodes with no connections on them' + (onlyOwnerCanDoStuff && !isLocalClientRoomOwner ? '\nOnly room owner can prune at this time' : ''),
				}}
				disabled={onlyOwnerCanDoStuff && !isLocalClientRoomOwner}
			>
				Prune Room
			</Button>
			<ConnectedOptions />
			<ButtonLink href="/newsletter" newTab={true}>Newsletter</ButtonLink>
			<ButtonLink href="https://discord.gg/qADwrxd" newTab={true}>Discord</ButtonLink>
			<ButtonLink href="https://www.patreon.com/corgifm" newTab={true}>Patreon</ButtonLink>
		</div>
	</div>

export const ConnectedTopDiv = shamuConnect(
	(state): ReduxProps => {
		const roomSettings = selectRoomSettings(state.room)

		return {
			clientCount: selectClientCount(state),
			info: state.websocket.info,
			memberCount: selectMemberCount(state.room),
			isClientReady: selectClientInfo(state).isClientReady,
			roomOwner: selectClientById(state, roomSettings.ownerId),
			onlyOwnerCanDoStuff: roomSettings.onlyOwnerCanDoStuff,
			isLocalClientRoomOwner: selectLocalClientId(state) === roomSettings.ownerId,
		}
	},
)(TopDiv)
