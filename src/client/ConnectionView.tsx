import * as React from 'react'
import {connect} from 'react-redux'
import {IAppState} from '../common/redux/configureStore'
import {
	getConnectionSourceColor, IConnection, selectConnection,
} from '../common/redux/connections-redux'
import './ConnectionView.less'

export interface IConnectionViewProps {
	id: string
	sourceId?: string
	targetId?: string
	sourceColor?: string
	offset?: number
}

type AnyRect = ClientRect | DOMRect | any

export class ConnectionView extends React.Component<IConnectionViewProps> {
	private connectionLine: any = React.createRef()
	private sourceStubLine: any = React.createRef()
	private targetStubLine: any = React.createRef()

	constructor(props) {
		super(props)
		window.addEventListener('resize', () => this.componentDidUpdate())
		window.addEventListener('scroll', () => this.componentDidUpdate())
		setTimeout(() => {
			this.componentDidUpdate()
		}, 500)
	}

	public componentDidUpdate() {
		const sourceElement = document.getElementById(this.props.sourceId)
		const targetElement = document.getElementById(this.props.targetId)
		// console.log('targetElement: ', targetElement)
		const lineElement = this.connectionLine.current as SVGElement
		const sourceStubLineElement = this.sourceStubLine.current as SVGElement
		const targetStubLineElement = this.targetStubLine.current as SVGElement
		// console.log('lineElement: ', lineElement)
		if (sourceElement) {
			const sourceBox: AnyRect = sourceElement.getBoundingClientRect()
			lineElement.setAttribute('x1', (sourceBox.x - 50 - this.props.offset).toString())
			lineElement.setAttribute('y1', (sourceBox.y + (sourceBox.height / 2)).toString())
			sourceStubLineElement.setAttribute('x1', (sourceBox.x - 50 - this.props.offset).toString())
			sourceStubLineElement.setAttribute('y1', (sourceBox.y + (sourceBox.height / 2)).toString())
			sourceStubLineElement.setAttribute('x2', (sourceBox.x).toString())
			sourceStubLineElement.setAttribute('y2', (sourceBox.y + (sourceBox.height / 2)).toString())
		}
		if (targetElement) {
			const targetBox: AnyRect = targetElement.getBoundingClientRect()
			lineElement.setAttribute('x2', (targetBox.x - 50 - this.props.offset).toString())
			lineElement.setAttribute('y2', (targetBox.y + (targetBox.height / 2)).toString())
			targetStubLineElement.setAttribute('x1', (targetBox.x - 50 - this.props.offset).toString())
			targetStubLineElement.setAttribute('y1', (targetBox.y + (targetBox.height / 2)).toString())
			targetStubLineElement.setAttribute('x2', (targetBox.x).toString())
			targetStubLineElement.setAttribute('y2', (targetBox.y + (targetBox.height / 2)).toString())
		}
	}

	public render() {
		const color = this.props.sourceColor

		return (
			<svg className="connection" xmlns="http://www.w3.org/2000/svg">
				<line ref={this.connectionLine} x1={0} y1={0} x2={0} y2={0} stroke={color} strokeWidth="4px" />
				<line ref={this.sourceStubLine} x1={0} y1={0} x2={0} y2={0} stroke={color} strokeWidth="4px" />
				<line ref={this.targetStubLine} x1={0} y1={0} x2={0} y2={0} stroke={color} strokeWidth="4px" />
			</svg>
		)
	}
}

const mapState = (state: IAppState, props: IConnectionViewProps) => {
	const connection = selectConnection(state, props.id) || {} as IConnection
	const sourceColor = connection && getConnectionSourceColor(state, connection.id)
	return {
		sourceId: connection.sourceId,
		targetId: connection.targetId,
		sourceColor,
		offset: connection.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 100,
	}
}

export const ConnectedConnectionView = connect(mapState, null, null, {pure: false})(ConnectionView)
