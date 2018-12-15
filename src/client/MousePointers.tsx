import * as React from 'react'
import {connect} from 'react-redux'
import {IAppState} from '../common/redux/client-store'
import {selectAllClients, selectLocalClient} from '../common/redux/clients-redux'

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

const mapStateToProps = (state: IAppState): IMousePointersViewProps => {
	const localClientId = selectLocalClient(state).id
	const otherClients = selectAllClients(state).filter(x => x.id !== 'server' && x.id !== localClientId)
	const mainBoardsElement = document.getElementById('mainBoards')
	let mainBoardsRect: any
	if (mainBoardsElement) {
		mainBoardsRect = document.getElementById('mainBoards').getBoundingClientRect()
	} else {
		mainBoardsRect = {y: 0}
	}
	return {
		pointers: otherClients.map(client => ({
			x: client.pointer.distanceFromCenterX
				+ (document.body.scrollWidth / 2) - (size / 2) - window.scrollX,
			y: client.pointer.distanceFromBoardsTop
				+ mainBoardsRect.y - (size / 2),
			color: client.color,
		})),
	}
}

export const MousePointers = connect(mapStateToProps)(MousePointersView)
