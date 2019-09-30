import React, {Fragment} from 'react'
import {useDispatch} from 'react-redux'
import {ContextMenu, SubMenu, MenuItem, connectMenu} from 'react-contextmenu'
import {List} from 'immutable'
import {oneLine} from 'common-tags'
import {
	localActions, ExpPosition,
} from '@corgifm/common/redux'
import {expNodeMenuId} from '../client-constants'
import {TopMenuBar} from './TopMenuBar'

interface ExpNodeMenuProps {
	trigger: {
		nodeType: ExpPosition['targetType']
	}
}

function ExpNodeMenu({trigger}: ExpNodeMenuProps) {
	return (
		<ContextMenu id={expNodeMenuId}>
			<ExpNodeMenuItems
				nodeType={trigger ? trigger.nodeType : 'dummy'}
			/>
		</ContextMenu>
	)
}

export const ConnectedExpNodeMenu = connectMenu(expNodeMenuId)(ExpNodeMenu)

interface DeleteMenuData {
	nodeId: Id
	nodeType: ExpPosition['targetType']
}

interface ExpNodeMenuItemsProps {
	nodeType: ExpPosition['targetType']
}

const hoverDelayMs = 1

const deleteMenuLabels = List([
	`Delete...`,
	`You can't undo this (yet)`,
])

const ExpNodeMenuItems = React.memo(function _MenuItems({nodeType}: ExpNodeMenuItemsProps) {
	const dispatch = useDispatch()

	return (
		<Fragment>
			<TopMenuBar label="node menu" />
			<DeleteExpNodeMenuItem />
			<CloneExpNodeMenuItem />
		</Fragment>
	)

	function DeleteExpNodeMenuItem() {
		return generateDeleteSubMenus(
			<MenuItem
				onClick={(_, {nodeId}: DeleteMenuData) => {
					dispatch(localActions.deleteExpNode(nodeId))
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

	function CloneExpNodeMenuItem() {

		const onClick = (withConnections: Parameters<typeof localActions.cloneExpNode>[1]) =>
			(_: any, {nodeId}: DeleteMenuData) => {
				dispatch(localActions.cloneExpNode(nodeId, withConnections))
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
				{/* TODO */}
				{/* <MenuItem onClick={onClick('default')}>
					With default connections
				</MenuItem> */}
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
})
