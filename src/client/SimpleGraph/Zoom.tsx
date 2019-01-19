import * as React from 'react'

interface IZoomProps {
	children: React.ReactNode
}

interface IZoomState {
	zoom: number
}

const maxZoom = 10
const minZoom = 0.1
const scrollMod = 0.001
const mouseMod = 0.001

export class Zoom extends React.PureComponent<IZoomProps, IZoomState> {
	public state = {
		zoom: 1,
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

		return (
			<div
				className="zoom"
				style={{
					transform: `scale(${this.state.zoom})`,
					willChange: 'transform',
				}}
			>
				{children}
			</div>
		)
	}

	private _onMouseWheel = (e: WheelEvent) =>
		this.setState({
			zoom: Math.min(maxZoom,
				Math.max(minZoom,
					this.state.zoom - (e.deltaY * scrollMod),
				),
			),
		})

	private _onMouseMove = (e: MouseEvent) =>
		e.ctrlKey
			? this.setState({
				zoom: Math.min(maxZoom,
					Math.max(minZoom,
						this.state.zoom - (e.movementY * mouseMod),
					),
				),
			})
			: null
}
