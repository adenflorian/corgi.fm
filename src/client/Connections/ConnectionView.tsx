import {List} from 'immutable'
import * as React from 'react'
import {Dispatch} from 'redux'
import {
	AppOptions, connectionsActions,
	IClientAppState,
	selectOption, selectUserInputKeys, shamuConnect, getConnectionNodeInfo,
	selectConnectionStackOrderForSource, selectConnectionStackOrderForTarget,
	selectConnection, selectConnectionSourceIsSending,
	selectConnectionSourceIsActive, selectPosition, selectConnectionSourceColor,
} from '../../common/redux'
import {saturateColor} from '../../common/shamu-color'
import './ConnectionView.less'
import {Connector} from './Connector'
import {stripIndent} from 'common-tags';

export interface IConnectionViewProps {
	id: string
}

interface IConnectionViewReduxProps {
	isAddMode: boolean
	speed?: number
	highQuality: boolean
	color: string
	isSourcePlaying: boolean
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	saturateSource: boolean
	saturateTarget: boolean
	sourceStackOrder?: number
	targetStackOrder?: number
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
			targetStackOrder = 0, sourceStackOrder = 0, speed = 1,
			isSourcePlaying, highQuality} = this.props

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

		const pathDPart1 = this._makeCurvedPath(connectedLine)

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

		return (
			<div className={`connection ${saturateSource ? 'playing' : ''}`}>
				<ConnectionLine
					id={id}
					color={color}
					saturateSource={saturateSource}
					saturateTarget={saturateTarget}
					dispatch={this.props.dispatch}
					pathDPart1={pathDPart1}
					pathDFull={pathDFull}
					connectedLine={connectedLine}
					speed={speed}
					isSourcePlaying={isSourcePlaying}
					highQuality={highQuality}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={sourceConnectorLeft}
					y={sourceY}
					color={color}
					saturate={highQuality ? (saturateSource || isSourcePlaying) : isSourcePlaying}
				/>
				<Connector
					width={connectorWidth}
					height={connectorHeight}
					x={targetConnectorLeft}
					y={targetY}
					color={color}
					saturate={highQuality ? (saturateTarget || isSourcePlaying) : isSourcePlaying}
				/>
			</div>
		)
	}

	private readonly _makeCurvedPath = (line: LineState) => {
		const diff2 = Math.abs((line.x2 - line.x1) / 2)

		const curveStrength2 = Math.max(10, diff2)

		return stripIndent`
			M ${line.x1} ${line.y1}
			C ${line.x1 + joint + curveStrength2} ${line.y1} ${line.x2 - joint - curveStrength2} ${line.y2} ${line.x2} ${line.y2}
		`
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
	speed?: number
	isSourcePlaying: boolean
	highQuality: boolean
}

const longLineTooltip = 'right click to delete'

const ConnectionLine = React.memo(
	function _ConnectionLine({id, color, saturateSource, saturateTarget, pathDPart1,
		pathDFull, dispatch, connectedLine, speed = 1,
		isSourcePlaying, highQuality}: ConnectionLineProps,
	) {
		const saturatedColor = saturateColor(color)

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
					{highQuality &&
						<linearGradient
							id={id}
							x1={(connectedLine.x1)}
							y1={(connectedLine.y1)}
							x2={(connectedLine.x2)}
							y2={(connectedLine.y2)}
							gradientUnits="userSpaceOnUse"
						// gradientUnits="objectBoundingBox"
						>
							<stop stopColor={(saturateSource || isSourcePlaying) ? saturatedColor : color} offset="0%" />
							<stop stopColor={(saturateTarget || isSourcePlaying) ? saturatedColor : color} offset="100%" />
						</linearGradient>
					}
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
						className="mainLongLine"
						d={pathDPart1}
						stroke={highQuality ? `url(#${id})` : isSourcePlaying ? saturatedColor : color}
						strokeWidth={longLineStrokeWidth + 'px'}
					>
					</path>
					<path
						className="invisibleLongLine"
						d={pathDPart1}
						stroke="#0000"
						strokeWidth={24 + 'px'}
					>
						<title>{longLineTooltip}</title>
					</path>
					<path
						className="blurLine"
						d={pathDFull}
						stroke={highQuality ? `url(#${id})` : isSourcePlaying ? saturatedColor : color}
						strokeWidth={4 + 'px'}
					>
						<title>{longLineTooltip}</title>
					</path>
					{highQuality && isSourcePlaying &&
						<path
							style={{
								animationDuration: (3600 / speed) + 's',
							}}
							className="animatedLongLine"
							d={pathDPart1}
							stroke={saturatedColor}
							strokeWidth={longLineStrokeWidth * 2 + 'px'}
							strokeDasharray="4 8"
						/>
					}
				</g>
			</svg>
		)
	},
)

export const ConnectedConnectionView = shamuConnect(
	(state: IClientAppState, props: IConnectionViewProps): IConnectionViewReduxProps => {
		// const globalClockState = selectGlobalClockState(state.room)
		const connection = selectConnection(state.room, props.id)
		const isSourceSending = selectConnectionSourceIsSending(state.room, connection.id)
		const isSourceActive = isSourceSending || selectConnectionSourceIsActive(state.room, connection.id)
		const sourcePosition = selectPosition(state.room, connection.sourceId)
		const targetPosition = selectPosition(state.room, connection.targetId)
		const sourceColor = selectConnectionSourceColor(state.room, props.id)

		return {
			isAddMode: selectUserInputKeys(state).shift,
			speed: 120,
			// Disabled for now because of performance issues
			// speed: globalClockState.bpm,
			highQuality: selectOption(state, AppOptions.graphics_fancyConnections) as boolean,
			isSourcePlaying: getConnectionNodeInfo(connection.sourceType)
				.selectIsPlaying(state.room, connection.sourceId),
			sourceStackOrder: selectConnectionStackOrderForSource(state.room, props.id),
			targetStackOrder: selectConnectionStackOrderForTarget(state.room, props.id),
			color: sourceColor,
			sourceX: sourcePosition.x + sourcePosition.width,
			sourceY: sourcePosition.y + (sourcePosition.height / 2),
			targetX: targetPosition.x,
			targetY: targetPosition.y + (targetPosition.height / 2),
			saturateSource: isSourceActive || isSourceSending,
			saturateTarget: isSourceSending,
		}
	},
)(ConnectionView)
