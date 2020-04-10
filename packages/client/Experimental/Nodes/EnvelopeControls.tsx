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
		width={position.width - 16}
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

const sectionCount = 5
const height = 200
const padding = 8
const usableHeight = height - (padding * 2)
const minY = padding
const maxY = height - padding
const minX = padding

export const EnvelopeControls = (({
	attack, hold, decay, sustain, release, width,
}: Props) => {
	const usableWidth = width - (padding * 2)
	const sectionWidth = usableWidth / sectionCount
	const attackX = padding + (attack * sectionWidth)
	const holdX = attackX + (hold * sectionWidth)
	const decayX = holdX + (decay * sectionWidth)
	const sustainX = padding + (sectionWidth * 4)
	const sustainY = padding + usableHeight - (sustain * usableHeight)
	const releaseX = sustainX + (release * sectionWidth)

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
						L${attackX} ${minY}
						L${holdX} ${minY}
						L${decayX} ${sustainY}
						L${sustainX} ${sustainY}
						L${releaseX} ${maxY}
					`}
					scale={0.8}
				/>
			</svg>
		</div>
	)
})