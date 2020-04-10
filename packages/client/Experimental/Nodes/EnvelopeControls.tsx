import React from 'react'
import {hot} from 'react-hot-loader'
import {CssColor} from '@corgifm/common/shamu-color'
import {useExpPosition} from '../../react-hooks'
import {useNodeContext} from '../CorgiNode'
import {expAttackMax, expHoldMax, expDecayMax, expSustainMax, expReleaseMax,
	expAttackCurve, expHoldCurve, expDecayCurve, expSustainCurve, expReleaseCurve,
} from '@corgifm/common/common-constants'
import {EnvelopeNode} from './EnvelopeNode'
import {useNumberChangedEvent} from '../hooks/useCorgiEvent'
import {reverseCurve} from '@corgifm/common/common-utils'

export function getEnvelopeControlsComponent() {
	return <EnvelopeControlsWrapper />
}

export const EnvelopeControlsWrapper = hot(module)(() => {
	const nodeContext = useNodeContext() as EnvelopeNode
	const attack = useNumberChangedEvent(nodeContext.attack.onChange)
	const hold = useNumberChangedEvent(nodeContext.hold.onChange)
	const decay = useNumberChangedEvent(nodeContext.decay.onChange)
	const sustain = useNumberChangedEvent(nodeContext.sustain.onChange)
	const release = useNumberChangedEvent(nodeContext.release.onChange)
	const position = useExpPosition(nodeContext.id)
	return <EnvelopeControls
		attack={reverseCurve(attack / expAttackMax, expAttackCurve)}
		hold={reverseCurve(hold / expHoldMax, expHoldCurve)}
		decay={reverseCurve(decay / expDecayMax, expDecayCurve)}
		sustain={reverseCurve(sustain / expSustainMax, expSustainCurve)}
		release={reverseCurve(release / expReleaseMax, expReleaseCurve)}
		width={position.width}
	/>
})

/** ADSR values should be normalized */
interface Props {
	readonly attack: number
	readonly hold: number
	readonly decay: number
	readonly sustain: number
	readonly release: number
	readonly width: number
}

const sectionCount = 4
const height = 200
const padding = 8
const usableHeight = height - (padding * 2)
const minY = padding
const maxY = height - padding
const minX = padding
const controlDotRadius = 4
const controlDotStrokeColor = CssColor.defaultGray
const controlDotFillColor = 'none'

export const EnvelopeControls = (({
	attack, hold, decay, sustain, release, width,
}: Props) => {
	const usableWidth = width - (padding * 2)
	const sectionWidth = usableWidth / sectionCount
	const attackX = padding + (attack * sectionWidth)
	const attackY = minY
	const holdX = attackX + (hold * sectionWidth)
	const holdY = minY
	const decayX = holdX + (decay * sectionWidth)
	const sustainX = padding + (sectionWidth * 3)
	const sustainY = padding + usableHeight - (sustain * usableHeight)
	const decayY = sustainY
	const decayControlX = holdX
	const decayControlY = sustainY
	const releaseX = sustainX + (release * sectionWidth)
	const releaseY = maxY
	const releaseControlX = sustainX
	const releaseControlY = maxY

	return (
		<div className="envelopeControls">
			<svg width={width} height="200" style={{backgroundColor: CssColor.panelGrayDark}}>
				<path
					fill={'none'}
					stroke='currentcolor'
					strokeWidth={2}
					strokeLinecap="round"
					d={`
						M${minX} ${maxY}
						L${attackX} ${attackY}
						L${holdX} ${holdY}
						Q${decayControlX} ${decayControlY}, ${decayX} ${decayY}
						L${sustainX} ${sustainY}
						Q${releaseControlX} ${releaseControlY}, ${releaseX} ${releaseY}
					`}
					scale={0.8}
				/>
				<circle cx={attackX} cy={attackY} r={controlDotRadius} fill={controlDotFillColor} stroke={controlDotStrokeColor} strokeWidth={2} />
				<circle cx={holdX} cy={holdY} r={controlDotRadius} fill={controlDotFillColor} stroke={controlDotStrokeColor} strokeWidth={2} />
				<circle cx={decayX} cy={decayY} r={controlDotRadius} fill={controlDotFillColor} stroke={controlDotStrokeColor} strokeWidth={2} />
				<circle cx={sustainX} cy={sustainY} r={controlDotRadius} fill={controlDotFillColor} stroke={controlDotStrokeColor} strokeWidth={2} />
				<circle cx={releaseX} cy={releaseY} r={controlDotRadius} fill={controlDotFillColor} stroke={controlDotStrokeColor} strokeWidth={2} />
				{/* <circle cx={decayControlX} cy={decayControlY} r="3" fill="red" />
				<circle cx={releaseControlX} cy={releaseControlY} r="3" fill="red" /> */}
			</svg>
		</div>
	)
})