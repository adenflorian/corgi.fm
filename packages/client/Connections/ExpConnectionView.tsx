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
	selectRoomSettings, ExpConnectionType,
} from '@corgifm/common/redux'
import {longLineTooltip} from '../client-constants'
import {useObjectChangedEvent, useStringChangedEvent, useBooleanChangedEvent, useNumberChangedEvent} from '../Experimental/hooks/useCorgiEvent'
import {usePort, useConnection} from '../Experimental/hooks/usePort'
import {ExpPortReact, isAudioOutputPort, ExpPort} from '../Experimental/ExpPorts'
import {ConnectionLine} from './ConnectionLine'
import {Connector} from './Connector'
import {LineState} from './LineState'
import {connectorWidth, connectorHeight, makeStraightPath, makeCurvedPath} from './ConnectionView'
import './ConnectionView.less'
import {ExpNodeConnection} from '../Experimental/ExpConnections'
import {CssColor} from '@corgifm/common/shamu-color'
import {CorgiNumberChangedEvent} from '../Experimental/CorgiEvents'

interface Props {
	id: Id
}

const buffer = 50
const joint = 8

export const ConnectedExpConnectionView = ({id}: Props) => {
	const {sourceId, sourcePort, targetId, targetPort, type} = useSelector(createExpConnectionSelector(id))
	const sourceExpPort = usePort(sourceId, sourcePort)
	const targetExpPort = usePort(targetId, targetPort)
	const connection = useConnection(id)

	if (sourceExpPort && targetExpPort && connection) {
		return (
			<ExpConnectionView
				id={id}
				sourcePort={sourceExpPort}
				targetPort={targetExpPort}
				connection={connection}
				sourceId={sourceId}
				targetId={targetId}
				type={type}
			/>
		)
	} else {
		return null
	}
}

interface ExpConnectionViewPorts extends Props {
	readonly sourcePort: ExpPortReact
	readonly targetPort: ExpPortReact
	readonly connection: ExpNodeConnection
	readonly sourceId: Id
	readonly targetId: Id
	readonly type: ExpConnectionType
}

const constant1 = new CorgiNumberChangedEvent(1)

const ExpConnectionView =
	React.memo(function _ExpConnectionView({
		id, sourcePort, targetPort, sourceId, targetId, type, connection,
	}: ExpConnectionViewPorts) {
		const sourceNodePosition = useSelector(createExpPositionSelector(sourceId))
		const targetNodePosition = useSelector(createExpPositionSelector(targetId))
		
		const voiceCountEvent = isAudioOutputPort(sourcePort)
			? sourcePort.source.voiceCount
			: constant1

		const voiceCount = useNumberChangedEvent(voiceCountEvent)

		const {zIndex: sourceZ} = sourceNodePosition
		const {zIndex: targetZ} = targetNodePosition

		const sourcePortPosition = useObjectChangedEvent(sourcePort.onPositionChanged)

		const sourceX = sourceNodePosition.x + sourceNodePosition.width - sourcePortPosition.x
		const sourceY = sourceNodePosition.y + sourcePortPosition.y

		const targetPortPosition = useObjectChangedEvent(targetPort.onPositionChanged)

		const targetX = targetNodePosition.x + targetPortPosition.x
		const targetY = targetNodePosition.y + targetPortPosition.y

		const isFeedbackLoopDetected = useBooleanChangedEvent(connection.feedbackLoopDetected)

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
			sourceConnectorRight,
			sourceY,
			targetConnectorLeft,
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
					? sourcePort.id
					: targetPort.id,
				sourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
					? targetPort.id
					: sourcePort.id,
				type,
				id,
			)))
		}

		const onDelete = useCallback(() => {
			dispatch(expConnectionsActions.delete(List([id])))
		}, [dispatch, id])

		const sourcePortColor = useStringChangedEvent(sourcePort.onColorChange)

		const color = isFeedbackLoopDetected
			? CssColor.disabledGray
			: sourcePortColor

		const feedbackLoopToolTip = isFeedbackLoopDetected
			? `\nThis connection is disabled because it would have created a feedback loop`
			: ``

		const toolTip = longLineTooltip + feedbackLoopToolTip

		return (
			<div
				className={`connection type-${type} isFeedbackLoopDetected-${isFeedbackLoopDetected} voiceCount-${voiceCount > 1 ? 'poly' : 'mono'}`}
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
					// z={Math.max(sourceZ, targetZ) - 1}
					toolTip={toolTip}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={sourceConnectorLeft}
					y={sourceY}
					// z={sourceZ}
					saturate={false}
					title={toolTip}
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
					// z={targetZ}
					saturate={false}
					title={toolTip}
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
