import React, {useCallback} from 'react'
import './TextArea.less'

interface Props {
	readonly value: string
	readonly onChange: (value: string) => void
	readonly containerStyle?: React.CSSProperties
	readonly textareaStyle?: React.CSSProperties
}

export const TextArea = function _TextArea({
	onChange, value, containerStyle, textareaStyle,
}: Props) {
	const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
		onChange(e.target.value)
	}, [onChange])

	return (
		<div className={`textArea`} style={{...containerStyle}}>
			<textarea
				maxLength={2048}
				onChange={handleChange}
				value={value}
				style={{...textareaStyle}}
			/>
		</div>
	)
}
