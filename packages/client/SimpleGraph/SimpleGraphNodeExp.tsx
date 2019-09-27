/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, {useCallback, useMemo, useState, useLayoutEffect} from 'react'
import {useDispatch} from 'react-redux'
import {ContextMenuTrigger} from 'react-contextmenu'
import {
	ExpPosition, selectOptions,
	shamuConnect, shamuMetaActions, selectExpPosition, expPositionActions,
} from '@corgifm/common/redux'
import {panelHeaderHeight} from '@corgifm/common/common-constants'
import {ConnectionNodeType} from '@corgifm/common/common-types';
import {handleClassName, nodeMenuId} from '../client-constants'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {Panel} from '../Panel/Panel'

interface ISimpleGraphNodeProps {
	positionId: Id
}

interface ISimpleGraphNodeReduxProps {
	position: ExpPosition
	color: string
	highQuality: boolean
	isSelected: boolean
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps

export function SimpleGraphNode(props: ISimpleGraphNodeAllProps) {
	const {
		positionId, color,
		position, isSelected,
	} = props

	const {x, y, width, height, zIndex} = position

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

	return (
		<div
			className={`simpleGraphNode ${isSelected ? 'selectedNode' : ''}`}
			onBlur={onBlur}
			// TODO
			tabIndex={0}
			onFocus={handleFocus}
			style={{
				transform: `translate(${x}px, ${y}px)`,
				position: 'absolute',
				// Might not need this with the hack below
				// willChange: fancyZoomPan ? '' : 'transform',
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
							id={nodeMenuId}
							disableIfShiftIsPressed={true}
							holdToDisplay={-1}
							nodeId={positionId}
							nodeType={ConnectionNodeType.dummy}
							collect={collect}
						>
							{getExperimentalPanel(position, color)}
						</ContextMenuTrigger>
					)
				}, [color, position, positionId])
			}
			{/* <canvas
				id={ECSSequencerRenderSystem.canvasIdPrefix + positionId}
				style={{
					position: 'absolute',
					width,
					height,
					bottom: 0,
					left: 0,
					pointerEvents: 'none',
					zIndex: 999999,
					display: highQuality ? undefined : 'none',
				}}
				width={width}
				height={height}
			/> */}
		</div>
	)
}

const collect = ({nodeId, nodeType}: any) => ({
	nodeId,
	nodeType,
})

export function getExpAnchorId(nodeId: Id): string {
	return `expAnchor-${nodeId}`
}

function getExperimentalPanel(position: ExpPosition, color: string) {
	return (
		<Panel
			color={color}
			id={position.id}
			label="test"
		>
			<div id={getExpAnchorId(position.id)} className={`experimentalAnchor`} />
		</Panel>
	)
}

export const ConnectedSimpleGraphNodeExp = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectExpPosition(state.room, positionId)
		const selectedNode = state.room.expPositions.meta.selectedNode
		const selectedId = selectedNode ? selectedNode.id : undefined

		return {
			position,
			color: position.color,
			highQuality: selectOptions(state).graphicsECS,
			isSelected: positionId === selectedId,
		}
	},
)(SimpleGraphNode)
