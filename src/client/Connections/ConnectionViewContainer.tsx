import * as React from 'react'
import {connect} from 'react-redux'
import {IClientAppState} from '../../common/redux/common-redux-types'
import {
	IConnection, selectConnection, selectConnectionSourceColor,
	selectConnectionSourceIsPlaying, selectConnectionSourceShouldHighlight,
} from '../../common/redux/connections-redux'
import {ConnectionView, Point} from './ConnectionView'

export interface IConnectionViewContainerProps {
	id: string
}

export interface IConnectionViewContainerReduxProps {
	sourceId?: string
	targetId?: string
	sourceColor: string
	offset: number
	isSourcePlaying: boolean
	shouldHighlight: boolean
}

type IConnectionViewContainerAllProps = IConnectionViewContainerProps & IConnectionViewContainerReduxProps

type AnyRect = ClientRect | DOMRect | any

interface Positions {
	sourcePosition?: Point,
	targetPosition?: Point,
}

interface ICVCState {
	positions: Positions
	oldPositions: Positions
}

export class ConnectionViewContainer extends React.Component<IConnectionViewContainerAllProps, ICVCState> {
	public static defaultProps = {
		offset: 0,
		sourceColor: 'gray',
	}

	public state: ICVCState = {positions: {}, oldPositions: {}}

	constructor(props: IConnectionViewContainerAllProps) {
		super(props)
		window.addEventListener('resize', this._updatePositions)
		window.addEventListener('scroll', this._updatePositions)
		setTimeout(() => {
			this.componentDidUpdate()
		}, 500)
	}

	public componentDidUpdate() {
		this._updatePositions()
	}

	public componentWillUnmount() {
		window.removeEventListener('resize', this._updatePositions)
		window.removeEventListener('scroll', this._updatePositions)
	}

	public render() {
		const {positions: {sourcePosition, targetPosition}} = this.state

		if (sourcePosition === undefined || targetPosition === undefined) {
			return null
		} else {
			return (
				<ConnectionView
					color={this.props.sourceColor}
					sourceX={sourcePosition.x}
					sourceY={sourcePosition.y}
					targetX={targetPosition.x}
					targetY={targetPosition.y}
					saturateSource={this.props.isSourcePlaying}
					saturateTarget={this.props.shouldHighlight}
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
				x: sourceBox.x + sourceBox.width,
				y: sourceBox.y + (sourceBox.height / 2),
			},
			targetPosition: {
				x: targetBox.x - this.props.offset,
				y: (targetBox.y + (targetBox.height / 2)),
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

const mapState = (state: IClientAppState, props: IConnectionViewContainerProps): IConnectionViewContainerReduxProps => {
	const connection = selectConnection(state.room, props.id) || {} as IConnection
	const sourceColor = connection && selectConnectionSourceColor(state.room, connection.id)
	const isSourcePlaying = connection && selectConnectionSourceIsPlaying(state.room, connection.id)
	const shouldHighlight = connection && selectConnectionSourceShouldHighlight(state.room, connection.id)
	return {
		sourceId: connection.sourceId,
		targetId: connection.targetId,
		sourceColor,
		offset: 16,
		isSourcePlaying,
		shouldHighlight,
	}
}

export const ConnectedConnectionViewContainer = connect(mapState, null, null, {pure: false})(ConnectionViewContainer)
