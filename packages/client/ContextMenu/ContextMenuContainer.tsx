import {oneLine} from 'common-tags'
import {List} from 'immutable'
import React, {Fragment, MouseEvent} from 'react'
import {connectMenu, ContextMenu, MenuItem, SubMenu} from 'react-contextmenu'
import {useDispatch} from 'react-redux'
import {Dispatch} from 'redux'
import {serverClientId} from '../../common/common-constants'
import {ConnectionNodeType, IConnectable, Id, Point} from '../../common/common-types'
import {
	addPosition, Connection,
	connectionsActions, getAddableNodeInfos, getConnectionNodeInfo, IConnectionNodeInfo,
	makePosition, MASTER_AUDIO_OUTPUT_TARGET_ID, MASTER_CLOCK_SOURCE_ID,
	selectLocalClient, selectVirtualKeyboardsByOwner, shamuConnect, VirtualKeyboardState,
} from '../../common/redux'
import {backgroundMenuId, nodeMenuId} from '../client-constants'
import {deleteNode, localActions} from '../local-middleware'
import {toGraphSpace} from '../SimpleGraph/Zoom'
import './ContextMenu.less'

interface ReduxProps {
	localClientId: Id
	localClientKeyboardCount: number
	localClientColor: string
}

type AllProps = ReduxProps

export function ContextMenuContainer({localClientId, localClientKeyboardCount, localClientColor}: AllProps) {
	return (
		<Fragment>
			<ContextMenu id={backgroundMenuId}>
				<BackgroundMenuItems
					localClientId={localClientId}
					localClientKeyboardCount={localClientKeyboardCount}
					localClientColor={localClientColor}
				/>
			</ContextMenu>
			<ConnectedNodeMenu />
		</Fragment>
	)
}

interface NodeMenuProps {
	trigger: {
		nodeType: ConnectionNodeType,
	}
}

function NodeMenu({trigger}: NodeMenuProps) {
	return (
		<ContextMenu id={nodeMenuId}>
			<NodeMenuItems
				nodeType={trigger ? trigger.nodeType : ConnectionNodeType.dummy}
			/>
		</ContextMenu>
	)
}

const ConnectedNodeMenu = connectMenu(nodeMenuId)(NodeMenu)

const BackgroundMenuItems = React.memo(
	function _MenuItems({localClientId, localClientKeyboardCount, localClientColor}
		: {localClientId: Id, localClientKeyboardCount: number, localClientColor: string},
	) {
		const dispatch = useDispatch()

		return (
			<Fragment>
				<TopMenuBar />
				<AddNodeMenuItems />
			</Fragment>
		)

		function TopMenuBar() {
			return (
				<MenuItem
					attributes={{
						className: 'contextMenuTop',
						title: 'shift + right click to get browser context menu',
					}}
					preventClose={true}
				>
					do stuff
				</MenuItem>
			)
		}

		function AddNodeMenuItems() {
			return (
				<Fragment>
					{getAddableNodeInfos()
						.filter(x => localClientKeyboardCount === 0 ? true : x.type !== ConnectionNodeType.virtualKeyboard)
						.map(nodeInfo => {
							return (
								<AddNodeMenuItem
									key={nodeInfo.typeName}
									nodeInfo={nodeInfo}
								/>
							)
						})
						.toList()}
				</Fragment>
			)
		}

		function AddNodeMenuItem({nodeInfo}: {nodeInfo: IConnectionNodeInfo}) {
			return (
				<MenuItem
					onClick={e => {
						if (nodeInfo.type === ConnectionNodeType.virtualKeyboard) {
							if (localClientKeyboardCount !== 0) return

							const newState = new VirtualKeyboardState(localClientId, localClientColor)
							dispatch(nodeInfo.addNodeActionCreator(newState))
							createPosition(dispatch, newState, e)
						} else {
							// Be careful when changing the id to be local client
							// The server currently deletes most things that a user owns when they disconnect
							const newState = new nodeInfo.stateConstructor(serverClientId)
							dispatch(nodeInfo.addNodeActionCreator(newState))
							createPosition(dispatch, newState, e)
							if (nodeInfo.autoConnectToClock) {
								dispatch(connectionsActions.add(new Connection(
									MASTER_CLOCK_SOURCE_ID,
									ConnectionNodeType.masterClock,
									newState.id,
									newState.type,
								)))
							}
							if (nodeInfo.autoConnectToAudioOutput) {
								dispatch(connectionsActions.add(new Connection(
									newState.id,
									newState.type,
									MASTER_AUDIO_OUTPUT_TARGET_ID,
									ConnectionNodeType.audioOutput,
								)))
							}
						}
					}}
				>
					{nodeInfo.typeName}
				</MenuItem>
			)
		}
	})

interface DeleteMenuData {
	nodeId: string
	nodeType: ConnectionNodeType
}

interface NodeMenuItemsProps {
	nodeType: ConnectionNodeType
}

const hoverDelayMs = 1

const deleteMenuLabels = List([
	`Delete`,
	`You can't undo this (yet)`,
])

const NodeMenuItems = React.memo(function _MenuItems({nodeType}: NodeMenuItemsProps) {
	const {isDeletable, isNodeCloneable} = getConnectionNodeInfo(nodeType)
	const dispatch = useDispatch()

	return (
		<Fragment>
			<TopMenuBar />
			{isDeletable && <DeleteNodeMenuItem />}
			{!isDeletable && <DontDeleteMeMenuItem />}
			{isNodeCloneable && <CloneNodeMenuItem />}
		</Fragment>
	)

	function TopMenuBar() {
		return (
			<MenuItem
				attributes={{
					className: 'contextMenuTop',
					title: 'shift + right click to get browser context menu',
				}}
				preventClose={true}
			>
				do specific node stuff
			</MenuItem>
		)
	}

	function DeleteNodeMenuItem() {
		return generateDeleteSubMenus(
			<MenuItem
				onClick={(_, {nodeId}: DeleteMenuData) => {
					dispatch(deleteNode(nodeId))
				}}
				attributes={{
					title: 'dew it',
				}}
			>
				🔪
			</MenuItem>,
			deleteMenuLabels,
		)
	}

	function CloneNodeMenuItem() {

		const onClick = (withConnections: Parameters<typeof localActions.cloneNode>[2]) =>
			(_: any, {nodeId}: DeleteMenuData) => {
				dispatch(localActions.cloneNode(nodeId, nodeType, withConnections))
			}

		return <SubMenu
			title={<div>Clone...</div>}
			hoverDelay={hoverDelayMs}
		>
			<MenuItem onClick={onClick('all')}>
				With all connections
			</MenuItem>
			<MenuItem onClick={onClick('none')}>
				With no connections
			</MenuItem>
			<MenuItem onClick={onClick('default')}>
				With default connections
			</MenuItem>
		</SubMenu>
	}

	function generateDeleteSubMenus(tree: React.ReactElement<any>, labels: List<string>): React.ReactElement<any> {
		if (labels.count() === 0) return tree

		return generateDeleteSubMenus(
			<SubMenu
				title={<div>{labels.last()}</div>}
				hoverDelay={hoverDelayMs}
				className={oneLine`deleteSubMenu
					deleteSubMenu-${labels.count()}
					${labels.count() === deleteMenuLabels.count() ? 'deleteSubMenu-last' : ''}
					${labels.count() === deleteMenuLabels.count() - 1 ? 'deleteSubMenu-secondToLast' : ''}
					${labels.count() === 1 ? 'deleteSubMenu-first' : ''}
				`}
			>
				{tree}
			</SubMenu>,
			labels.pop(),
		)
	}

	function DontDeleteMeMenuItem() {
		return (
			<MenuItem disabled>
				I'M INVINCIBLE
			</MenuItem>
		)
	}
})

interface MenuItemProps {
	label: string
}

function createPosition(dispatch: Dispatch, state: IConnectable, e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) {
	dispatch(addPosition(
		makePosition({
			...state,
			id: state.id,
			targetType: state.type,
			width: state.width,
			height: state.height,
			...getPositionFromMouseOrTouchEvent(e),
		}),
	))
}

function getPositionFromMouseOrTouchEvent(e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>): Point {
	const x = (e as MouseEvent).clientX || 0
	const y = (e as MouseEvent).clientY || 0
	return toGraphSpace(x, y)
}

export const ConnectedContextMenuContainer = shamuConnect(
	(state): ReduxProps => {
		const localClient = selectLocalClient(state)
		return {
			localClientId: localClient.id,
			localClientKeyboardCount: selectVirtualKeyboardsByOwner(state.room, localClient.id).length,
			localClientColor: localClient.color,
		}
	},
)(ContextMenuContainer)
