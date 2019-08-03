import React, {useCallback} from 'react'
import {ContextMenu, MenuItem, SubMenu} from 'react-contextmenu'
import {useDispatch} from 'react-redux'
import {basicSamplerActions} from '@corgifm/common/redux'
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
			<SubMenu
				title={<div>Color</div>}
				hoverDelay={0}
			>
				<MenuItem onClick={(_, {samplerId, midiNote}: SamplePadMenuData) => setColor(samplerId, midiNote, CssColor.red)}>
					<span style={{color: CssColor.red}}>Red</span>
				</MenuItem>
				<MenuItem onClick={(_, {samplerId, midiNote}: SamplePadMenuData) => setColor(samplerId, midiNote, CssColor.blue)}>
					<span style={{color: CssColor.blue}}>Blue</span>
				</MenuItem>
				<MenuItem onClick={(_, {samplerId, midiNote}: SamplePadMenuData) => setColor(samplerId, midiNote, CssColor.green)}>
					<span style={{color: CssColor.green}}>Green</span>
				</MenuItem>
				<MenuItem onClick={(_, {samplerId, midiNote}: SamplePadMenuData) => setColor(samplerId, midiNote, CssColor.yellow)}>
					<span style={{color: CssColor.yellow}}>Yellow</span>
				</MenuItem>
				<MenuItem onClick={(_, {samplerId, midiNote}: SamplePadMenuData) => setColor(samplerId, midiNote, CssColor.purple)}>
					<span style={{color: CssColor.purple}}>Purple</span>
				</MenuItem>
				<MenuItem onClick={(_, {samplerId, midiNote}: SamplePadMenuData) => setColor(samplerId, midiNote, CssColor.orange)}>
					<span style={{color: CssColor.orange}}>Orange</span>
				</MenuItem>
			</SubMenu>
		</ContextMenu>
	)
}
