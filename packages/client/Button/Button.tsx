import React, {HTMLAttributes, MouseEvent} from 'react'
import {OmitStrict} from '../../common/common-types'
import {noop} from '../../common/common-utils'
import './Button.less'

interface IButtonProps {
	buttonProps?: OmitStrict<HTMLAttributes<HTMLButtonElement>, 'onClick'>
	onClick?: (event: MouseEvent<HTMLButtonElement>) => void
	children: any
	disabled?: boolean
}

export const Button = React.memo(
	function _Button({buttonProps = {}, children, disabled = false, onClick = noop}: IButtonProps) {
		return (
			<button
				{...{
					...buttonProps,
					onClick,
					disabled,
				}}
			>
				{children}
			</button>
		)
	},
)
