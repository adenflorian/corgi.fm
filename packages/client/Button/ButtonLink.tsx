import React, {HTMLAttributes} from 'react'

interface Props extends HTMLAttributes<HTMLAnchorElement> {
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
