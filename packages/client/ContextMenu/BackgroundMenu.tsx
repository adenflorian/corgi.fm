import React, {Fragment, MouseEvent} from 'react'
import {useDispatch} from 'react-redux'
import {MenuItem} from 'react-contextmenu'
import {
	getAddableNodeInfos, IConnectionNodeInfo, VirtualKeyboardState, addPosition,
	makePosition, MASTER_AUDIO_OUTPUT_TARGET_ID, connectionsActions, Connection,
	MASTER_CLOCK_SOURCE_ID,
} from '@corgifm/common/redux'
import {ConnectionNodeType, IConnectable, Point, Id} from '@corgifm/common/common-types'
import {Dispatch} from 'redux'
import {serverClientId} from '@corgifm/common/common-constants'
import {toGraphSpace} from '../SimpleGraph/Zoom'

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

							const newState = new VirtualKeyboardState(
								localClientId, localClientColor)
							dispatch(nodeInfo.addNodeActionCreator(newState))
							createPosition(dispatch, newState, e)
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

function createPosition(
	dispatch: Dispatch, state: IConnectable,
	e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
) {
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

function getPositionFromMouseOrTouchEvent(
	e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
): Point {
	const x = (e as MouseEvent).clientX || 0
	const y = (e as MouseEvent).clientY || 0
	return toGraphSpace(x, y)
}
