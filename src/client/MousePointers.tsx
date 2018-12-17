import * as React from 'react'
import {connect} from 'react-redux'
import {selectAllClients, selectLocalClient} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'

interface IMousePointersViewProps {
	pointers: Array<{
		x: number,
		y: number,
		color: string,
	}>
}

const size = 8

class MousePointersView extends React.PureComponent<IMousePointersViewProps> {
	public render() {
		return (
			<div className="pointers">
				{this.props.pointers
					.map((pointer, index) => {
						return (
							<div
								key={index}
								className="pointer"
								style={{
									position: 'fixed',
									top: pointer.y,
									left: pointer.x,
									width: 8,
									height: 8,
									backgroundColor: pointer.color,
									zIndex: 10,
									filter: 'opacity(0.8)',
								}}
							/>
						)
					})}
			</div>
		)
	}
}

const mapStateToProps = (state: IClientAppState): IMousePointersViewProps => {
	const localClientId = selectLocalClient(state).id
	const otherClients = selectAllClients(state).filter(x => x.id !== 'server' && x.id !== localClientId)
	return {
		pointers: otherClients.map(client => ({
			x: client.pointer.distanceFromCenterX
				+ (document.body.scrollWidth / 2) - (size / 2) - window.scrollX,
			y: client.pointer.distanceFromBoardsTop
				+ getMainBoardsRectY() - (size / 2),
			color: client.color,
		})),
	}
}

export function getMainBoardsRectY() {
	const mainBoardsElement = document.getElementById('mainBoards')

	if (mainBoardsElement) {
		return (mainBoardsElement.getBoundingClientRect() as DOMRect).y
	} else {
		return 0
	}
}

export const MousePointers = connect(mapStateToProps)(MousePointersView)
