import {List} from 'immutable'
import React, {useCallback} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {
	ActiveGhostConnectorSourceOrTarget, expConnectionsActions,
	ExpGhostConnection,
	expGhostConnectorActions, GhostConnectorAddingOrMoving,
	LineType,
	createExpPositionSelector,
	createExpConnectionSelector,
	IClientAppState,
	selectLocalClientId,
	selectExpConnectionStackOrderForSource,
	selectExpConnectionStackOrderForTarget,
	selectRoomSettings,
} from '@corgifm/common/redux'
import {CssColor} from '@corgifm/common/shamu-color'
import {useNodeManagerContext} from '../Experimental/NodeManager'
import {longLineTooltip} from '../client-constants'
import {useConnection} from '../Experimental/hooks/useConnection'
import {ConnectionLine} from './ConnectionLine'
import './ConnectionView.less'
import {Connector} from './Connector'
import {LineState} from './LineState'
import {connectorWidth, connectorHeight, makeStraightPath, makeCurvedPath} from './ConnectionView'

interface Props {
	id: Id
}

const buffer = 50
const joint = 8

const defaultPosition = {x: 0, y: 0} as const

export const ExpConnectionView =
	React.memo(function _ExpConnectionView({id}: Props) {
		const {sourceId, sourcePort, targetId, targetPort, type} = useSelector(createExpConnectionSelector(id))
		const sourceNodePosition = useSelector(createExpPositionSelector(sourceId))
		const targetNodePosition = useSelector(createExpPositionSelector(targetId))

		const {zIndex: sourceZ} = sourceNodePosition
		const {zIndex: targetZ} = targetNodePosition

		const connectionInfo = useConnection(id)

		const sourcePortPosition = connectionInfo
			? connectionInfo.outputPort.position
			: defaultPosition

		const sourceX = sourceNodePosition.x + sourceNodePosition.width - sourcePortPosition.x
		const sourceY = sourceNodePosition.y + sourcePortPosition.y

		const targetPortPosition = connectionInfo
			? connectionInfo.inputPort.position
			: defaultPosition

		const targetX = targetNodePosition.x + targetPortPosition.x
		const targetY = targetNodePosition.y + targetPortPosition.y

		const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))

		const sourceStackOrder = useSelector((state: IClientAppState) => selectExpConnectionStackOrderForSource(state.room, id))
		const targetStackOrder = useSelector((state: IClientAppState) => selectExpConnectionStackOrderForTarget(state.room, id))
		const lineType = useSelector((state: IClientAppState) => selectRoomSettings(state.room).lineType)

		const dispatch = useDispatch()

		const sourceConnectorLeft = sourceX + (connectorWidth * sourceStackOrder)
		const sourceConnectorRight = sourceX + connectorWidth + (connectorWidth * sourceStackOrder)
		const targetConnectorLeft = targetX - connectorWidth - (connectorWidth * targetStackOrder)
		// const targetConnectorRight = targetX - (connectorWidth * targetStackOrder)

		const connectedLine = new LineState(
			sourceConnectorRight + 4,
			sourceY,
			targetConnectorLeft - 4,
			targetY,
		)

		const pathDPart1 = lineType === LineType.Straight
			? makeStraightPath(connectedLine)
			: makeCurvedPath(connectedLine)

		// This path is a hack to get the filter to work properly
		// It forces the "render box?" to be bigger than the actual drawn path
		const pathDPart2 = `M ${connectedLine.x1 + buffer} ${connectedLine.y1 + buffer} M ${connectedLine.x2 + buffer} ${connectedLine.y2 + buffer}`
			+ `M ${connectedLine.x1 - buffer} ${connectedLine.y1 - buffer} M ${connectedLine.x2 - buffer} ${connectedLine.y2 - buffer}`

		const pathDFull = pathDPart1 + ' ' + pathDPart2

		function onMouseDown(
			connectorPositionX: number,
			connectorPositionY: number,
			sourceOrTarget: ActiveGhostConnectorSourceOrTarget,
			parentNodeId: Id,
		) {
			dispatch(expGhostConnectorActions.create(new ExpGhostConnection(
				{x: connectorPositionX, y: connectorPositionY},
				{parentNodeId},
				sourceOrTarget,
				localClientId,
				GhostConnectorAddingOrMoving.Moving,
				sourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
					? sourcePort
					: targetPort,
				type,
				id,
			)))
		}

		const onDelete = useCallback(() => {
			dispatch(expConnectionsActions.delete(List([id])))
		}, [dispatch, id])

		const nodeManagerContext = useNodeManagerContext()

		const sourceNodeInfo = nodeManagerContext.getNodeInfo(sourceId)

		const color = sourceNodeInfo
			? sourceNodeInfo.color
			: CssColor.blue

		return (
			<div
				className={`connection type-${type}`}
				style={{color}}
			>
				<ConnectionLine
					id={id}
					color={color}
					saturateSource={false}
					saturateTarget={false}
					pathDPart1={pathDPart1}
					pathDFull={pathDFull}
					connectedLine={connectedLine}
					isSourcePlaying={false}
					highQuality={false}
					onDelete={onDelete}
					z={Math.max(sourceZ, targetZ) - 1}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={sourceConnectorLeft}
					y={sourceY}
					z={sourceZ}
					saturate={false}
					title={longLineTooltip}
					svgProps={{
						onMouseDown: e => e.button === 0 && onMouseDown(
							sourceConnectorLeft,
							sourceY,
							ActiveGhostConnectorSourceOrTarget.Source,
							targetId,
						),
						onContextMenu: (e: React.MouseEvent) => {
							if (e.shiftKey) return
							dispatch(expConnectionsActions.delete(List([id])))
							e.preventDefault()
						},
					}}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={targetConnectorLeft}
					y={targetY}
					z={targetZ}
					saturate={false}
					title={longLineTooltip}
					svgProps={{
						onMouseDown: e => e.button === 0 && onMouseDown(
							targetConnectorLeft,
							targetY,
							ActiveGhostConnectorSourceOrTarget.Target,
							sourceId,
						),
						onContextMenu: (e: React.MouseEvent) => {
							if (e.shiftKey) return
							dispatch(expConnectionsActions.delete(List([id])))
							e.preventDefault()
						},
					}}
				/>
			</div>
		)
	})
