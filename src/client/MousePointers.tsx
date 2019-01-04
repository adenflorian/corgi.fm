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

const pathOuter = `
	M2882 7943
	c4 -2601 9 -4962 10 -5249
	l3 -521 1105 1034
	c608 569 1153 1079 1211 1133
	l106 99 503 -1282
	c589 -1502 941 -2394 998 -2527 42 -98 123
		-210 152 -210 49 0 867 267 1095 357 295 117
		375 174 375 271 0 34 -157 408 -825 1960 -455
		1054 -827 1921 -828 1927 -1 5 12 8 28 7 17
		-1 783 -65 1704 -142 920 -78 1677 -139 1681
		-138 5 2 -1625 1787 -3622 3968 -1996 2181
		-3645 3982 -3664 4003 -19 20 -35 37 -36 37
		-2 0 0 -2127 4 -4727
	z
`

const pathInner = `
	m3399 442
	l2993 -3270 -39 -2
	c-22 -1 -717 55 -1545 125 -828 71 -1506 125
		-1508 121 -5 -11 1178 -2774 1495 -3494 63 -143
		160 -358 215 -478 55 -120 98 -221 95 -224 -8
		-7 -818 -293 -832 -293 -5 0 -381 944 -834 2098
		-454 1153 -829 2107 -836 2120 -10 21 -71 -34
		-1100 -997 -600 -561 -1092 -1018 -1094 -1015
		-7 6 -16 8584 -10 8582 4 -2 1354 -1474 3000 -3273
	z
`

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
									top: pointer.y + 4,
									left: pointer.x - 4,
									width: 8,
									height: 8,
									// backgroundColor: pointer.color,
									zIndex: 10,
									// filter: 'opacity(0.8)',
								}}
							>
								<svg
									version="1.0"
									xmlns="http://www.w3.org/2000/svg"
									width="28px"
									height="28px"
									viewBox="0 0 1280.000000 1280.000000"
									preserveAspectRatio="xMidYMid meet"
								>
									<g
										transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
										fill="black"
										stroke="none"
									>
										<path
											d={pathOuter}
											fill="white"
										/>
										<path
											d={pathOuter + ' ' + pathInner}
										/>
									</g>
								</svg>
							</div>
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
