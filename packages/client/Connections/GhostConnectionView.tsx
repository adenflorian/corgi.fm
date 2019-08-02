import React, {PureComponent} from 'react'
import {Dispatch} from 'redux'
import {
	ActiveGhostConnectorSourceOrTarget, calculateConnectorPositionY,
	GhostConnection, ghostConnectorActions,
	IPosition,
	selectConnectionsWithSourceIds,
	selectConnectionsWithTargetIds,
	selectGhostConnection,
	selectLocalClientId,
	selectPosition,
	shamuConnect,
} from '@corgifm/common/redux'
import {toGraphSpace} from '../SimpleGraph/Zoom'
import {connectorHeight, connectorWidth, makeCurvedPath} from './ConnectionView'
import {Connector} from './Connector'
import {GhostConnectionLine} from './GhostConnectionLine'
import {LineState} from './LineState'

interface Props {
	id: Id
}

interface ReduxProps {
	ghostConnection: GhostConnection
	parentPosition: IPosition
	parentConnectionCount: number
	localClientId: Id
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

interface State {
	mousePosition: Point
}

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
		const {ghostConnection: {activeConnector, activeSourceOrTarget, port}, parentPosition, parentConnectionCount} = this.props

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

		const anchorConnectorPosition: Point =
			activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
				? {
					x: parentPosition.x - (parentConnectionCount * connectorWidth) - connectorWidth,
					y: calculateConnectorPositionY(parentPosition.y, parentPosition.height, parentPosition.inputPortCount, port),
				}
				: {
					x: parentPosition.x + parentPosition.width + (parentConnectionCount * connectorWidth) + connectorWidth,
					y: calculateConnectorPositionY(parentPosition.y, parentPosition.height, parentPosition.outputPortCount, port),
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
					? selectConnectionsWithTargetIds(state.room, [parentNodeId]).filter(x => x.targetPort === ghostConnection.port).count()
					: selectConnectionsWithSourceIds(state.room, [parentNodeId]).filter(x => x.sourcePort === ghostConnection.port).count(),
			localClientId: selectLocalClientId(state),
		}
	},
)(GhostConnectionView)
