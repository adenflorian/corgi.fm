import React from 'react'
import {IoMdOpen as Open} from 'react-icons/io'
import './ButtonLink.less'

interface Props {
	newTab?: boolean
	href: string
	children: any
}

export const ButtonLink = React.memo(
	function _ButtonLink({children, newTab, ...rest}: Props) {
		return (
			<a
				className="buttonLink"
				target={newTab ? '_blank' : undefined}
				{...rest}
			>
				{children}
			</a>
		)
	},
)
