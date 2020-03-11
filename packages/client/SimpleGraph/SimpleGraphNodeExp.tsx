/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, {useCallback, useMemo, useState, useLayoutEffect, Fragment} from 'react'
import {useDispatch, useSelector, shallowEqual, useStore} from 'react-redux'
import {ContextMenuTrigger} from 'react-contextmenu'
import {Set} from 'immutable'
import {
	shamuMetaActions, selectExpPosition, expPositionActions,
	IClientAppState, roomMemberActions, selectShamuMetaState, selectExpAllPositions, selectExpGraphsState,
} from '@corgifm/common/redux'
import {panelHeaderHeight} from '@corgifm/common/common-constants'
import {handleClassName, expNodeMenuId} from '../client-constants'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {ExpPanel} from '../Panel/ExpPanel'
import {useNodeContext} from '../Experimental/CorgiNode'
import {useLocalClientId} from '../react-hooks'
import {useStringChangedEvent} from '../Experimental/hooks/useCorgiEvent'

interface Props {
	children: React.ReactNode
}

export function SimpleGraphNodeExp({children}: Props) {
	const nodeContext = useNodeContext()

	const positionId = nodeContext.id

	const color = useStringChangedEvent(nodeContext.onColorChange)

	const selectedNodes = useSelector((state: IClientAppState) => selectExpGraphsState(state.room).mainGraph.positions.meta.selectedNodes)

	const isSelected = selectedNodes.includes(positionId)

	const {x, y, width, height, zIndex} = useSelector((state: IClientAppState) => {
		const position = selectExpPosition(state.room, positionId)
		return {
			x: position.x,
			y: position.y,
			width: position.width,
			height: position.height,
			zIndex: position.zIndex,
		}
	}, shallowEqual)

	const dispatch = useDispatch()

	const handleFocus = useCallback(() => {
		// dispatch(expPositionActions.clicked(positionId))
		// if (!isSelected) dispatch(shamuMetaActions.setSelectedNodes(Set([positionId])))
	}, [])

	const onBlur = useCallback(() => {
		// dispatch(shamuMetaActions.setSelectedNodes(selectedNodes.delete(positionId)))
	}, [])

	const [dragging, setDragging] = useState(false)
	const [didDrag, setDidDrag] = useState(false)

	const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (e.button !== 0) return
		if (e.shiftKey) {
			dispatch(shamuMetaActions.setSelectedNodes(isSelected
				? selectedNodes.delete(positionId)
				: selectedNodes.add(positionId)))
		} else if (!isSelected) {
			dispatch(shamuMetaActions.setSelectedNodes(Set([positionId])))
		}
		const target = e.target as HTMLElement
		if (target.classList && target.classList.contains(handleClassName)) {
			setDragging(true)
			setDidDrag(false)
		}
		dispatch(expPositionActions.clicked(positionId))
	}, [dispatch, isSelected, positionId, selectedNodes])

	const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (e.button !== 0) return
		if (!e.shiftKey && !didDrag) {
			dispatch(shamuMetaActions.setSelectedNodes(Set([positionId])))
		}
	}, [didDrag, dispatch, positionId])

	const store = useStore()

	useLayoutEffect(() => {
		if (!dragging) return

		const onMouseMove = (e: MouseEvent) => {
			const state = store.getState()
			const allPositions = selectExpAllPositions(state.room)
			const selected = selectShamuMetaState(state.room).selectedNodes
			const positionsToMove = allPositions.filter(pos => selected.includes(pos.id))
				.map(pos => ({
					x: pos.x + (e.movementX / simpleGlobalClientState.zoom),
					y: pos.y + (e.movementY / simpleGlobalClientState.zoom),
				}))

			dispatch(expPositionActions.moveMany(positionsToMove))
			setDidDrag(true)
		}

		const onMouseUp = () => {
			setDragging(false)
		}

		window.addEventListener('mousemove', onMouseMove)
		window.addEventListener('mouseup', onMouseUp)

		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			window.removeEventListener('mouseup', onMouseUp)
		}
	}, [dispatch, dragging, positionId, store])

	const nodeName = useStringChangedEvent(nodeContext.onNameChange)

	const localClientId = useLocalClientId()

	const onHeaderDoubleClick = useCallback(() => {
		if (nodeContext.type === 'group' || nodeContext.type === 'polyphonicGroup') {
			dispatch(roomMemberActions.setNodeGroup(localClientId, nodeContext.id))
		}
	}, [dispatch, localClientId, nodeContext.id, nodeContext.type])

	return (
		<Fragment>
			<div
				className={`simpleGraphNode ${isSelected ? 'selectedNode' : ''}`}
				onBlur={onBlur}
				// TODO
				tabIndex={0}
				onFocus={handleFocus}
				style={{
					transform: `translate(${x}px, ${y}px)`,
					position: 'absolute',
					width,
					height: height + panelHeaderHeight,
					zIndex,
					top: -panelHeaderHeight,
					transition: isSelected || dragging ? undefined : 'transform 0.1s',
				}}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
			>
				{/* This forces the node onto its own composite layer, without making it blurry when zooming in
				having our own layer will restrict paints and stuff into this layer only
				and makes transforms and opacity super fast */}
				<div className="hack" />
				{
					useMemo(() => {
						return (
							// @ts-ignore
							<ContextMenuTrigger
								id={expNodeMenuId}
								// @ts-ignore
								disableIfShiftIsPressed={true}
								holdToDisplay={-1}
								nodeId={positionId}
								nodeType={nodeContext.type}
								collect={collect}
							>
								<ExpPanel
									color={color}
									id={positionId}
									label={nodeName}
									onHeaderDoubleClick={onHeaderDoubleClick}
								>
									{children}
								</ExpPanel>
							</ContextMenuTrigger>
						)
					}, [children, color, nodeContext.type, nodeName, onHeaderDoubleClick, positionId])
				}
			</div>
		</Fragment>
	)
}

const collect = ({nodeId, nodeType}: any) => ({
	nodeId,
	nodeType,
})
