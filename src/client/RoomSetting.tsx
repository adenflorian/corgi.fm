import React from 'react'
import {connect} from 'react-redux'
import {Dispatch} from 'redux'
import {IClientAppState} from '../common/redux'

interface Props {
	label: string
	valueSelector: (state: IClientAppState) => any
	onChange: (dispatch: Dispatch) => (event: React.ChangeEvent<HTMLInputElement>) => void
}

interface ReduxProps {
	value: any
}

type AllProps = Props & ReduxProps & {dispatch: Dispatch}

export function OptionCheckbox(props: AllProps) {
	const {dispatch, label, onChange, value} = props

	return (
		<div className="option">
			<label>
				{label}
				<input
					type="checkbox"
					onChange={onChange(dispatch)}
					checked={value}
				/>
				<span className="checkmark"/>
			</label>
		</div>
	)
}

export const ConnectedOptionCheckbox = connect((state: IClientAppState, props: Props): ReduxProps => ({
	value: props.valueSelector(state),
}))(OptionCheckbox)
