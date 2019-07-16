import React from 'react'
import {ContextMenuTrigger} from 'react-contextmenu'
import {Point} from '@corgifm/common/common-types'
import {
	selectLocalClientId, selectOptions, selectRoomSettings, shamuConnect,
} from '@corgifm/common/redux'
import {backgroundMenuId, graphSizeX, zoomBackgroundClass} from '../client-constants'
import PlusSVG from '../OtherSVG/plus.svg'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'

interface IZoomProps {
	children: React.ReactNode
}

interface IZoomReduxProps {
	requireCtrlToZoom: boolean
	fancyZoomPan: boolean
	disableMenu: boolean
}

type IZoomAllProps = IZoomProps & IZoomReduxProps

interface IZoomState {
	zoom: number
	zoomReal: number
	pan: {
		x: number,
		y: number,
	}
	backgroundClicked: boolean
}

const maxZoom = 3
const minZoom = -3
const scrollZoomMod = 0.002
const mouseZoomMod = 0.001
const mousePanMod = 1
const maxPan = graphSizeX
// const zoomTextLength = Math.max(scrollZoomMod.toString().length, mouseZoomMod.toString().length)

const bgSize = 10000

export class Zoom extends React.PureComponent<IZoomAllProps, IZoomState> {
	public state = {
		zoom: 0,
		zoomReal: 1,
		pan: {
			x: 0,
			y: 0,
		},
		backgroundClicked: false,
	}

	public componentDidMount() {
		window.addEventListener('wheel', this._onMouseWheel, {passive: false})
		window.addEventListener('mousemove', this._onMouseMove)
	}

	public componentWillUnmount() {
		window.removeEventListener('wheel', this._onMouseWheel)
		window.removeEventListener('mousemove', this._onMouseMove)
		simpleGlobalClientState.zoom = 1
		simpleGlobalClientState.zoomDisplay = 0
		simpleGlobalClientState.pan = {x: 0, y: 0}
	}

	public render() {
		const {children, fancyZoomPan, disableMenu} = this.props
		const {zoomReal, pan} = this.state

		return (
			<div
				className="zoomZoom"
				style={{
					transform: `scale(${zoomReal}) translate(${pan.x}px, ${pan.y}px)`,
					willChange: fancyZoomPan ? '' : 'transform',
					// transition: backgroundClicked ? '' : 'transform 0.05s ease 0s',
				}}
			>
				<ZoomBackground
					onMouseEvent={this._onBgMouseEvent}
					disableMenu={disableMenu}
				/>
				{children}
			</div>
		)
	}

	private readonly _onBgMouseEvent = (e: React.MouseEvent) => {
		if (e.type === 'mousedown') {
			this.setState({
				backgroundClicked: true,
			})
		}
	}

	private readonly _onMouseWheel = (e: WheelEvent) => {
		// Turning off rounding so that two finger track pad scrolling will be smooth
		// TODO Detect if scroll amount is small or large, if large, round it
		if (this.props.requireCtrlToZoom === false || e.ctrlKey) {
			this._zoom(e.deltaY * scrollZoomMod, e.clientX, e.clientY, e.ctrlKey)
		} else {
			this._pan(-e.deltaX, -e.deltaY)
		}
		e.preventDefault()
	}

	private readonly _onMouseMove = (e: MouseEvent) => {
		if (e.buttons !== 1 && this.state.backgroundClicked) {
			this.setState({
				backgroundClicked: false,
			})
		}
		if (e.buttons === 4) this._pan(e.movementX, e.movementY)
		if (this.state.backgroundClicked && e.buttons === 1) {
			if (e.ctrlKey) {
				this._zoom(e.movementY * mouseZoomMod)
			} else {
				this._pan(e.movementX, e.movementY)
			}
		}
	}

	private readonly _zoom = (zoom: number, clientX?: number, clientY?: number, controlKey = false) => {
		const newZoom = this._clampZoom(this.state.zoom - zoom)

		const newZoomReal = 2 ** newZoom

		const zoomDelta = newZoomReal - this.state.zoomReal

		if (zoomDelta === 0) return

		const zoomPercentChange = (newZoomReal - this.state.zoomReal) / this.state.zoomReal

		const distanceFromCenterX = clientX && !controlKey ? clientX - (window.innerWidth / 2) : 0
		const distanceFromCenterY = clientY && !controlKey ? clientY - (window.innerHeight / 2) : 0

		const panX = ((distanceFromCenterX * zoomPercentChange) / newZoomReal)
		const panY = ((distanceFromCenterY * zoomPercentChange) / newZoomReal)

		const newPan = {
			x: this._clampPan(this.state.pan.x - panX, newZoomReal),
			y: this._clampPan(this.state.pan.y - panY, newZoomReal),
		}

		simpleGlobalClientState.zoom = newZoomReal
		simpleGlobalClientState.zoomDisplay = newZoom
		simpleGlobalClientState.pan = newPan

		this.setState({
			zoom: newZoom,
			zoomReal: newZoomReal,
			pan: newPan,
		})
	}

	private readonly _clampZoom = (val: number) =>
		Math.min(maxZoom, Math.max(minZoom, val))

	private readonly _pan = (x = 0, y = 0) => {
		const newPan = {
			x: this._clampPan(this.state.pan.x + (x * mousePanMod / this.state.zoomReal)),
			y: this._clampPan(this.state.pan.y + (y * mousePanMod / this.state.zoomReal)),
		}
		simpleGlobalClientState.pan = newPan
		this.setState({
			pan: newPan,
		})
	}

	private readonly _clampPan = (pan: number, zoom: number = this.state.zoomReal) =>
		Math.min(maxPan * zoom, Math.max(-maxPan * zoom, pan))
}

interface ZoomBgProps {
	onMouseEvent: (e: React.MouseEvent) => void
	disableMenu: boolean
}

const ZoomBackground = React.memo(
	function _ZoomBackground({onMouseEvent, disableMenu}: ZoomBgProps) {
		return (
			// @ts-ignore disableIfShiftIsPressed
			<ContextMenuTrigger
				id={backgroundMenuId}
				disableIfShiftIsPressed={true}
				holdToDisplay={-1}
				disable={disableMenu}
			>
				<div
					className={zoomBackgroundClass}
					style={{
						position: 'fixed',
						width: `${bgSize}vw`,
						height: `${bgSize}vh`,
						top: `-${bgSize / 2}vh`,
						left: `-${bgSize / 2}vw`,
						backgroundImage: `url(${PlusSVG})`,
					}}
					onMouseDown={onMouseEvent}
				/>
			</ContextMenuTrigger>
		)
	},
)

export const ConnectedZoom = shamuConnect(
	(state): IZoomReduxProps => {
		const roomSettings = selectRoomSettings(state.room)

		return {
			requireCtrlToZoom: selectOptions(state).requireCtrlToScroll,
			fancyZoomPan: selectOptions(state).graphicsExpensiveZoomPan,
			disableMenu: selectLocalClientId(state) !== roomSettings.ownerId && roomSettings.onlyOwnerCanDoStuff,
		}
	},
)(Zoom)

export function toGraphSpace(x = 0, y = 0): Readonly<Point> {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return Object.freeze({
		x: ((x - (window.innerWidth / 2)) / zoom) - pan.x,
		y: ((y - (window.innerHeight / 2)) / zoom) - pan.y,
	})
}

export function fromGraphSpace(x = 0, y = 0): Readonly<Point> {
	const zoom = simpleGlobalClientState.zoom
	const pan = simpleGlobalClientState.pan

	return Object.freeze({
		x: ((x + pan.x) * zoom) + (window.innerWidth / 2),
		y: ((y + pan.y) * zoom) + (window.innerHeight / 2),
	})
}
