import React, {HTMLAttributes} from 'react'
import './Button.less'

interface IButtonProps {
	buttonProps?: HTMLAttributes<HTMLButtonElement>
	children: any
	disabled?: boolean
}

export const Button = React.memo(
	function _Button({buttonProps = {}, children, disabled = false}: IButtonProps) {
		return (
			<button
				{...buttonProps}
				disabled={disabled}
			>
				{children}
			</button>
		)
	},
)
