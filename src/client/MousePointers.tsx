import * as React from 'react'
import {connect} from 'react-redux'
import {selectAllClients, selectAllOtherPointers, selectLocalClient} from '../common/redux/clients-redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {CssColor} from '../common/shamu-color'
import {getMainBoardsRectY} from './utils'

interface IMousePointersViewProps {
	pointers: Array<{
		x: number,
		y: number,
		color: string,
		name: string,
	}>
}

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
									top: pointer.y - 2,
									left: pointer.x - 8,
									width: 16,
									height: 16,
									zIndex: 10,
								}}
							>
								<svg
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
									preserveAspectRatio="xMidYMid meet"
									viewBox="0 0 64 64"
									width="48px"
									height="48px"
								>
									<path
										d="
										M46 38.56L34.78 37.77L40.36 51.15L35.49 53L30.07 39.23L22.17 47.18L22 12.37L46 38.56Z
										"
										opacity="1"
										fill={CssColor.panelGray}
										stroke={pointer.color}
										strokeWidth="2"
										strokeOpacity="1"
									/>
								</svg>
								<div
									style={{
										color: pointer.color,
										marginLeft: 14,
									}}
								>
									{pointer.name}
								</div>
							</div>
						)
					})
				}
			</div>
		)
	}
}

const mapStateToProps = (state: IClientAppState): IMousePointersViewProps => {
	return {
		pointers: selectAllOtherPointers(state),
	}
}

export const MousePointers = connect(mapStateToProps)(MousePointersView)
