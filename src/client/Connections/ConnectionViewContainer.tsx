import * as React from 'react'
import {connect} from 'react-redux'
import {Point} from '../../common/common-types'
import {IClientAppState} from '../../common/redux'
import {
	GhostConnectorRecord, selectAllConnections,
	selectConnection, selectConnectionSourceColor,
	selectConnectionSourceIsActive, selectConnectionSourceIsSending,
} from '../../common/redux'
import {getMainBoardsRectX, getMainBoardsRectY} from '../utils'
import {ConnectedConnectionView} from './ConnectionView'

export interface IConnectionViewContainerProps {
	id: string
}

export interface IConnectionViewContainerReduxProps {
	connections: any
	sourceId?: string
	targetId?: string
	sourceColor: string
	isSourceActive: boolean
	isSourceSending: boolean
	ghostConnector: GhostConnectorRecord
}

export type IConnectionViewContainerAllProps = IConnectionViewContainerProps & IConnectionViewContainerReduxProps

type AnyRect = ClientRect | DOMRect | any

export interface Positions {
	sourcePosition?: Point,
	targetPosition?: Point,
}

interface ICVCState {
	positions: Positions
	oldPositions: Positions
}

export class ConnectionViewContainer extends React.PureComponent<IConnectionViewContainerAllProps, ICVCState> {
	public static defaultProps = {
		sourceColor: 'gray',
	}

	public state: ICVCState = {positions: {}, oldPositions: {}}

	constructor(props: IConnectionViewContainerAllProps) {
		super(props)
		setTimeout(() => {
			this.componentDidUpdate()
		}, 500)
	}

	public componentDidUpdate() {
		this._updatePositions()
	}

	public render() {
		const {positions: {sourcePosition, targetPosition}} = this.state

		if (sourcePosition === undefined || targetPosition === undefined) {
			return null
		} else {
			return (
				<ConnectedConnectionView
					color={this.props.sourceColor}
					sourceX={sourcePosition.x}
					sourceY={sourcePosition.y}
					targetX={targetPosition.x}
					targetY={targetPosition.y}
					saturateSource={this.props.isSourceActive || this.props.isSourceSending}
					saturateTarget={this.props.isSourceSending}
					id={this.props.id}
				/>
			)
		}
	}

	private readonly _updatePositions = () => {
		if (this.props.sourceId === undefined) return
		const sourceElement = document.getElementById(this.props.sourceId)
		if (!sourceElement) return

		if (this.props.targetId === undefined) return
		const targetElement = document.getElementById(this.props.targetId)
		if (!targetElement) return

		const sourceBox: AnyRect = sourceElement.getBoundingClientRect()

		const targetBox: AnyRect = targetElement.getBoundingClientRect()

		const newPositions = {
			sourcePosition: {
				x: sourceBox.x + sourceBox.width - getMainBoardsRectX(),
				y: sourceBox.y + (sourceBox.height / 2) - getMainBoardsRectY(),
			},
			targetPosition: {
				x: targetBox.x - getMainBoardsRectX(),
				y: targetBox.y + (targetBox.height / 2) - getMainBoardsRectY(),
			},
		}

		if (JSON.stringify(newPositions) !== JSON.stringify(this.state.oldPositions)) {
			this.setState({
				positions: newPositions,
				oldPositions: this.state.positions,
			})
		}
	}
}

export const mapStateToProps =
	(state: IClientAppState, props: IConnectionViewContainerProps): IConnectionViewContainerReduxProps => {
		const connection = selectConnection(state.room, props.id)
		const sourceColor = selectConnectionSourceColor(state.room, connection.id)
		const isSourceActive = selectConnectionSourceIsActive(state.room, connection.id)
		const isSourceSending = selectConnectionSourceIsSending(state.room, connection.id)

		return {
			sourceId: connection.sourceId,
			targetId: connection.targetId,
			sourceColor,
			isSourceActive,
			isSourceSending,
			ghostConnector: connection.ghostConnector,
			// Forces update when connections change
			connections: selectAllConnections(state.room),
		}
	}

export const ConnectedConnectionViewContainer = connect(mapStateToProps)(ConnectionViewContainer)
