import React, {useCallback} from 'react'
import './ButtonSelect.less'

interface Props<T> {
	readonly options: ButtonSelectOptions<T>
	readonly selectedOption?: ButtonSelectOption<T>
	readonly onNewSelection: (newSelection: ButtonSelectOption<T>) => void
}

export type ButtonSelectOptions<T> = readonly ButtonSelectOption<T>[]

export interface ButtonSelectOption<T> {
	readonly label: string
	readonly value: string
	readonly object?: T
}

export const ButtonSelect = function _ButtonSelect<T>({options, onNewSelection, selectedOption}: Props<T>) {
	const handleOptionClick = useCallback((e: React.MouseEvent, option: ButtonSelectOption<T>) => {
		onNewSelection(option)
	}, [onNewSelection])

	return (
		<div className="buttonSelect vertical">
			{options.map(option => {
				return (
					<Option
						key={option.value}
						option={option}
						isSelected={option === selectedOption}
						onClick={handleOptionClick}
					/>
				)
			})}
		</div>
	)
}

interface OptionProps<T> {
	readonly option: ButtonSelectOption<T>
	readonly isSelected: boolean
	readonly onClick: (e: React.MouseEvent, option: ButtonSelectOption<T>) => void
}

function Option<T>(props: OptionProps<T>) {
	const {option, isSelected, onClick} = props

	const handleOptionClick = useCallback((e: React.MouseEvent) => {
		onClick(e, option)
	}, [onClick, option])

	return (
		<div
			className={`option ${isSelected ? 'selected' : ''}`}
			onClick={handleOptionClick}
		>
			{option.label}
		</div>
	)
}
