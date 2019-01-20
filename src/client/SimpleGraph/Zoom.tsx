import * as React from 'react'

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
const mouseZoomMod = 0.0001
const mousePanMod = 1
const maxPan = 1000
const foo = Math.max(scrollZoomMod.toString().length, mouseZoomMod.toString().length)

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
	}

	public render() {
		const {children} = this.props
		const {zoom, pan} = this.state

		const zoomTextElement = document.getElementById('zoomText')
		if (zoomTextElement) zoomTextElement.innerText = zoom.toFixed(foo - 3).replace(/([^\.])0*$/, '$1')

		return (
			<div
				className="zoom"
				style={{
					transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
					willChange: 'transform',
				}}
			>
				{children}
			</div>
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
				x: this._clampPan(this.state.pan.x + (e.movementX * mousePanMod)),
				y: this._clampPan(this.state.pan.y + (e.movementY * mousePanMod)),
			},
		})
	}

	private _clampPan = (pan: number, zoom: number = this.state.zoom) =>
		Math.min(maxPan * zoom, Math.max(-maxPan * zoom, pan))
}
