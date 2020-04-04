import {List} from 'immutable'
import React from 'react'
import {hot} from 'react-hot-loader'
import './Select.less'

interface ISelectProps extends React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> {
	label: string
	name: string
	onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
	options: List<string>
	value: string
}

// TODO Make it use PanelLite
export const Select = hot(module)(({label, name, onChange, options, value, ...selectProps}: ISelectProps) =>
	<div className="shamuSelect blob focusBorder">
		{/* <label
			htmlFor={name}
			style={{
				position: 'relative',
				top: -1,
			}}>
			{label}
		</label> */}
		<select name={name} value={value} onChange={onChange} {...selectProps}>
			{options.map(choice =>
				<option key={choice} value={choice} label={choice}>{choice}</option>,
			)}
		</select>
		<div className="arrow">
			<div>▼</div>
		</div>
	</div>
)