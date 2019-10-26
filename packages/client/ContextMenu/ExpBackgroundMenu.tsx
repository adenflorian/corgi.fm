import React, {Fragment, MouseEvent} from 'react'
import {useDispatch} from 'react-redux'
import {MenuItem} from 'react-contextmenu'
import {Set} from 'immutable'
import {
	expPositionActions, makeExpPosition, expNodesActions,
	makeExpNodeState, ExpNodeState, ExpPosition, expNodeTypes, expLocalActions,
} from '@corgifm/common/redux'
import {Dispatch} from 'redux'
import {serverClientId} from '@corgifm/common/common-constants'
import {toGraphSpace} from '../SimpleGraph/Zoom'
import {TopMenuBar} from './TopMenuBar'

interface ExpBackgroundMenuItemsProps {
	localClientId: Id
	localClientKeyboardCount: number
	localClientColor: string
}

export const ExpBackgroundMenuItems = React.memo(
	function _MenuItems(
		{localClientId, localClientKeyboardCount, localClientColor}:
		ExpBackgroundMenuItemsProps,
	) {
		const dispatch = useDispatch()

		return (
			<Fragment>
				<TopMenuBar label="background menu" />
				<AddExpNodeMenuItems />
			</Fragment>
		)

		function AddExpNodeMenuItems() {
			return (
				<Fragment>
					{expNodeTypes
						.filter(x => x !== 'groupInput' && x !== 'groupOutput')
						// .filter(
						// 	x => localClientKeyboardCount === 0
						// 		? true
						// 		: x.type !== ConnectionNodeType.virtualKeyboard)
						.map(type => {
							return (
								<AddNodeMenuItem
									key={type}
									type={type}
								/>
							)
						})}
				</Fragment>
			)
		}

		function AddNodeMenuItem({type}: {type: ExpPosition['targetType']}) {
			return (
				<MenuItem
					onClick={e => {
						// if (nodeInfo.type === ConnectionNodeType.virtualKeyboard) {
						// 	if (localClientKeyboardCount !== 0) return

						// 	const newState = new VirtualKeyboardState()
						// 	dispatch(nodeInfo.addNodeActionCreator(newState))
						// 	createPosition(dispatch, newState, e, localClientId, localClientColor)
						// } else {
						// Be careful when changing the id to be local client
						// The server currently deletes most things that a user owns
						// when they disconnect

						if (type === 'group') {
							dispatch(expLocalActions.createGroup(Set()))
						} else {
							const newExpNode = makeExpNodeState({type})
							dispatch(expNodesActions.add(newExpNode))
							createPosition(dispatch, newExpNode, e, serverClientId)
						}

						// if (nodeInfo.autoConnectToClock) {
						// 	dispatch(connectionsActions.add(new Connection(
						// 		MASTER_CLOCK_SOURCE_ID,
						// 		ConnectionNodeType.masterClock,
						// 		newState.id,
						// 		newState.type,
						// 		0,
						// 		0,
						// 	)))
						// }
						// if (nodeInfo.autoConnectToAudioOutput) {
						// 	dispatch(connectionsActions.add(new Connection(
						// 		newState.id,
						// 		newState.type,
						// 		MASTER_AUDIO_OUTPUT_TARGET_ID,
						// 		ConnectionNodeType.audioOutput,
						// 		0,
						// 		0,
						// 	)))
						// }
						// }
					}}
				>
					{type}
				</MenuItem>
			)
		}
	})

function createPosition(
	dispatch: Dispatch, state: ExpNodeState,
	e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
	ownerId: Id,
) {
	dispatch(expPositionActions.add(
		makeExpPosition({
			id: state.id,
			targetType: state.type,
			ownerId,
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
