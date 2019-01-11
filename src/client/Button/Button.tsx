import * as React from 'react'
import {Component} from 'react'
import {Panel} from '../Panel'
import './Button.less'

interface IButtonProps {
	buttonProps: any
	children: any
}

export class Button extends Component<IButtonProps> {
	public render() {
		return (
			<Panel
				className="buttonContainer"
				color="lightGray"
			>
				<button
					{...this.props.buttonProps}
				>
					{this.props.children}
				</button>
			</Panel>
		)
	}
}
