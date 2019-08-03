import React, {useCallback} from 'react'
import {ContextMenu, MenuItem, SubMenu} from 'react-contextmenu'
import {useDispatch} from 'react-redux'
import {basicSamplerActions} from '@corgifm/common/redux'
import {capitalizeFirstLetter} from '@corgifm/common/common-utils'
import {CssColor} from '@corgifm/common/shamu-color'
import {IMidiNote} from '@corgifm/common/MidiNote'
import {TopMenuBar} from './TopMenuBar'

interface SamplePadMenuData {
	samplerId: Id
	midiNote: IMidiNote
}

export const samplePadMenuId = 'samplePadMenu'

export const SamplePadMenu = () => {
	const dispatch = useDispatch()

	const setColor = useCallback(
		(samplerId: Id, midiNote: IMidiNote, color: string) => {
			dispatch(basicSamplerActions.setSampleColor(samplerId, midiNote, color))
		},
		[dispatch],
	)

	return (
		<ContextMenu id={samplePadMenuId}>
			<TopMenuBar label={'sample pad menu'} />
			<ColorsMenu />
		</ContextMenu>
	)

	function ColorsMenu() {
		return <SubMenu
			title={<div>Color</div>}
			hoverDelay={0}
		>
			{(['red', 'blue', 'green', 'yellow', 'purple', 'orange'] as const)
				.map(color => <ColorOption {...{key: color, color}} />)}
		</SubMenu>
	}

	function ColorOption({color}: {color: keyof typeof CssColor}) {
		return <MenuItem
			onClick={(_, {samplerId, midiNote}: SamplePadMenuData) =>
				setColor(samplerId, midiNote, CssColor[color])}
		>
			<span style={{color: CssColor[color]}}>{capitalizeFirstLetter(color)}</span>
		</MenuItem>
	}
}
