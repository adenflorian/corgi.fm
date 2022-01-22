import React, {useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {rateLimitedDebounceNoTrail} from '@corgifm/common/common-utils'
import {
	IClientState, commonActions,
	selectClientById, selectLocalClientId, selectMemberCount,
	selectRoomSettings, localActions,
	selectClientInfo, shamuConnect, selectClientCount,
	getRoomTypeFriendlyString,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {
	eventOrganizeRoomButtonClick,
	eventOrganizeRoomConfirmed, eventPruneRoomButtonClick,
	eventPruneRoomConfirmed, eventSaveRoomToBrowserButtonClick,
	eventSaveRoomToFileButtonClick,
} from './analytics/analytics'
import {AuthModalButton} from './Auth/Auth'
import {Button} from './Button/Button'
import {NewRoomButton} from './Button/NewRoomButton'
import {DiscordLink, NewsletterLink, PatreonLink, GithubLink} from './Links'
import {ConnectedNameChanger} from './NameChanger'
import {OptionsModalButton} from './Options/Options'
import {ConnectedRoomSelector} from './RoomSelector'
import {LoadRoomModalButton} from './SavingAndLoading/SavingAndLoading'
import {WelcomeModalButton} from './Welcome/Welcome'
import {createResetZoomAction} from './SimpleGraph/Zoom'
import {useObjectChangedEvent} from './Experimental/hooks/useCorgiEvent'
import {simpleGlobalClientState} from './SimpleGlobalClientState'
import {audioWorkletToolTip} from './client-constants'
import {useRoomType} from './react-hooks'
import './TopDiv.less'
import {NodeGroupInfo} from './SmallComponents/NodeGroupInfo'
import {RoomType} from '@corgifm/common/common-types'
import {FiDownload} from 'react-icons/fi'
import {LoadRoomFileButton} from './SavingAndLoading/LoadRoomFromFile'

interface ReduxProps {
	memberCount: number
	clientCount: number
	info: string
	isConnected: boolean
	roomOwner: IClientState
	onlyOwnerCanDoStuff: boolean
	isLocalClientRoomOwner: boolean
}

type AllProps = ReduxProps

export const TopDiv = ({
	memberCount, clientCount, info, isConnected,
	roomOwner, onlyOwnerCanDoStuff, isLocalClientRoomOwner,
}: AllProps) => {
	const dispatch = useDispatch()

	const resetZoom = useCallback(() => {
		dispatch(createResetZoomAction())
	}, [dispatch])

	const isAudioWorkletLoaded = useObjectChangedEvent(simpleGlobalClientState.onAudioWorkletLoaded)
	const roomType = useRoomType()

	return (
		<div className="topDiv" style={{marginBottom: 'auto'}}>
			<div className="left">
				<div className="blob">
					<div className="blobDark">WebSocket</div>
					<div>{info}</div>
				</div>
				<div className="blob">
					<div className="blobDark" title="Frames per second">
						FPS
					</div>
					<div id="fps" />
				</div>
				<div className="blob" style={{cursor: 'pointer'}} title="Click to reset zoom" onClick={resetZoom}>
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
					<div>
						<span
							className="usernameFont"
							style={{color: roomOwner.color}}
						>
							{roomOwner.name}
						</span>
						{isLocalClientRoomOwner
							? (
								<span
									style={{
										marginLeft: 8,
										color: CssColor.disabledGray,
									}}
								>
									(You)
								</span>
							)
							: ''}
					</div>
				</div>
				<div className="blob">
					<div className="blobDark">Room Status</div>
					<div
						style={{
							color: onlyOwnerCanDoStuff
								? CssColor.orange
								: CssColor.green,
						}}
						title={onlyOwnerCanDoStuff
							? 'Limited: anyone can join, '
							+ 'but only room owner can do stuff'
							: 'Public: anyone can join and do stuff'}
					>
						{onlyOwnerCanDoStuff ? 'Limited' : 'Public'}
					</div>
				</div>
				<div className="blob">
					<div className="blobDark">Room Type</div>
					<div
						style={{
							color: roomType === RoomType.Experimental
								? CssColor.orange
								: undefined,
						}}
						title={''}
					>
						{getRoomTypeFriendlyString(roomType)}
					</div>
				</div>
				<div className="blob">
					<div className="blobDark">AudioWorklet</div>
					<div
						style={{
							color: isAudioWorkletLoaded
								? CssColor.orange
								: CssColor.defaultGray,
						}}
						title={audioWorkletToolTip}
					>
						{isAudioWorkletLoaded ? 'Loaded' : 'Not Loaded'}
					</div>
				</div>
				{roomType === RoomType.Experimental &&
					<NodeGroupInfo />
				}
				{!isConnected &&
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
				<ConnectedNameChanger showLabel={true} />
				<AuthModalButton />
				<WelcomeModalButton />
				<ConnectedRoomSelector />
				<NewRoomButton />
				<LoadRoomModalButton />
				<LoadRoomFileButton />
				<Button
					onClick={
						rateLimitedDebounceNoTrail(() => {
							dispatch(localActions.saveRoomToBrowser())
							eventSaveRoomToBrowserButtonClick()
						}, 1000)
					}
					background="medium"
					shadow={true}
				>
					Save Room To Browser
				</Button>
				<Button
					buttonProps={{
						title: 'Will be able to load from file at a later date',
					}}
					onClick={
						rateLimitedDebounceNoTrail(() => {
							dispatch(localActions.saveRoomToFile())
							eventSaveRoomToFileButtonClick()
						}, 2000)
					}
					background="medium"
					shadow={true}
				>
					<FiDownload />
					Save Room To File
				</Button>
				<Button
					onClick={
						() => {
							if (
								window.confirm('Are you sure you want to delete all '
									+ 'nodes with no connections in this room?'
									+ '\nThis cannot be undone!')
							) {
								dispatch(localActions.pruneRoom())
								eventPruneRoomConfirmed()
							}
							eventPruneRoomButtonClick()
						}
					}
					buttonProps={{
						title: 'Will delete nodes with no connections on them'
							+ (onlyOwnerCanDoStuff && !isLocalClientRoomOwner
								? '\nOnly room owner can prune at this time'
								: ''),
					}}
					disabled={onlyOwnerCanDoStuff && !isLocalClientRoomOwner}
					background="medium"
					shadow={true}
				>
					Prune Room
				</Button>
				{false &&
					<Button
						onClick={
							() => {
								if (
									window.confirm('Are you sure you want to organize all '
										+ 'nodes in this room?'
										+ '\nThis cannot be undone!')
								) {
									dispatch(commonActions.organizeGraph())
									eventOrganizeRoomConfirmed()
								}
								eventOrganizeRoomButtonClick()
							}
						}
						buttonProps={{
							title: 'Will organize nodes'
								+ (onlyOwnerCanDoStuff && !isLocalClientRoomOwner
									? '\nOnly room owner can organize at this time'
									: ''),
						}}
						disabled={onlyOwnerCanDoStuff && !isLocalClientRoomOwner}
						background="medium"
						shadow={true}
					>
						Organize Room
					</Button>
				}
				<OptionsModalButton />
				<DiscordLink />
				<GithubLink />
				{/* <PatreonLink /> */}
				{/* <NewsletterLink /> */}
			</div>
		</div>
	)
}

export const ConnectedTopDiv = shamuConnect(
	(state): ReduxProps => {
		const roomSettings = selectRoomSettings(state.room)

		return {
			clientCount: selectClientCount(state),
			info: state.websocket.info,
			memberCount: selectMemberCount(state.room),
			isConnected: selectClientInfo(state).isConnected,
			roomOwner: selectClientById(state, roomSettings.ownerId),
			onlyOwnerCanDoStuff: roomSettings.onlyOwnerCanDoStuff,
			isLocalClientRoomOwner:
				selectLocalClientId(state) === roomSettings.ownerId,
		}
	},
)(TopDiv)
