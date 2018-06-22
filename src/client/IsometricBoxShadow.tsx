import * as React from 'react'
import './IsometricBoxShadow.less'

export const IsometricBoxShadow = ({children, color}) =>
	<div
		className="isometricBoxShadow"
		style={{boxShadow: boxShadow3dCss(4, color)}}
	>
		{children}
	</div>

function boxShadow3dCss(size: number, color: string) {
	let x = ''

	for (let i = 0; i < size; i++) {
		x += `${-i - 1}px ${i + 2}px ${color},`
	}

	return x.replace(/,$/, '')

	/*
	0px 1px #999,
	-1px 2px #999,
	-2px 3px #999,
	-3px 4px #999,
	-4px 5px #999,
	-5px 6px #999;
	*/
}
