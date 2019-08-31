import React, {Fragment, MouseEvent} from 'react'
import {useDispatch} from 'react-redux'
import {MenuItem} from 'react-contextmenu'
import {
	getAddableNodeInfos, IConnectionNodeInfo, VirtualKeyboardState, addPosition,
	makePosition, MASTER_AUDIO_OUTPUT_TARGET_ID, connectionsActions, Connection,
	MASTER_CLOCK_SOURCE_ID,
	findNodeInfo,
} from '@corgifm/common/redux'
import {ConnectionNodeType, IConnectable} from '@corgifm/common/common-types'
import {Dispatch} from 'redux'
import {serverClientId} from '@corgifm/common/common-constants'
import {CssColor} from '@corgifm/common/shamu-color'
import {toGraphSpace} from '../SimpleGraph/Zoom'
import {TopMenuBar} from './TopMenuBar'

interface BackgroundMenuItemsProps {
	localClientId: Id
	localClientKeyboardCount: number
	localClientColor: string
}

export const BackgroundMenuItems = React.memo(
	function _MenuItems(
		{localClientId, localClientKeyboardCount, localClientColor}:
		BackgroundMenuItemsProps,
	) {
		const dispatch = useDispatch()

		return (
			<Fragment>
				<TopMenuBar label="background menu" />
				<AddNodeMenuItems />
			</Fragment>
		)

		function AddNodeMenuItems() {
			return (
				<Fragment>
					{getAddableNodeInfos()
						.filter(
							x => localClientKeyboardCount === 0
								? true
								: x.type !== ConnectionNodeType.virtualKeyboard)
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

							const newState = new VirtualKeyboardState(localClientId)
							dispatch(nodeInfo.addNodeActionCreator(newState))
							createPosition(dispatch, newState, e, localClientColor)
						} else {
							// Be careful when changing the id to be local client
							// The server currently deletes most things that a user owns
							// when they disconnect
							const newState = new nodeInfo.StateConstructor(serverClientId)
							dispatch(nodeInfo.addNodeActionCreator(newState))
							createPosition(dispatch, newState, e)
							if (nodeInfo.autoConnectToClock) {
								dispatch(connectionsActions.add(new Connection(
									MASTER_CLOCK_SOURCE_ID,
									ConnectionNodeType.masterClock,
									newState.id,
									newState.type,
									0,
									0,
								)))
							}
							if (nodeInfo.autoConnectToAudioOutput) {
								dispatch(connectionsActions.add(new Connection(
									newState.id,
									newState.type,
									MASTER_AUDIO_OUTPUT_TARGET_ID,
									ConnectionNodeType.audioOutput,
									0,
									0,
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

function createPosition(
	dispatch: Dispatch, state: IConnectable,
	e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
	color?: string,
) {
	dispatch(addPosition(
		makePosition({
			...state,
			id: state.id,
			targetType: state.type,
			color: color || findNodeInfo(state.type).color,
			...getPositionFromMouseOrTouchEvent(e),
		}),
	))
}

function getPositionFromMouseOrTouchEvent(
	e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
): Point {
	const x = (e as MouseEvent).clientX || 0
	const y = (e as MouseEvent).clientY || 0
	return toGraphSpace(x, y)
}
