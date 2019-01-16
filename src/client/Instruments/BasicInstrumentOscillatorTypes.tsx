import * as React from 'react'
import ReactSVG from 'react-svg'
import {BuiltInOscillatorType, CustomOscillatorType, ShamuOscillatorType} from '../../common/OscillatorTypes'
import NoiseWave from './NoiseWave.svg'
import SawWave from './SawWave.svg'
import SineWave from './SineWave.svg'
import SquareWave from './SquareWave.svg'
import TriangleWave from './TriangleWave.svg'

interface IBasicInstrumentOscillatorTypesProps {
	handleClick: (type: ShamuOscillatorType) => void
	activeType: ShamuOscillatorType
}

const oscillatorTypes: Array<{type: ShamuOscillatorType, svgPath: string}> = [
	{type: BuiltInOscillatorType.sine, svgPath: SineWave},
	{type: BuiltInOscillatorType.triangle, svgPath: TriangleWave},
	{type: BuiltInOscillatorType.sawtooth, svgPath: SawWave},
	{type: BuiltInOscillatorType.square, svgPath: SquareWave},
	{type: CustomOscillatorType.noise, svgPath: NoiseWave},
]

export class BasicInstrumentOscillatorTypes extends React.PureComponent<IBasicInstrumentOscillatorTypesProps> {
	public render() {
		const {activeType, handleClick} = this.props

		return (
			<div className="oscillatorTypes">
				{oscillatorTypes.map(({type, svgPath}) =>
					<div
						key={type}
						onClick={handleClick.bind(undefined, type)}
						style={{
							width: 40,
							height: 40,
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
						}}>
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
