import * as React from 'react'

interface IZoomProps {
	children: React.ReactNode
}

interface IZoomState {
	zoom: number
}

export class Zoom extends React.PureComponent<IZoomProps, IZoomState> {
	public state = {
		zoom: 1,
	}

	public componentDidMount() {
		window.addEventListener('wheel', this._onMouseWheel)
	}

	public componentWillUnmount() {
		window.removeEventListener('wheel', this._onMouseWheel)
	}

	public render() {
		const {children} = this.props

		return (
			<div
				className="zoom"
				style={{
					transform: `scale(${this.state.zoom})`,
				}}
			>
				{children}
			</div>
		)
	}

	private _onMouseWheel = (e: WheelEvent) => this.setState({zoom: this.state.zoom - (e.deltaY * 0.001)})
}
