import React, {useCallback} from 'react'
import './TextField.less'

interface Props {
	readonly value: string
	readonly onChange: (value: string) => void
}

export const TextField = function _TextField({
	onChange, value,
}: Props) {
	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value)
	}, [onChange])

	return (
		<div className={`textField`}>
			<input
				type="text"
				max={16}
				onChange={handleChange}
				value={value}
			/>
		</div>
	)
}
