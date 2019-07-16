import {List} from 'immutable'
import React from 'react'
import {CssColor} from '@corgifm/common/shamu-color'
import {Panel} from '../Panel/Panel'
import './Select.less'

interface ISelectProps {
	label: string
	name: string
	onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
	options: List<string>
	value: string
}

export const Select = ({label, name, onChange, options, value}: ISelectProps) =>
	<div className="shamuSelect">
		{/* <label
			htmlFor={name}
			style={{
				position: 'relative',
				top: -1,
			}}>
			{label}
		</label> */}
		<Panel
			className="selectContainer"
			color={CssColor.defaultGray}
		>
			<select name={name} value={value} onChange={onChange}>
				{options.map(choice =>
					<option key={choice} value={choice} label={choice}>{choice}</option>,
				)}
			</select>
			<div className="arrow">
				<div>▼</div>
			</div>
		</Panel>
	</div>
