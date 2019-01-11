import * as React from 'react'
import {colorFunc, saturateColor} from '../../common/shamu-color'
import './ConnectionView.less'

export interface Point {
	x: number
	y: number
}

export interface IConnectionViewProps {
	color: string
	sourceX: number
	sourceY: number
	targetX: number
	targetY: number
	connectorWidth: number
	connectorHeight: number
	saturateSource: boolean
	saturateTarget: boolean
	id: string
}

export class ConnectionView extends React.PureComponent<IConnectionViewProps> {
	public static defaultProps = {
		connectorWidth: 16,
		connectorHeight: 8,
	}

	public render() {
		const {color, saturateSource, saturateTarget, id} = this.props

		const darkerColor = colorFunc(color).darken(0.6).hsl().string()
		const strokeWidth = '2px'
		const strokeWidth2 = '8px'

		return (
			<div>
				<svg className={`connection colorize longLine`} xmlns="http://www.w3.org/2000/svg">
					<defs>
						<linearGradient
							id={id}
							x1={this.props.sourceX + this.props.connectorWidth}
							y1={this.props.sourceY}
							x2={this.props.targetX}
							y2={this.props.targetY}
							gradientUnits="userSpaceOnUse"
						>
							<stop stop-color={saturateSource ? saturateColor(darkerColor) : darkerColor} offset="0" />
							<stop stop-color={saturateTarget ? saturateColor(darkerColor) : darkerColor} offset="1" />
						</linearGradient>
					</defs>
					<line
						x1={this.props.sourceX + this.props.connectorWidth}
						y1={this.props.sourceY}
						x2={this.props.targetX}
						y2={this.props.targetY}
						// stroke={darkerColor}
						stroke={`url(#${id})`}
						strokeWidth={strokeWidth}
					/>
				</svg>
				<svg
					className={`connection colorize connector source ${saturateSource ? 'saturate' : ''}`}
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
						strokeWidth={strokeWidth2}
					/>
				</svg>
				<svg
					className={`connection colorize connector target ${saturateTarget ? 'saturate' : ''}`}
					xmlns="http://www.w3.org/2000/svg"
					style={{
						width: this.props.connectorWidth,
						height: this.props.connectorHeight,
						top: this.props.targetY - (this.props.connectorHeight / 2),
						left: this.props.targetX,
					}}
				>
					<line
						x1={0}
						y1={this.props.connectorHeight / 2}
						x2={this.props.connectorWidth}
						y2={this.props.connectorHeight / 2}
						stroke={color}
						strokeWidth={strokeWidth2}
					/>
				</svg>
			</div>
		)
	}
}
