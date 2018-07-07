import * as React from 'react'
import {connect} from 'react-redux'
import {IAppState} from '../../common/redux/configureStore'
import {
	getConnectionSourceColor, IConnection, selectConnection,
} from '../../common/redux/connections-redux'
import {ConnectionView, Point} from './ConnectionView'

export interface IConnectionViewContainerProps {
	id: string
	sourceId?: string
	targetId?: string
	sourceColor?: string
	offset?: number
}

type AnyRect = ClientRect | DOMRect | any

interface Positions {
	sourcePosition?: Point,
	targetPosition?: Point,
}

interface ICVCState {
	positions: Positions
	oldPositions: Positions
}

export class ConnectionViewContainer extends React.Component<IConnectionViewContainerProps, ICVCState> {
	public state: ICVCState = {positions: {}, oldPositions: {}}

	constructor(props) {
		super(props)
		window.addEventListener('resize', this._foo)
		window.addEventListener('scroll', this._foo)
		setTimeout(() => {
			this.componentDidUpdate()
		}, 500)
	}

	public componentDidUpdate() {
		this._foo()
	}

	public componentWillUnmount() {
		window.removeEventListener('resize', this._foo)
		window.removeEventListener('scroll', this._foo)
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
				/>
			)
		}
	}

	private _foo = () => {
		const sourceElement = document.getElementById(this.props.sourceId)
		if (!sourceElement) return
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

const mapState = (state: IAppState, props: IConnectionViewContainerProps) => {
	const connection = selectConnection(state, props.id) || {} as IConnection
	const sourceColor = connection && getConnectionSourceColor(state, connection.id)
	return {
		sourceId: connection.sourceId,
		targetId: connection.targetId,
		sourceColor,
		offset: 16,
	}
}

export const ConnectedConnectionViewContainer = connect(mapState, null, null, {pure: false})(ConnectionViewContainer)
