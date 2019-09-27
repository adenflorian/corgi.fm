/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, {useCallback, useMemo, useState, useLayoutEffect} from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import {ConnectionNodeType} from '@corgifm/common/common-types'
import {
	findNodeInfo, IPosition, movePosition,
	nodeClicked, selectConnectionSourceColorByTargetId,
	selectOptions, selectPosition, selectShamuMetaState,
	shamuConnect, shamuMetaActions, IClientAppState, RoomType,
} from '@corgifm/common/redux'
import {panelHeaderHeight} from '@corgifm/common/common-constants'
import {useDispatch, useSelector} from 'react-redux'
import {BasicSampler} from '../BasicSampler/BasicSampler'
import {graphSizeX, graphSizeY, handleClassName, nodeMenuId} from '../client-constants'
import {ECSSequencerRenderSystem} from '../ECS/ECSSequencerRenderSystem'
import {ConnectedGridSequencerContainer} from '../GridSequencer/GridSequencerContainer'
import {GroupSequencerView} from '../GroupSequencer/GroupSequencer'
import {ConnectedInfiniteSequencer} from '../InfiniteSequencer/InfiniteSequencer'
import {ConnectedBasicSynthesizerView} from '../Instruments/BasicSynthesizerView'
import {Keyboard} from '../Keyboard/Keyboard'
import {ConnectedMasterControls} from '../MasterControls'
import {ConnectedSimpleCompressor} from '../ShamuNodes/SimpleCompressor/SimpleCompressorView'
import {ConnectedSimpleDelay} from '../ShamuNodes/SimpleDelay/SimpleDelayView'
import {ConnectedSimpleReverb} from '../ShamuNodes/SimpleReverb/SimpleReverbView'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import {ConnectedVolumeControl} from '../Volume/VolumeControl'
import {BetterSequencer} from '../BetterSequencer/BetterSequencer'
import {Panel} from '../Panel/Panel'

interface ISimpleGraphNodeProps {
	positionId: Id
}

interface ISimpleGraphNodeReduxProps {
	position: IPosition
	color: string
	highQuality: boolean
	fancyZoomPan: boolean
	isSelected: boolean
}

type ISimpleGraphNodeAllProps = ISimpleGraphNodeProps & ISimpleGraphNodeReduxProps

export function SimpleGraphNode(props: ISimpleGraphNodeAllProps) {
	const {
		positionId, color, highQuality,
		position, fancyZoomPan, isSelected,
	} = props

	const {x, y, width, height, targetType, zIndex} = position

	const dispatch = useDispatch()

	const handleFocus = useCallback(() => {
		dispatch(nodeClicked(positionId))
		dispatch(shamuMetaActions.setSelectedNode({id: positionId, type: position.targetType}))
	}, [dispatch, position.targetType, positionId])

	const onBlur = useCallback(() => {
		dispatch(shamuMetaActions.clearSelectedNode())
	}, [dispatch])

	const [dragging, setDragging] = useState(false)

	const roomType = useSelector((state: IClientAppState) => state.room.roomInfo.roomType)

	const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		const target = e.target as HTMLElement
		if (target.classList && target.classList.contains(handleClassName)) {
			setDragging(true)
		}
	}, [])

	useLayoutEffect(() => {
		if (!dragging) return

		const onMouseMove = (e: MouseEvent) => {
			dispatch(movePosition(positionId, {
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
							nodeType={targetType}
							collect={collect}
						>
							{roomType === RoomType.Experimental
								? getExperimentalPanel(position, color)
								: getComponentByNodeType(targetType, positionId, color)}
						</ContextMenuTrigger>
					)
				}, [color, position, positionId, roomType, targetType])
			}
			<canvas
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
			/>
		</div>
	)
}

const collect = ({nodeId, nodeType}: any) => ({
	nodeId,
	nodeType,
})

function getComponentByNodeType(type: ConnectionNodeType, id: Id, color: string) {
	switch (type) {
		case ConnectionNodeType.masterClock: return <ConnectedMasterControls color={color} />
		case ConnectionNodeType.audioOutput: return <ConnectedVolumeControl color={color} />

		case ConnectionNodeType.groupSequencer: return <GroupSequencerView id={id} color={color} />

		case ConnectionNodeType.betterSequencer: return <BetterSequencer id={id} />
		case ConnectionNodeType.gridSequencer: return <ConnectedGridSequencerContainer id={id} />
		case ConnectionNodeType.infiniteSequencer: return <ConnectedInfiniteSequencer id={id} />
		case ConnectionNodeType.virtualKeyboard: return <Keyboard id={id} />

		case ConnectionNodeType.basicSynthesizer: return <ConnectedBasicSynthesizerView id={id} color={color} />
		case ConnectionNodeType.basicSampler: return <BasicSampler id={id} color={color} />

		case ConnectionNodeType.simpleReverb: return <ConnectedSimpleReverb id={id} color={color} />
		case ConnectionNodeType.simpleCompressor: return <ConnectedSimpleCompressor id={id} color={color} />
		case ConnectionNodeType.simpleDelay: return <ConnectedSimpleDelay id={id} color={color} />

		default: throw new Error('invalid type: ' + type.toString() + ' ' + id)
	}
}

export function getExpAnchorId(nodeId: Id): string {
	return `expAnchor-${nodeId}`
}

function getExperimentalPanel(position: IPosition, color: string) {
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

export const ConnectedSimpleGraphNode = shamuConnect(
	(state, {positionId}: ISimpleGraphNodeProps): ISimpleGraphNodeReduxProps => {
		const position = selectPosition(state.room, positionId)
		const selectedNode = selectShamuMetaState(state.room).selectedNode
		const selectedId = selectedNode ? selectedNode.id : undefined

		return {
			position,
			// TODO Don't get color here
			color: findNodeInfo(position.targetType).color
				|| selectConnectionSourceColorByTargetId(state, positionId),
			highQuality: selectOptions(state).graphicsECS,
			fancyZoomPan: selectOptions(state).graphicsExpensiveZoomPan,
			isSelected: positionId === selectedId,
		}
	},
)(SimpleGraphNode)
