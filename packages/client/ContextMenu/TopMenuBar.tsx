import {MenuItem} from 'react-contextmenu'
import React from 'react'

export const TopMenuBar = ({label}: {label: string}) => {
	return (
		<MenuItem
			attributes={{
				className: 'contextMenuTop',
				title: 'shift + right click to get browser context menu',
			}}
			preventClose={true}
		>
			{label}
		</MenuItem>
	)
}
