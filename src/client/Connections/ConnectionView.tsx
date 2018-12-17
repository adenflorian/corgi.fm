import * as React from 'react'
import {colorFunc} from '../../common/shamu-color'
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
}

export class ConnectionView extends React.PureComponent<IConnectionViewProps> {
	public static defaultProps = {
		connectorWidth: 16,
		connectorHeight: 8,
	}

	public render() {
		const color = this.props.color
		const darkerColor = colorFunc(color).darken(0.6).hsl().string()
		const strokeWidth = '2px'
		const strokeWidth2 = '8px'

		return (
			<React.Fragment>
				<svg className="connection longLine" xmlns="http://www.w3.org/2000/svg">
					<line
						x1={this.props.sourceX + this.props.connectorWidth}
						y1={this.props.sourceY}
						x2={this.props.targetX}
						y2={this.props.targetY}
						stroke={darkerColor}
						strokeWidth={strokeWidth}
					/>
				</svg>
				<svg
					className="connection connector source"
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
					className="connection connector target"
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
			</React.Fragment>
		)
	}
}
