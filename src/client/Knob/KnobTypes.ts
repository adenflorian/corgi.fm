export interface KnobBaseProps {
	label: string
	onChangeId?: any
	readOnly?: boolean
	value: KnobValues
	tooltip: string
}

export type KnobValues = number | string | boolean
