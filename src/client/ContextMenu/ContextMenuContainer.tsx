import React, {MouseEvent, Fragment} from 'react'
import {backgroundMenuId, nodeMenuId} from '../client-constants';
import {MenuItem, ContextMenu, connectMenu} from 'react-contextmenu';
import './ContextMenu.less'
import {
	shamuConnect, addPosition,
	makePosition, getAddableNodeInfos, getConnectionNodeInfo
} from '../../common/redux';
import {Dispatch, AnyAction} from 'redux';
import {serverClientId} from '../../common/common-constants';
import {Point, IConnectable, ConnectionNodeType} from '../../common/common-types';
import {simpleGlobalClientState} from '../SimpleGlobalClientState';
import {deleteNode} from '../local-middleware';

interface AllProps {
	dispatch: Dispatch
}

export function ContextMenuContainer({dispatch}: AllProps) {
	return (
		<Fragment>
			<ContextMenu id={backgroundMenuId}>
				<BackgroundMenuItems
					dispatch={dispatch}
				/>
			</ContextMenu>
			<ConnectedNodeMenu
				dispatch={dispatch}
			/>
		</Fragment>
	)
}

interface NodeMenuProps {
	dispatch: Dispatch
	trigger: {
		nodeType: ConnectionNodeType
	}
}

function NodeMenu({dispatch, trigger}: NodeMenuProps) {
	return (
		<ContextMenu id={nodeMenuId}>
			<NodeMenuItems
				dispatch={dispatch}
				nodeType={trigger ? trigger.nodeType : ConnectionNodeType.dummy}
			/>
		</ContextMenu>
	)
}

const ConnectedNodeMenu = connectMenu(nodeMenuId)(NodeMenu)

const BackgroundMenuItems = React.memo(function _MenuItems({dispatch}: {dispatch: Dispatch}) {
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
				{getAddableNodeInfos().map(nodeInfo => {
					return (
						<AddNodeMenuItem
							key={nodeInfo.typeName}
							label={nodeInfo.typeName}
							stateConstructor={nodeInfo.stateConstructor}
							actionCreator={nodeInfo.addNodeActionCreator}
						/>
					)
				}).toList()}
			</Fragment>
		)
	}

	function AddNodeMenuItem(props: AddNodeMenuItemProps) {
		return (
			<MenuItem onClick={(e) => {
				const newState = new props.stateConstructor(serverClientId)
				dispatch(props.actionCreator(newState))
				createPosition(dispatch, newState, e)
			}}>
				{props.label}
			</MenuItem>
		)
	}
})

interface DeleteMenuData {
	nodeId: string
	nodeType: ConnectionNodeType
}

interface NodeMenuItemsProps {
	dispatch: Dispatch
	nodeType: ConnectionNodeType
}

const NodeMenuItems = React.memo(function _MenuItems({dispatch, nodeType}: NodeMenuItemsProps) {
	const isNodeDeletable = getConnectionNodeInfo(nodeType).isDeletable

	return (
		<Fragment>
			<TopMenuBar />
			{isNodeDeletable && <DeleteNodeMenuItem />}
			{!isNodeDeletable && <DontDeleteMeMenuItem />}
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
		return (
			<MenuItem onClick={(_, {nodeId}: DeleteMenuData) => {
				dispatch(deleteNode(nodeId))
			}}>
				KILL ME
			</MenuItem>
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

interface AddNodeMenuItemProps extends MenuItemProps {
	stateConstructor: new (ownerId: string) => IConnectable
	actionCreator: (state: any) => AnyAction
}

interface DeleteNodeMenuItemProps extends MenuItemProps {
	actionCreator: (state: any) => AnyAction
}

function createPosition(dispatch: Dispatch, state: IConnectable, e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) {
	dispatch(addPosition(
		makePosition({
			id: state.id,
			targetType: state.type,
			width: state.width,
			height: state.height,
			...getPositionFromMouseOrTouchEvent(e)
		})
	))
}

function getPositionFromMouseOrTouchEvent(e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>): Point {
	const x = (e as MouseEvent).clientX || 0
	const y = (e as MouseEvent).clientY || 0
	return toGraphSpace(x, y)
}

function toGraphSpace(x = 0, y = 0): Readonly<Point> {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return Object.freeze({
		x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
		y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
	})
}

export const ConnectedContextMenuContainer = shamuConnect()(ContextMenuContainer)
