import {List} from 'immutable'
import * as React from 'react'
import Draggable, {DraggableEventHandler} from 'react-draggable'
import {Dispatch} from 'redux'
import {
	connectionsActions, defaultGhostConnector, GhostConnectorRecord, GhostConnectorStatus,
} from '../../common/redux'
import {shamuConnect} from '../../common/redux'
import {
	saturateColor,
} from '../../common/shamu-color'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'
import './ConnectionView.less'

export interface IConnectionViewProps {
	color: string
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	ghostConnector?: GhostConnectorRecord
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
const connectorWidth = 16
const connectorHeight = 8

const line0 = new LineState(0, 0, 0, 0)

export class ConnectionView extends React.PureComponent<IConnectionViewProps & {dispatch: Dispatch}> {
	public render() {
		const {color, saturateSource, saturateTarget, id, ghostConnector = defaultGhostConnector} = this.props

		const line = new LineState(
			this.props.sourceX + connectorWidth,
			this.props.sourceY,
			this.props.targetX - connectorWidth,
			this.props.targetY,
		)

		const getGhostLine = () => {
			if (ghostConnector.status === GhostConnectorStatus.activeSource) {
				return new LineState(
					ghostConnector.x + connectorWidth,
					ghostConnector.y,
					this.props.targetX - connectorWidth,
					this.props.targetY,
				)
			} else if (ghostConnector.status === GhostConnectorStatus.activeTarget) {
				return new LineState(
					this.props.sourceX + connectorWidth,
					this.props.sourceY,
					ghostConnector.x,
					ghostConnector.y,
				)
			} else {
				return line0
			}
		}

		const buffer = 50
		const joint = 8

		const pathDPart1 = `
			M ${line.x1} ${line.y1}
			L ${line.x1 + joint} ${line.y1}
			L ${line.x2 - joint} ${line.y2}
			L ${line.x2} ${line.y2}
		`

		const ghostLine = getGhostLine()

		const pathDPart1Ghost = `
			M ${ghostLine.x1} ${ghostLine.y1}
			L ${ghostLine.x1 + joint} ${ghostLine.y1}
			L ${ghostLine.x2 - joint} ${ghostLine.y2}
			L ${ghostLine.x2} ${ghostLine.y2}
		`

		// This path is a hack to get the filter to work properly
		// It forces the "render box?" to be bigger than the actual drawn path
		const pathDPart2 = `M ${line.x1 + buffer} ${line.y1 + buffer} M ${line.x2 + buffer} ${line.y2 + buffer}`
			+ `M ${line.x1 - buffer} ${line.y1 - buffer} M ${line.x2 - buffer} ${line.y2 - buffer}`

		const pathDFull = pathDPart1 + ' ' + pathDPart2

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
							this.props.dispatch(connectionsActions.delete(List([id])))
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
				<svg
					className={`colorize connector source ${saturateSource ? 'saturate' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: connectorWidth,
						height: connectorHeight,
						top: this.props.sourceY - (connectorHeight / 2),
						left: this.props.sourceX,
					}}
				>
					<line
						x1={0}
						y1={connectorHeight / 2}
						x2={connectorWidth}
						y2={connectorHeight / 2}
						stroke={color}
						strokeWidth={connectorStrokeWidth}
					/>
				</svg>
				<svg
					className={`colorize connector target ${saturateTarget ? 'saturate' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: connectorWidth,
						height: connectorHeight,
						top: this.props.targetY - (connectorHeight / 2),
						left: this.props.targetX - connectorWidth,
					}}
				>
					<line
						x1={0}
						y1={connectorHeight / 2}
						x2={connectorWidth}
						y2={connectorHeight / 2}
						stroke={color}
						strokeWidth={connectorStrokeWidth}
					/>
				</svg>
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
									d={pathDPart1Ghost}
									// stroke={`gray`}
									strokeWidth={longLineStrokeWidth + 'px'}
									strokeDasharray={4}
								/>
							</g>
						</svg>
					}
					<GhostConnector
						dispatch={this.props.dispatch}
						isActive={ghostConnector.status === GhostConnectorStatus.activeSource}
						ghostConnector={ghostConnector}
						parentX={this.props.sourceX}
						parentY={this.props.sourceY}
						connectionId={id}
						sourceOrTarget={GhostConnectorStatus.activeSource}
					/>
					<GhostConnector
						dispatch={this.props.dispatch}
						isActive={ghostConnector.status === GhostConnectorStatus.activeTarget}
						ghostConnector={ghostConnector}
						parentX={this.props.targetX - connectorWidth}
						parentY={this.props.targetY}
						connectionId={id}
						sourceOrTarget={GhostConnectorStatus.activeTarget}
					/>
				</div>
			</div>
		)
	}
}

interface IGhostConnectorProps {
	dispatch: Dispatch
	isActive: boolean
	ghostConnector: GhostConnectorRecord
	parentX: number
	parentY: number
	connectionId: string
	sourceOrTarget: GhostConnectorStatus
}

class GhostConnector extends React.PureComponent<IGhostConnectorProps> {
	public render() {
		const {isActive, ghostConnector, parentX, parentY} = this.props

		return (
			<Draggable
				scale={simpleGlobalClientState.zoom}
				onStart={this._handleStartDrag}
				onStop={this._handleStopDrag}
				onDrag={this._handleDrag}
				position={isActive
					? {
						x: ghostConnector.x,
						y: ghostConnector.y - (connectorHeight / 2),
					}
					: {
						x: parentX,
						y: parentY - (connectorHeight / 2),
					}
				}
			>
				<div>
					<Connector
						width={connectorWidth}
						height={connectorHeight}
					/>
				</div>
			</Draggable>
		)
	}

	private readonly _handleDrag: DraggableEventHandler = (_, data) => {
		this.props.dispatch(connectionsActions.moveGhostConnector(
			this.props.connectionId,
			data.x,
			data.y + (connectorHeight / 2),
		))
	}

	private readonly _handleStartDrag: DraggableEventHandler = (_, __) => {
		this.props.dispatch(connectionsActions.updateGhostConnector(
			this.props.connectionId, {
				status: this.props.sourceOrTarget,
				x: this.props.parentX,
				y: this.props.parentY,
			}))
	}

	private readonly _handleStopDrag: DraggableEventHandler = (_, __) => {
		this.props.dispatch(connectionsActions.stopDraggingGhostConnector(
			this.props.connectionId, {
				x: this.props.parentX,
				y: this.props.parentY,
			}))
	}
}

function Connector({width, height}: {width: number, height: number}) {
	return (
		<svg
			className={`colorize connector target`}
			xmlns="http://www.w3.org/2000/svg"
			style={{
				width,
				height,
			}}
		>
			<line
				x1={0}
				y1={height / 2}
				x2={width}
				y2={height / 2}
				strokeWidth={connectorStrokeWidth}
			/>
		</svg>
	)
}

export const ConnectedConnectionView = shamuConnect()(ConnectionView)
