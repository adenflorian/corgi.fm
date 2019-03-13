import {List} from 'immutable'
import * as React from 'react'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {Dispatch} from 'redux'
import {
	connectionsActions, GhostConnectorRecord, GhostConnectorStatus,
	GhostConnectorType, IClientAppState, selectUserInputKeys, shamuConnect,
} from '../../common/redux'
import {saturateColor} from '../../common/shamu-color'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import './ConnectionView.less'
import {Connector} from './Connector'

export interface IConnectionViewProps {
	color: string
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	ghostConnector: GhostConnectorRecord
	saturateSource: boolean
	saturateTarget: boolean
	id: string
	sourceStackOrder?: number
	targetStackOrder?: number
}

interface IConnectionViewReduxProps {
	isAddMode: boolean
}

type IConnectionViewAllProps = IConnectionViewProps & IConnectionViewReduxProps & {dispatch: Dispatch}

class LineState {
	constructor(
		public readonly x1: number,
		public readonly y1: number,
		public readonly x2: number,
		public readonly y2: number,
	) {}

	public readonly width = () => Math.abs(this.x1 - this.x2)
	public readonly height = () => Math.abs(this.y1 - this.y2)
	public readonly leftMost = () => Math.min(this.x1, this.x2)
	public readonly topMost = () => Math.min(this.y1, this.y2)
}

const longLineStrokeWidth = 2
const connectorWidth = 16
const connectorHeight = 8

const line0 = new LineState(0, 0, 0, 0)

const buffer = 50
const joint = 8

export class ConnectionView extends React.PureComponent<IConnectionViewAllProps> {
	public render() {
		const {color, saturateSource, saturateTarget, id, sourceX, sourceY, targetX, targetY,
			ghostConnector, targetStackOrder = 0, sourceStackOrder = 0} = this.props

		const sourceConnectorLeft = sourceX + (connectorWidth * sourceStackOrder)
		const sourceConnectorRight = sourceX + connectorWidth + (connectorWidth * sourceStackOrder)
		const targetConnectorLeft = targetX - connectorWidth - (connectorWidth * targetStackOrder)
		const targetConnectorRight = targetX - (connectorWidth * targetStackOrder)

		const connectedLine = new LineState(
			sourceConnectorRight,
			sourceY,
			targetConnectorLeft,
			targetY,
		)

		const ghostLine = this._getGhostLine(sourceConnectorRight, targetConnectorLeft)

		const pathDPart1 = this._makeCurvedPath(connectedLine)

		const pathDPart1Ghost = this._makeCurvedPath(ghostLine)

		// function makeStraightPath(line: LineState) {
		// 	return `
		// 		M ${line.x1} ${line.y1}
		// 		L ${line.x1 + joint} ${line.y1}
		// 		L ${line.x2 - joint} ${line.y2}
		// 		L ${line.x2} ${line.y2}
		// 	`
		// }

		// This path is a hack to get the filter to work properly
		// It forces the "render box?" to be bigger than the actual drawn path
		const pathDPart2 = `M ${connectedLine.x1 + buffer} ${connectedLine.y1 + buffer} M ${connectedLine.x2 + buffer} ${connectedLine.y2 + buffer}`
			+ `M ${connectedLine.x1 - buffer} ${connectedLine.y1 - buffer} M ${connectedLine.x2 - buffer} ${connectedLine.y2 - buffer}`

		const pathDFull = pathDPart1 + ' ' + pathDPart2

		const isGhostHidden = ghostConnector.status === GhostConnectorStatus.hidden

		return (
			<div className="connection">
				<ConnectionLine
					id={id}
					color={color}
					saturateSource={saturateSource}
					saturateTarget={saturateTarget}
					dispatch={this.props.dispatch}
					pathDPart1={pathDPart1}
					pathDFull={pathDFull}
					connectedLine={connectedLine}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={sourceConnectorLeft}
					y={sourceY}
					color={color}
					saturate={saturateSource}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={targetConnectorLeft}
					y={targetY}
					color={color}
					saturate={saturateTarget}
				/>
				<div className={`ghost ${ghostConnector.status === GhostConnectorStatus.hidden ? 'hidden' : 'active'}`}>
					{!isGhostHidden &&
						<svg
							className={`colorize longLine`}
							xmlns="http://www.w3.org/2000/svg"
							style={{
								position: 'fixed',
								pointerEvents: 'none',
								color,
								fill: 'none',
							}}
						>
							<g>
								<path
									className="ghostPath"
									d={pathDPart1Ghost}
									strokeWidth={longLineStrokeWidth + 'px'}
									strokeDasharray={4}
									stroke={color}
								/>
							</g>
						</svg>
					}
					{this.props.isAddMode === false &&
						<React.Fragment>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeSource}
								ghostConnector={ghostConnector}
								parentX={sourceConnectorLeft}
								parentY={sourceY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeSource}
								movingOrAdding={GhostConnectorType.moving}
								color={ghostConnector.status === GhostConnectorStatus.activeTarget ? '#0000' : color}
								saturate={saturateSource}
							/>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeTarget}
								ghostConnector={ghostConnector}
								parentX={targetConnectorLeft}
								parentY={targetY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeTarget}
								movingOrAdding={GhostConnectorType.moving}
								color={ghostConnector.status === GhostConnectorStatus.activeSource ? '#0000' : color}
								saturate={saturateTarget}
							/>
						</React.Fragment>
					}
					{this.props.isAddMode === true &&
						<React.Fragment>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeTarget}
								ghostConnector={ghostConnector}
								parentX={sourceConnectorLeft}
								parentY={sourceY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeTarget}
								movingOrAdding={GhostConnectorType.adding}
								color={color}
								saturate={saturateSource}
							/>
							<GhostConnector
								dispatch={this.props.dispatch}
								isActive={ghostConnector.status === GhostConnectorStatus.activeSource}
								ghostConnector={ghostConnector}
								parentX={targetConnectorLeft}
								parentY={targetY}
								connectionId={id}
								sourceOrTarget={GhostConnectorStatus.activeSource}
								movingOrAdding={GhostConnectorType.adding}
								color={color}
								saturate={saturateTarget}
							/>
						</React.Fragment>
					}
				</div>
			</div>
		)
	}

	private readonly _makeCurvedPath = (line: LineState) => {
		const diff2 = Math.abs((line.x2 - line.x1) / 2)

		const curveStrength2 = Math.max(10, diff2)

		return `
				M ${line.x1} ${line.y1}
				C ${line.x1 + joint + curveStrength2} ${line.y1} ${line.x2 - joint - curveStrength2} ${line.y2} ${line.x2} ${line.y2}
			`
	}

	private readonly _getGhostLine = (sourceConnectorRight: number, targetConnectorLeft: number) => {
		switch (this.props.ghostConnector.status) {
			case GhostConnectorStatus.activeSource:
				return new LineState(
					this.props.ghostConnector.x + connectorWidth,
					this.props.ghostConnector.y,
					targetConnectorLeft,
					this.props.targetY,
				)
			case GhostConnectorStatus.activeTarget:
				return new LineState(
					sourceConnectorRight,
					this.props.sourceY,
					this.props.ghostConnector.x,
					this.props.ghostConnector.y,
				)
			default:
				return line0
		}
	}
}

interface ConnectionLineProps {
	id: string
	color: string
	saturateSource: boolean
	saturateTarget: boolean
	dispatch: Dispatch
	pathDPart1: string
	pathDFull: string
	connectedLine: LineState
}

const ConnectionLine = React.memo(
	({id, color, saturateSource, saturateTarget, pathDPart1,
		pathDFull, dispatch, connectedLine}: ConnectionLineProps,
	) => {
		return (
			<svg
				className={`colorize longLine`}
				xmlns="http://www.w3.org/2000/svg"
				style={{
					position: 'fixed',
					pointerEvents: 'none',
					color,
					fill: 'none',
				}}
			>
				<defs>
					<linearGradient
						id={id}
						x1={(connectedLine.x1)}
						y1={(connectedLine.y1)}
						x2={(connectedLine.x2)}
						y2={(connectedLine.y2)}
						gradientUnits="userSpaceOnUse"
					// gradientUnits="objectBoundingBox"
					>
						<stop stopColor={saturateSource ? saturateColor(color) : color} offset="0%" />
						<stop stopColor={saturateTarget ? saturateColor(color) : color} offset="100%" />
					</linearGradient>
					<filter id="saturate">
						<feColorMatrix in="SourceGraphic"
							type="saturate"
							values="3" />
					</filter>
				</defs>
				<g
					onContextMenu={(e: React.MouseEvent) => {
						dispatch(connectionsActions.delete(List([id])))
						e.preventDefault()
					}}
				>
					<path
						d={pathDPart1}
						stroke={`url(#${id})`}
						strokeWidth={longLineStrokeWidth + 'px'}
					/>
					<path
						className="invisibleLongLine"
						d={pathDPart1}
						stroke="#0000"
						strokeWidth={24 + 'px'}
					/>
					<path
						className="blurLine"
						d={pathDFull}
						stroke={`url(#${id})`}
						strokeWidth={4 + 'px'}
					/>
				</g>
			</svg>
		)
	},
)

interface IGhostConnectorProps {
	dispatch: Dispatch
	isActive: boolean
	ghostConnector: GhostConnectorRecord
	parentX: number
	parentY: number
	connectionId: string
	sourceOrTarget: GhostConnectorStatus
	movingOrAdding: GhostConnectorType
	color: string
	saturate: boolean
}

class GhostConnector extends React.PureComponent<IGhostConnectorProps> {
	public render() {
		const {isActive, ghostConnector,
			parentX, parentY, color, saturate} = this.props

		return (
			<Draggable
				scale={simpleGlobalClientState.zoom}
				onStart={this._handleStartDrag}
				onStop={this._handleStopDrag}
				onDrag={this._handleDrag}
				position={isActive
					? {
						x: ghostConnector.x,
						y: ghostConnector.y,
					}
					: {
						x: parentX,
						y: parentY,
					}
				}
			>
				<div>
					<Connector
						width={connectorWidth}
						height={connectorHeight}
						color={color}
						saturate={saturate}
					/>
				</div>
			</Draggable>
		)
	}

	private readonly _handleDrag: DraggableEventHandler = (_, data) => {
		this.props.dispatch(connectionsActions.moveGhostConnector(
			this.props.connectionId,
			data.x,
			data.y,
		))
	}

	private readonly _handleStartDrag: DraggableEventHandler = (_, __) => {
		this.props.dispatch(connectionsActions.updateGhostConnector(
			this.props.connectionId, {
				addingOrMoving: this.props.movingOrAdding,
				status: this.props.sourceOrTarget,
				x: this.props.parentX,
				y: this.props.parentY,
			}))
	}

	private readonly _handleStopDrag: DraggableEventHandler = (_, __) => {
		this.props.dispatch(connectionsActions.stopDraggingGhostConnector(
			this.props.connectionId))
	}
}

export const ConnectedConnectionView = shamuConnect(
	(state: IClientAppState): IConnectionViewReduxProps => ({
		isAddMode: selectUserInputKeys(state).ctrl,
	}),
)(ConnectionView)
