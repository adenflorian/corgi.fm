import React, {Fragment} from 'react'
import {useDispatch} from 'react-redux'
import {ContextMenu, SubMenu, MenuItem, connectMenu} from 'react-contextmenu'
import {List} from 'immutable'
import {oneLine} from 'common-tags'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {getConnectionNodeInfo} from '@corgifm/common/redux'
import {nodeMenuId} from '../client-constants'
import {deleteNode, localActions} from '../local-middleware'

interface NodeMenuProps {
	trigger: {
		nodeType: ConnectionNodeType
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

export const ConnectedNodeMenu = connectMenu(nodeMenuId)(NodeMenu)

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
				<span role="img" aria-label="delete">🔪</span>
			</MenuItem>,
			deleteMenuLabels,
		)
	}

	function CloneNodeMenuItem() {

		const onClick = (withConnections: Parameters<typeof localActions.cloneNode>[2]) =>
			(_: any, {nodeId}: DeleteMenuData) => {
				dispatch(localActions.cloneNode(nodeId, nodeType, withConnections))
			}

		return (
			<SubMenu
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
		)
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
				{`I'M INVINCIBLE`}
			</MenuItem>
		)
	}
})
