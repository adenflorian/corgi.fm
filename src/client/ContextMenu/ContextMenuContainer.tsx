import React, {useState, useEffect} from 'react'
import {zoomBackgroundClass, backgroundMenuId} from '../client-constants';
import {MenuItem, ContextMenu} from 'react-contextmenu';
import './ContextMenu.less'

export function ContextMenuContainer() {
	// const [{showMenu, position}, setState] = useState({
	// 	showMenu: false,
	// 	position: {
	// 		x: 0,
	// 		y: 0,
	// 	},
	// })

	// useEffect(() => {
	// 	const _onContextMenu = (e: MouseEvent) => {
	// 		if (e.shiftKey) return
	// 		if (e.target) {
	// 			const x = e.target as HTMLDivElement
	// 			if (x.className !== zoomBackgroundClass) return
	// 		}

	// 		e.preventDefault()

	// 		setState({
	// 			showMenu: true,
	// 			position: {
	// 				x: e.x,
	// 				y: e.y,
	// 			}
	// 		})
	// 	}
	// 	window.addEventListener('contextmenu', _onContextMenu)
	// 	return () => window.removeEventListener('contextmenu', _onContextMenu)
	// })

	// if (showMenu) {
	// 	return <ContextMenu position={position} />
	// } else {
	// 	return null
	// }
	return (
		<ContextMenu id={backgroundMenuId}>
			<MenuItem
				attributes={{
					className: 'contextMenuTop',
					title: 'shift + right click to get browser context menu',
				}}
				preventClose={true}
			>
				do stuff
			</MenuItem>
			<MenuItem onClick={handleClick}>
				Add Synth (coming soon)
			</MenuItem>
			<MenuItem onClick={handleClick}>
				Add Grid Sequencer (coming soon)
			</MenuItem>
		</ContextMenu>
	)
}


function handleClick(
	event: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>,
	data: Object
) {
	console.log(data);
}
