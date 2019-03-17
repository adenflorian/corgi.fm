import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../common/redux'
import {AppOptions, selectOption, setOption} from '../common/redux'

interface IOptionProps {
	option: AppOptions
	label: string
}

interface IOptionReduxProps {
	value: any
}

type IOptionAllProps = IOptionProps & IOptionReduxProps & {dispatch: Dispatch}

export class Option extends Component<IOptionAllProps> {
	public static defaultProps = {
		value: false,
	}

	public render() {
		const {dispatch, label, option, value} = this.props

		if (typeof value === 'number') throw new Error('numbers are not supported in this component')

		const id = `optionInput-${option}`

		return (
			<div className="option">
				<label>
					{label}
					<input
						id={id}
						type="checkbox"
						onChange={e => dispatch(setOption(option, e.target.checked))}
						checked={value}
					/>
					<span className="checkmark"></span>
				</label>
			</div>
		)
	}
}

export const ConnectedOption = connect((state: IClientAppState, props: IOptionProps): IOptionReduxProps => ({
	value: selectOption(state, props.option),
}))(Option)
