import * as React from 'react'

const startHue = 180
const saturation = 60
const lightness = 60
const x = 360 * 2
const stopCount = 16

function foo() {
	return new Array(stopCount)
		.fill(0)
		.map((_, i) =>
			<React.Fragment>
				<stop
					offset={i / stopCount}
					stopColor={`hsl(${startHue + (i / stopCount * x)}, ${saturation}%, ${lightness}%)`}
				/>
				<stop
					offset={((i + 1) / stopCount) - 0.001}
					stopColor={`hsl(${startHue + (i / stopCount * x)}, ${saturation}%, ${lightness}%)`}
				/>
			</React.Fragment>,
		)
}

export const SvgGradients = () =>
	<React.Fragment>
		<svg
			style={{
				width: 0,
				height: 0,
				position: 'absolute',
			}}
			aria-hidden="true"
			focusable="false"
		>
			<linearGradient id="my-cool-gradient" x2="1" y2="1">
				<stop offset="0%" stopColor="#447799" />
				<stop offset="50%" stopColor="#224488" />
				<stop offset="100%" stopColor="#112266" />
			</linearGradient>
			<linearGradient xmlns="http://www.w3.org/2000/svg" id="rainbow" x2="1" y2="1">
				{foo()}
			</linearGradient>
		</svg>
	</React.Fragment >
