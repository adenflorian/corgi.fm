/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, {useCallback, useMemo, useState, useLayoutEffect, Fragment} from 'react'
import {useDispatch, useSelector, shallowEqual} from 'react-redux'
import {ContextMenuTrigger} from 'react-contextmenu'
import {
	shamuMetaActions, selectExpPosition, expPositionActions, IClientAppState,
} from '@corgifm/common/redux'
import {panelHeaderHeight} from '@corgifm/common/common-constants'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {handleClassName, expNodeMenuId} from '../client-constants'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {ExpPanel} from '../Panel/ExpPanel'
import {useNodeContext} from '../Experimental/CorgiNode'

interface Props {
	children: React.ReactNode
}

export function SimpleGraphNodeExp({children}: Props) {
	const nodeContext = useNodeContext()

	const positionId = nodeContext.id

	const color = nodeContext.getColor()

	const selectedNode = useSelector((state: IClientAppState) => state.room.expPositions.meta.selectedNode)

	const selectedNodeId = selectedNode ? selectedNode.id : undefined

	const isSelected = positionId === selectedNodeId

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
		dispatch(expPositionActions.clicked(positionId))
		dispatch(shamuMetaActions.setSelectedNode({id: positionId, type: ConnectionNodeType.dummy}))
	}, [dispatch, positionId])

	const onBlur = useCallback(() => {
		dispatch(shamuMetaActions.clearSelectedNode())
	}, [dispatch])

	const [dragging, setDragging] = useState(false)

	const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement
		if (target.classList && target.classList.contains(handleClassName)) {
			setDragging(true)
		}
	}, [])

	useLayoutEffect(() => {
		if (!dragging) return

		const onMouseMove = (e: MouseEvent) => {
			dispatch(expPositionActions.move(positionId, {
				x: x + (e.movementX / simpleGlobalClientState.zoom),
				y: y + (e.movementY / simpleGlobalClientState.zoom),
			}))
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
	}, [dispatch, dragging, positionId, x, y])

	const nodeName = nodeContext.getName()

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
					transition: dragging ? undefined : 'transform 0.1s',
				}}
				onMouseDown={handleMouseDown}
			>
				{/* This forces the node onto its own composite layer, without making it blurry when zooming in
				having our own layer will restrict paints and stuff into this layer only
				and makes transforms and opacity super fast */}
				<div className="hack" />
				{
					useMemo(() => {
						return (
						// @ts-ignore disableIfShiftIsPressed
							<ContextMenuTrigger
								id={expNodeMenuId}
								disableIfShiftIsPressed={true}
								holdToDisplay={-1}
								nodeId={positionId}
								nodeType={ConnectionNodeType.dummy}
								collect={collect}
							>
								<ExpPanel
									color={color}
									id={positionId}
									label={nodeName}
								>
									{children}
								</ExpPanel>
							</ContextMenuTrigger>
						)
					}, [children, color, nodeName, positionId])
				}
			</div>
		</Fragment>
	)
}

const collect = ({nodeId, nodeType}: any) => ({
	nodeId,
	nodeType,
})
