import * as React from 'react'
import {CssColor} from '../../common/shamu-color'
import {Panel} from '../Panel/Panel'
import './Button.less'

interface IButtonProps {
	buttonProps?: any
	style?: 'fancyButton' | 'flatButton'
	children: any
}

export const Button = React.memo(
	function _Button({buttonProps = {}, style = 'fancyButton', children}: IButtonProps) {
		if (style === 'fancyButton') {
			return (
				<Panel
					className={'buttonContainer ' + style}
					autoSize={true}
					color={CssColor.defaultGray}
				>
					<button
						{...buttonProps}
					>
						{children}
					</button>
				</Panel>
			)
		} else {
			return (
				<div className="buttonContainer flatButton">
					<button
						{...buttonProps}
					>
						{children}
					</button>
				</div>
			)
		}
	},
)
