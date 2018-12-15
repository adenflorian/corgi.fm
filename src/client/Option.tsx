import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IAppState} from '../common/redux/client-store'
import {setOption} from '../common/redux/options-redux'

interface IOptionProps {
	option: string
	value?: any
	setValue?: (newValue: any) => any
	label: string
}

export class Option extends Component<IOptionProps> {
	public render() {
		const {label, value, setValue} = this.props

		return (
			<div className="option">
				{label}
				<input
					type="checkbox"
					onChange={e => setValue(e.target.checked)}
					checked={value}
				/>
			</div>
		)
	}
}

export const ConnectedOption = connect((state: IAppState, props: IOptionProps) => ({
	value: state.options[props.option],
}), (dispatch: Dispatch, props: IOptionProps) => ({
	setValue: (newValue: any) => dispatch(setOption(props.option, newValue)),
}))(Option)
