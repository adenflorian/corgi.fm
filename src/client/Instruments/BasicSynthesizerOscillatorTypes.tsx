import React from 'react'
import ReactSVG from 'react-svg'
import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from '../../common/OscillatorTypes'
import NoiseWave from './NoiseWave.svg'
import SawWave from './SawWave.svg'
import SineWave from './SineWave.svg'
import SquareWave from './SquareWave.svg'
import TriangleWave from './TriangleWave.svg'

interface IBasicSynthesizerOscillatorTypesProps {
	handleClick: (type: ShamuOscillatorType) => void
	activeType: ShamuOscillatorType
}

const oscillatorTypes: Array<{type: ShamuOscillatorType, svgPath: string, title: string}> = [
	{type: BuiltInOscillatorType.sine, svgPath: SineWave, title: 'Sine Wave'},
	{type: BuiltInOscillatorType.triangle, svgPath: TriangleWave, title: 'Triangle Wave'},
	{type: BuiltInOscillatorType.sawtooth, svgPath: SawWave, title: 'Saw Wave'},
	{type: BuiltInOscillatorType.square, svgPath: SquareWave, title: 'Square Wave'},
	{type: CustomOscillatorType.noise, svgPath: NoiseWave, title: 'Noise Wave'},
]

export class BasicSynthesizerOscillatorTypes extends React.PureComponent<IBasicSynthesizerOscillatorTypesProps> {
	public render() {
		const {activeType, handleClick} = this.props

		return (
			<div className="oscillatorTypes">
				{oscillatorTypes.map(({type, svgPath, title}) =>
					<div
						key={type}
						title={title}
						onClick={handleClick.bind(undefined, type)}
						style={{
							width: 40,
							height: 40,
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
						}}
					>
						<ReactSVG
							src={svgPath}
							className={activeType === type ? 'active colorize' : undefined}
						/>
					</div>,
				)}
			</div>
		)
	}
}
