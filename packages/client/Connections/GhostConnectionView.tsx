import React, {PureComponent} from 'react'
import {Dispatch} from 'redux'
import {useSelector, useDispatch} from 'react-redux'
import {
	ActiveGhostConnectorSourceOrTarget, calculateConnectorPositionY,
	GhostConnection, ghostConnectorActions,
	IPosition,
	selectGhostConnection,
	selectLocalClientId,
	selectPosition,
	shamuConnect,
	selectConnectionIdsForNodeLeftPort,
	selectConnectionIdsForNodeRightPort,
	selectExpPosition,
	selectExpConnectionIdsForNodeLeftPort,
	selectExpConnectionIdsForNodeRightPort,
	IClientAppState,
	RoomSettings,
} from '@corgifm/common/redux'
import {toGraphSpace} from '../SimpleGraph/Zoom'
import {useNodeManagerContext} from '../Experimental/NodeManager'
import {connectorHeight, connectorWidth, makeCurvedPath} from './ConnectionView'
import {Connector} from './Connector'
import {GhostConnectionLine} from './GhostConnectionLine'
import {LineState} from './LineState'
import {expConnectionConstants, calculateExpDebugConnectorY} from './ExpConnectionView'

interface Props {
	id: Id
}

interface ReduxProps {
	ghostConnection: GhostConnection
	parentPosition: Pick<IPosition, 'x' | 'y' | 'width' | 'height' | 'inputPortCount' | 'outputPortCount'>
	parentConnectionCount: number
	localClientId: Id
	viewMode: RoomSettings['viewMode']
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

interface State {
	mousePosition: Point
}

const {xAdjust} = expConnectionConstants

export class GhostConnectionView extends PureComponent<AllProps, State> {
	public constructor(props: AllProps) {
		super(props)
		this.state = {
			mousePosition: props.ghostConnection.activeConnector,
		}
	}

	public componentDidMount() {
		if (this._isLocallyOwned() !== true) return
		window.addEventListener('mousemove', this._updateMousePosition)
		window.addEventListener('mouseup', this._handleMouseUp)
	}

	public componentWillUnmount() {
		if (this._isLocallyOwned() !== true) return
		window.removeEventListener('mousemove', this._updateMousePosition)
		window.removeEventListener('mouseup', this._handleMouseUp)
	}

	public render() {
		const {mousePosition} = this.state
		const {
			ghostConnection: {activeConnector, activeSourceOrTarget, port},
			parentPosition, parentConnectionCount, viewMode} = this.props

		const position = this._isLocallyOwned()
			? mousePosition
			: activeConnector

		const activeConnectorPosition: Point =
			activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
				? {
					x: position.x + (connectorWidth / 2),
					y: position.y,
				}
				: {
					x: position.x - (connectorWidth / 2),
					y: position.y,
				}

		const xMod = viewMode === 'debug' ? xAdjust : 0

		const anchorConnectorPosition: Point =
			activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
				? {
					x: parentPosition.x - (parentConnectionCount * connectorWidth) - connectorWidth + xMod,
					y: viewMode === 'debug'
						? calculateExpDebugConnectorY(parentPosition.y, port)
						: calculateConnectorPositionY(parentPosition.y, parentPosition.height, parentPosition.inputPortCount, port),
				}
				: {
					x: parentPosition.x + parentPosition.width + (parentConnectionCount * connectorWidth) + connectorWidth - xMod,
					y: viewMode === 'debug'
						? calculateExpDebugConnectorY(parentPosition.y, port)
						: calculateConnectorPositionY(parentPosition.y, parentPosition.height, parentPosition.outputPortCount, port),
				}

		const connectedLine =
			activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
				? new LineState(
					activeConnectorPosition.x,
					activeConnectorPosition.y,
					anchorConnectorPosition.x,
					anchorConnectorPosition.y,
				)
				: new LineState(
					anchorConnectorPosition.x,
					anchorConnectorPosition.y,
					activeConnectorPosition.x,
					activeConnectorPosition.y,
				)

		const pathDPart1 = makeCurvedPath(connectedLine)

		return (
			<div style={{color: 'orange'}}>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					saturate={false}
					x={position.x - (connectorWidth / 2)}
					y={position.y}
					svgProps={{
						style: {
							pointerEvents: 'none',
						},
					}}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					saturate={false}
					x={
						activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
							? anchorConnectorPosition.x
							: anchorConnectorPosition.x - connectorWidth
					}
					y={anchorConnectorPosition.y}
				/>
				<GhostConnectionLine
					color="orange"
					pathDPart1={pathDPart1}
				/>
			</div>
		)
	}

	private readonly _updateMousePosition = (ev: MouseEvent) => {
		this.setState({
			mousePosition: toGraphSpace(
				ev.clientX,
				ev.clientY,
			),
		})

		this.props.dispatch(ghostConnectorActions.move(
			this.props.ghostConnection.id,
			this.state.mousePosition.x,
			this.state.mousePosition.y,
		))
	}

	private readonly _handleMouseUp = (ev: MouseEvent) => {
		this.props.dispatch(ghostConnectorActions.delete(this.props.ghostConnection.id))
	}

	private readonly _isLocallyOwned = () => this.props.ghostConnection.ownerId === this.props.localClientId
}

export const ConnectedGhostConnectionView = shamuConnect(
	(state, {id}: Props): ReduxProps => {
		const ghostConnection = selectGhostConnection(state.room, id)
		const parentNodeId = ghostConnection.inactiveConnector.parentNodeId

		return {
			ghostConnection,
			parentPosition: selectPosition(state.room, parentNodeId),
			parentConnectionCount:
				ghostConnection.activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
					? selectConnectionIdsForNodeLeftPort(state.room, parentNodeId, ghostConnection.port).count()
					: selectConnectionIdsForNodeRightPort(state.room, parentNodeId, ghostConnection.port).count(),
			localClientId: selectLocalClientId(state),
			viewMode: 'normal',
		}
	},
)(GhostConnectionView)

export const ConnectedExpGhostConnectionView = React.memo(function _ConnectedExpGhostConnectionView(props: Props) {
	const viewMode = useSelector((state: IClientAppState) => state.room.roomSettings.viewMode)
	const ghostConnection = useSelector((state: IClientAppState) => selectGhostConnection(state.room, props.id))
	const parentNodeId = ghostConnection.inactiveConnector.parentNodeId
	const dispatch = useDispatch()
	const position = useSelector((state: IClientAppState) => selectExpPosition(state.room, parentNodeId)).toJS()
	const localClientId = useSelector((state: IClientAppState) => selectLocalClientId(state))
	const leftPortConnectionCount = useSelector(
		(state: IClientAppState) => selectExpConnectionIdsForNodeLeftPort(state.room, parentNodeId, ghostConnection.port).count())
	const rightPortConnectionCount = useSelector(
		(state: IClientAppState) => selectExpConnectionIdsForNodeRightPort(state.room, parentNodeId, ghostConnection.port).count())

	const parentConnectionCount =
		ghostConnection.activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
			? leftPortConnectionCount
			: rightPortConnectionCount

	const nodeManagerContext = useNodeManagerContext()

	const nodeInfo = nodeManagerContext.getNodeInfo(parentNodeId)

	const parentPosition = {
		...position,
		inputPortCount: nodeInfo ? nodeInfo.audioInputPortCount : 1,
		outputPortCount: nodeInfo ? nodeInfo.audioOutputPortCount : 1,
	}

	return (
		<GhostConnectionView
			id={props.id}
			dispatch={dispatch}
			ghostConnection={ghostConnection}
			parentPosition={parentPosition}
			parentConnectionCount={parentConnectionCount}
			localClientId={localClientId}
			viewMode={viewMode}
		/>
	)
})
