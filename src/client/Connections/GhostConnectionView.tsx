import React, {PureComponent} from 'react'
import {Dispatch} from 'redux'
import {Point} from '../../common/common-types'
import {
	ActiveGhostConnectorSourceOrTarget, GhostConnection,
	ghostConnectorActions, IPosition,
	selectConnectionsWithSourceIds,
	selectConnectionsWithTargetIds,
	selectGhostConnection,
	selectPosition,
	shamuConnect,
} from '../../common/redux'
import {fromGraphSpace, toGraphSpace} from '../SimpleGraph/Zoom'
import {connectorHeight, connectorWidth, makeCurvedPath} from './ConnectionView'
import {Connector} from './Connector'
import {GhostConnectionLine} from './GhostConnectionLine'
import {LineState} from './LineState'

interface Props {
	id: string
}

interface ReduxProps {
	ghostConnection: GhostConnection
	parentPosition: IPosition
	parentConnectionCount: number
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

interface State {
	mousePosition: Point
}

export class GhostConnectionView extends PureComponent<AllProps, State> {
	constructor(props: AllProps) {
		super(props)
		this.state = {
			mousePosition: props.ghostConnection.activeConnector,
		}
	}

	public componentDidMount() {
		window.addEventListener('mousemove', this._updateMousePosition)
		window.addEventListener('mouseup', this._handleMouseUp)
	}

	public componentWillUnmount() {
		window.removeEventListener('mousemove', this._updateMousePosition)
		window.removeEventListener('mouseup', this._handleMouseUp)
	}

	public render() {
		const {mousePosition} = this.state
		const {ghostConnection: {activeSourceOrTarget}, parentPosition, parentConnectionCount} = this.props

		const position = mousePosition

		const connectedLine =
			activeSourceOrTarget === ActiveGhostConnectorSourceOrTarget.Source
				? new LineState(
					position.x + (connectorWidth / 2),
					position.y,
					parentPosition.x - (parentConnectionCount * connectorWidth) - connectorWidth,
					parentPosition.y + (parentPosition.height / 2),
				)
				: new LineState(
					parentPosition.x + parentPosition.width + (parentConnectionCount * connectorWidth) + connectorWidth,
					parentPosition.y + (parentPosition.height / 2),
					position.x - (connectorWidth / 2),
					position.y,
				)

		const pathDPart1 = makeCurvedPath(connectedLine)

		return (
			<div>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					color={'green'}
					saturate={false}
					x={position.x - (connectorWidth / 2)}
					y={position.y}
				/>
				<GhostConnectionLine
					color={'orange'}
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
					? selectConnectionsWithTargetIds(state.room, [parentNodeId]).count()
					: selectConnectionsWithSourceIds(state.room, [parentNodeId]).count(),
		}
	},
)(GhostConnectionView)
