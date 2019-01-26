import * as React from 'react'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {Dispatch} from 'redux'
import {
	defaultGhostConnector, deleteConnections, GhostConnectorRecord, GhostConnectorStatus, updateGhostConnector,
} from '../../common/redux/connections-redux'
import {shamuConnect} from '../../common/redux/redux-utils'
import {
	saturateColor,
} from '../../common/shamu-color'
import './ConnectionView.less'

export interface IConnectionViewProps {
	color: string
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	ghostConnector?: GhostConnectorRecord
	connectorWidth: number
	connectorHeight: number
	saturateSource: boolean
	saturateTarget: boolean
	id: string
}

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
const connectorStrokeWidth = 8

export class ConnectionView extends React.PureComponent<IConnectionViewProps & {dispatch: Dispatch}> {
	public static defaultProps = {
		connectorWidth: 16,
		connectorHeight: 8,
	}

	public render() {
		const {color, saturateSource, saturateTarget, id, ghostConnector = defaultGhostConnector} = this.props

		const line = new LineState(
			this.props.sourceX + this.props.connectorWidth,
			this.props.sourceY,
			this.props.targetX - this.props.connectorWidth,
			this.props.targetY,
		)

		const lineGhost = new LineState(
			ghostConnector.x + this.props.connectorWidth,
			ghostConnector.y,
			this.props.targetX - this.props.connectorWidth,
			this.props.targetY,
		)

		const buffer = 50
		const joint = 8

		const pathDPart1 = `
			M ${line.x1} ${line.y1}
			L ${line.x1 + joint} ${line.y1}
			L ${line.x2 - joint} ${line.y2}
			L ${line.x2} ${line.y2}
		`

		const pathDPart1Ghost = `
			M ${lineGhost.x1} ${lineGhost.y1}
			L ${lineGhost.x1 + joint} ${lineGhost.y1}
			L ${lineGhost.x2 - joint} ${lineGhost.y2}
			L ${lineGhost.x2} ${lineGhost.y2}
		`

		// This path is a hack to get the filter to work properly
		// It forces the "render box?" to be bigger than the actual drawn path
		const pathDPart2 = `M ${line.x1 + buffer} ${line.y1 + buffer} M ${line.x2 + buffer} ${line.y2 + buffer}`
			+ `M ${line.x1 - buffer} ${line.y1 - buffer} M ${line.x2 - buffer} ${line.y2 - buffer}`

		const pathDFull = pathDPart1 + ' ' + pathDPart2

		const isGhostSourceActive = ghostConnector.status === GhostConnectorStatus.activeSource
		const isGhostTargetActive = ghostConnector.status === GhostConnectorStatus.activeTarget
		const isGhostHidden = ghostConnector.status === GhostConnectorStatus.hidden

		return (
			<div className="connection">
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
							x1={(line.x1)}
							y1={(line.y1)}
							x2={(line.x2)}
							y2={(line.y2)}
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
							this.props.dispatch(deleteConnections([id]))
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
						// strokeLinecap="round"
						/>
						<path
							className="blurLine"
							d={pathDFull}
							stroke={`url(#${id})`}
							strokeWidth={4 + 'px'}
						/>
					</g>

				</svg>
				<svg
					className={`colorize connector source ${saturateSource ? 'saturate' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: this.props.connectorWidth,
						height: this.props.connectorHeight,
						top: this.props.sourceY - (this.props.connectorHeight / 2),
						left: this.props.sourceX,
					}}
				>
					<line
						x1={0}
						y1={this.props.connectorHeight / 2}
						x2={this.props.connectorWidth}
						y2={this.props.connectorHeight / 2}
						stroke={color}
						strokeWidth={connectorStrokeWidth}
					/>
				</svg>
				<svg
					className={`colorize connector target ${saturateTarget ? 'saturate' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: this.props.connectorWidth,
						height: this.props.connectorHeight,
						top: this.props.targetY - (this.props.connectorHeight / 2),
						left: this.props.targetX - this.props.connectorWidth,
					}}
				>
					<line
						x1={0}
						y1={this.props.connectorHeight / 2}
						x2={this.props.connectorWidth}
						y2={this.props.connectorHeight / 2}
						stroke={color}
						strokeWidth={connectorStrokeWidth}
					/>
				</svg>
				<div className={`ghost ${isGhostHidden ? 'hidden' : 'active'}`}>
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
									d={pathDPart1Ghost}
									// stroke={`gray`}
									strokeWidth={longLineStrokeWidth + 'px'}
									strokeDasharray={4}
								/>
							</g>
						</svg>
					}
					<Draggable
						onStart={this._handleStartDrag}
						onStop={this._handleStopDrag}
						onDrag={this._handleDrag}
						position={isGhostSourceActive
							? {
								x: ghostConnector.x,
								y: ghostConnector.y - (this.props.connectorHeight / 2),
							}
							: {
								x: this.props.sourceX,
								y: this.props.sourceY - (this.props.connectorHeight / 2),
							}
						}
					>
						<svg
							className={`colorize connector source`}
							xmlns="http://www.w3.org/2000/svg"
							style={{
								width: this.props.connectorWidth,
								height: this.props.connectorHeight,
								// top: this.props.sourceY - (this.props.connectorHeight / 2),
								// left: this.props.sourceX,
							}}
						>
							<line
								x1={0}
								y1={this.props.connectorHeight / 2}
								x2={this.props.connectorWidth}
								y2={this.props.connectorHeight / 2}
								// stroke="gray"
								strokeWidth={connectorStrokeWidth}
								strokeDasharray={4}
							/>
						</svg>
					</Draggable>
					<svg
						className={`colorize connector target`}
						xmlns="http://www.w3.org/2000/svg"
						style={{
							width: this.props.connectorWidth,
							height: this.props.connectorHeight,
							top: this.props.targetY - (this.props.connectorHeight / 2),
							left: this.props.targetX - this.props.connectorWidth,
						}}
					>
						<line
							x1={0}
							y1={this.props.connectorHeight / 2}
							x2={this.props.connectorWidth}
							y2={this.props.connectorHeight / 2}
							// stroke="gray"
							strokeWidth={connectorStrokeWidth}
						/>
					</svg>
				</div>
			</div>
		)
	}

	private readonly _handleDrag: DraggableEventHandler = (_, data) => {
		this.props.dispatch(updateGhostConnector(this.props.id, {x: data.x, y: data.y + (this.props.connectorHeight / 2)}))
	}

	private readonly _handleStartDrag: DraggableEventHandler = (_, data) => {
		this.props.dispatch(updateGhostConnector(this.props.id, {
			status: GhostConnectorStatus.activeSource,
			x: this.props.sourceX,
			y: this.props.sourceY,
		}))
	}

	private readonly _handleStopDrag: DraggableEventHandler = (_, __) => {
		this.props.dispatch(updateGhostConnector(this.props.id, {
			status: GhostConnectorStatus.hidden,
			x: this.props.sourceX,
			y: this.props.sourceY,
		}))
	}
}

export const ConnectedConnectionView = shamuConnect()(ConnectionView)
