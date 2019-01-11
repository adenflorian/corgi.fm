import {List} from 'immutable'
import * as React from 'react'
import './Select.less'

interface ISelectProps {
	label: string
	name: string
	onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
	options: List<string>
	value: string
}

export const Select = ({label, name, onChange, options, value}: ISelectProps) =>
	<div className="selectRow">
		<label htmlFor={name}>{label}</label>
		<div className="selectContainer">
			<div className="isometricBoxShadow" />
			<select name={name} value={value} onChange={onChange}>
				{options.map(choice =>
					<option key={choice} value={choice} label={choice}>{choice}</option>,
				)}
			</select>
			<div className="arrow">
				<div>▼</div>
			</div>
		</div>
	</div>
