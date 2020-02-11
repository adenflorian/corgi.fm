import React, {HTMLAttributes, MouseEvent} from 'react'
import {noop} from '@corgifm/common/common-utils'
import './Button.less'

interface IButtonProps {
	readonly buttonProps?: OmitStrict<HTMLAttributes<HTMLButtonElement>, 'onClick'>
	readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void
	readonly children: any
	readonly disabled?: boolean
	readonly background?: 'light' | 'dark' | 'medium'
	readonly shadow?: boolean
}

export const Button = React.memo(
	function _Button({buttonProps = {}, children, disabled = false, onClick = noop, background = 'light', shadow = false}: IButtonProps) {
		return (
			<button
				type="button"
				{...{
					...buttonProps,
					onClick,
					disabled,
					className: `corgiButton bg-${background} shadow-${shadow}` + (buttonProps.className || ''),
				}}
			>
				{children}
			</button>
		)
	},
)
