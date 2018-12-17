import * as React from 'react'
import {Component} from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../common/redux/common-redux-types'
import {AppOption, setOption} from '../common/redux/options-redux'

interface IOptionProps {
	option: AppOption
	label: string
}

interface IOptionReduxProps {
	value: number | boolean
}

type IOptionAllProps = IOptionProps & IOptionReduxProps & {dispatch: Dispatch}

export class Option extends Component<IOptionAllProps> {
	public static defaultProps = {
		value: false,
	}

	public render() {
		const {dispatch, label, option, value} = this.props

		if (typeof value === 'number') throw new Error('numbers are not supported in this component')

		return (
			<div className="option">
				{label}
				<input
					type="checkbox"
					onChange={e => dispatch(setOption(option, e.target.checked))}
					checked={value}
				/>
			</div>
		)
	}
}

export const ConnectedOption = connect((state: IClientAppState, props: IOptionProps): IOptionReduxProps => ({
	value: state.options[props.option],
}))(Option)
