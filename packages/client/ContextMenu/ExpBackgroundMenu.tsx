import React, {Fragment, MouseEvent, useMemo, useState} from 'react'
import {useDispatch, useStore} from 'react-redux'
import {MenuItem, SubMenu, connectMenu, ContextMenu} from 'react-contextmenu'
import {Set} from 'immutable'
import {
	expPositionActions, makeExpPosition, expNodesActions,
	makeExpNodeState, ExpNodeState, ExpPosition, expNodeTypes,
	expLocalActions, ExpNodeType, IClientAppState,
	selectPresetsForExpNodeTypeSlow, ExpGraph, selectLocalClientId, selectRoomMember,
} from '@corgifm/common/redux'
import {Dispatch} from 'redux'
import {serverClientId} from '@corgifm/common/common-constants'
import {toGraphSpace} from '../SimpleGraph/Zoom'
import {logger} from '../client-logger'
import {expBackgroundMenuId} from '../client-constants'
import {useBoolean} from '../react-hooks'
import {TopMenuBar} from './TopMenuBar'

interface ExpBackgroundMenuProps {
	trigger: {}
}

function ExpBackgroundMenu({trigger}: ExpBackgroundMenuProps) {
	const [position, setPosition] = useState({x: 0, y: 0})
	const [visible, show, hide] = useBoolean(false)
	return (
		<ContextMenu
			id={expBackgroundMenuId}
			onShow={e => {
				setPosition(toGraphSpace(e.detail.position.x || 0, e.detail.position.y || 0))
				show()
			}}
			onHide={hide}
		>
			{visible && <ExpBackgroundMenuItems position={position} />}
		</ContextMenu>
	)
}

export const ConnectedExpBackgroundMenu = connectMenu(expBackgroundMenuId)(ExpBackgroundMenu)

interface ExpBackgroundMenuItemsProps {
	readonly position: Point
}

const hoverDelayMs = 1

export const ExpBackgroundMenuItems = React.memo(
	function _MenuItems({position}: ExpBackgroundMenuItemsProps) {
		return (
			<Fragment>
				<TopMenuBar label="background menu" />
				{expNodeTypes
					.filter(x => x !== 'groupInput' && x !== 'groupOutput')
					.map(nodeType => {
						return (
							<AddNodeMenuItem
								key={nodeType}
								nodeType={nodeType}
								position={position}
							/>
						)
					})}
			</Fragment>
		)
	})

interface AddNodeMenuItemProps {
	readonly position: Point
	readonly nodeType: ExpNodeType
}

function AddNodeMenuItem({nodeType, position}: AddNodeMenuItemProps) {
	const dispatch = useDispatch()
	const store = useStore<IClientAppState>()
	return (
		<SubMenu
			title={<div>{nodeType}</div>}
			hoverDelay={hoverDelayMs}
		>
			<MenuItem
				onClick={e => {
					if (nodeType === 'group') {
						dispatch(expLocalActions.createGroup(Set()))
					} else {
						const state = store.getState()
						const localClientId = selectLocalClientId(state)
						const currentNodeGroupId = selectRoomMember(state.room, localClientId).groupNodeId
						const newExpNode = makeExpNodeState({type: nodeType, groupId: currentNodeGroupId})
						dispatch(expNodesActions.add(newExpNode))
						createPosition(dispatch, newExpNode, position, serverClientId)
					}
				}}
			>
				Default Preset
			</MenuItem>
			<AddNodeSubMenuItems nodeType={nodeType} position={position} />
		</SubMenu>
	)
}

const AddNodeSubMenuItems = React.memo(function _AddNodeSubMenuItems({nodeType, position}: {nodeType: ExpNodeType, position: Point}) {
	const store = useStore<IClientAppState>()
	const dispatch = useDispatch()
	const presets = useMemo(() => {
		return selectPresetsForExpNodeTypeSlow(store.getState().room, nodeType)
	}, [nodeType, store])
	const onClick = (preset: ExpGraph) =>
		(e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
			dispatch(expLocalActions.createNodeFromPreset(preset.meta.id, position))
		}
	return (
		<Fragment>
			{presets.map(preset =>
				<MenuItem key={preset.meta.id as string} onClick={onClick(preset)}>
					{preset.meta.name}
				</MenuItem>
			).toList()}
		</Fragment>
	)
})

function createPosition(
	dispatch: Dispatch, state: ExpNodeState,
	position: Point, ownerId: Id,
) {
	dispatch(expPositionActions.add(
		makeExpPosition({
			id: state.id,
			targetType: state.type,
			ownerId,
			...position,
		}),
	))
}
