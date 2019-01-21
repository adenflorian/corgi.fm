import * as React from 'react'
import PlusSVG from '../OtherSVG/plus.svg'
import {simpleGlobalClientState} from '../SimpleGlobalClientState'

interface IZoomProps {
	children: React.ReactNode
}

interface IZoomState {
	zoom: number
	pan: {
		x: number,
		y: number,
	}
}

const maxZoom = 10
const minZoom = 0.1
const scrollZoomMod = 0.001
const mouseZoomMod = 0.001
const mousePanMod = 1
const maxPan = 1000
// const zoomTextLength = Math.max(scrollZoomMod.toString().length, mouseZoomMod.toString().length)

const bgSize = 10000

export class Zoom extends React.PureComponent<IZoomProps, IZoomState> {
	public state = {
		zoom: 1,
		pan: {
			x: 0,
			y: 0,
		},
	}

	public componentDidMount() {
		window.addEventListener('wheel', this._onMouseWheel)
		window.addEventListener('mousemove', this._onMouseMove)
	}

	public componentWillUnmount() {
		window.removeEventListener('wheel', this._onMouseWheel)
		window.removeEventListener('mousemove', this._onMouseMove)
		simpleGlobalClientState.zoom = 1
	}

	public render() {
		const {children} = this.props
		const {zoom, pan} = this.state

		return (
			<React.Fragment>
				<div
					className="zoom"
					style={{
						transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
						willChange: 'transform',
					}}
				>
					<div
						className="zoomBackground"
						style={{
							position: 'fixed',
							width: `${bgSize}vw`,
							height: `${bgSize}vh`,
							top: `-${bgSize / 2}vh`,
							left: `-${bgSize / 2}vw`,
							backgroundImage: `url(${PlusSVG})`,
						}}
					/>
					{children}
				</div>
			</React.Fragment>
		)
	}

	private _onMouseWheel = (e: WheelEvent) =>
		this._zoom(e.deltaY * scrollZoomMod, true)

	private _onMouseMove = (e: MouseEvent) => {
		if (e.ctrlKey) this._zoom(e.movementY * mouseZoomMod)
		if (e.buttons === 4) this._pan(e)
	}

	private _zoom = (zoom: number, round: boolean = false) => {
		let newZoom = this._clampZoom(this.state.zoom - zoom)
		if (round) newZoom = Math.round(newZoom * 10) / 10

		simpleGlobalClientState.zoom = newZoom

		this.setState({
			zoom: newZoom,
			pan: {
				x: this._clampPan(this.state.pan.x, newZoom),
				y: this._clampPan(this.state.pan.y, newZoom),
			},
		})
	}

	private _clampZoom = (val: number) =>
		Math.min(maxZoom, Math.max(minZoom, val))

	private _pan = (e: MouseEvent) => {
		this.setState({
			pan: {
				x: this._clampPan(this.state.pan.x + (e.movementX * mousePanMod / this.state.zoom)),
				y: this._clampPan(this.state.pan.y + (e.movementY * mousePanMod / this.state.zoom)),
			},
		})
	}

	private _clampPan = (pan: number, zoom: number = this.state.zoom) =>
		Math.min(maxPan * zoom, Math.max(-maxPan * zoom, pan))
}
