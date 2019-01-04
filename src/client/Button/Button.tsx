import * as React from 'react'
import {Component} from 'react'
import './Button.less'

interface IButtonProps {
	buttonProps: any
	buttonChildren: any
}

export class Button extends Component<IButtonProps> {
	public render() {
		return (
			<div className="buttonContainer">
				<div className="isometricBoxShadow" />
				<button
					{...this.props.buttonProps}
				>
					{this.props.buttonChildren}
				</button>
			</div>
		)
	}
}
