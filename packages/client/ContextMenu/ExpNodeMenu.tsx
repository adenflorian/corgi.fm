import React, {Fragment, useMemo} from 'react'
import {useDispatch, useStore} from 'react-redux'
import {ContextMenu, SubMenu, MenuItem, connectMenu} from 'react-contextmenu'
import {List} from 'immutable'
import {oneLine} from 'common-tags'
import {
	localActions, ExpPosition, WithConnections, expLocalActions, ExpNodeType,
	selectPresetsForExpNodeTypeSlow, ExpGraph, expNodesActions, chatSystemMessage, IClientAppState,
} from '@corgifm/common/redux'
import {expNodeMenuId} from '../client-constants'
import {logger} from '../client-logger'
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
			{nodeType !== 'groupInput' && nodeType !== 'groupOutput' && <DeleteExpNodeMenuItem />}
			{nodeType !== 'groupInput' && nodeType !== 'groupOutput' && <CloneExpNodeMenuItem />}
			{nodeType !== 'groupInput' && nodeType !== 'groupOutput' && <CreatePresetExpNodeMenuItem />}
			{nodeType !== 'groupInput' && nodeType !== 'groupOutput' && <LoadPresetExpNodeMenuItem nodeType={nodeType} />}
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
		const onClick = (withConnections: WithConnections) =>
			(_: any, {nodeId}: DeleteMenuData) => {
				dispatch(localActions.cloneSelectedExpNodes(withConnections))
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

	function CreatePresetExpNodeMenuItem() {
		const onClick = () =>
			(_: any, {nodeId}: DeleteMenuData) => {
				dispatch(expLocalActions.createPreset(nodeId))
			}

		return (
			<MenuItem onClick={onClick()}>
				Create Preset
			</MenuItem>
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

interface LoadPresetExpNodeMenuItemProps {
	readonly nodeType: ExpNodeType
}

function LoadPresetExpNodeMenuItem({nodeType}: LoadPresetExpNodeMenuItemProps) {
	const store = useStore<IClientAppState>()
	const dispatch = useDispatch()
	const presets = useMemo(() => {
		return selectPresetsForExpNodeTypeSlow(store.getState().room, nodeType)
	}, [nodeType, store])
	const onClick = (preset: ExpGraph) =>
		(_: any, {nodeId}: DeleteMenuData) => {
			const presetNode = preset.nodes.first(null)
			if (!presetNode) {
				logger.error('missing preset node', {presetNode, preset, nodes: preset.nodes.toJS()})
				dispatch(chatSystemMessage('Something went wrong while trying to load a preset', 'error'))
			} else {
				dispatch(expNodesActions.loadPreset(nodeId, presetNode))
			}
		}

	return (
		<SubMenu
			title={<div>Load Preset...</div>}
			hoverDelay={hoverDelayMs}
		>
			{presets.count() === 0
				? <MenuItem>{`No presets for "${nodeType}"`}</MenuItem>
				: presets.map(preset => {
					return (
						<MenuItem key={preset.meta.id as string} onClick={onClick(preset)}>
							{preset.meta.name}
						</MenuItem>
					)
				}).toList()
			}
		</SubMenu>
	)
}
