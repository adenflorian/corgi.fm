import React from 'react'
import {useEffect} from 'react'
import './Modal.less'

interface Props {
	onHide: () => void
	children: React.ReactNode
	className: string
}

export const Modal = React.memo(function _Modal({onHide, children, className}: Props) {
	const _onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			onHide()
		}
	}

	useEffect(() => {
		window.addEventListener('keydown', _onKeyDown)
		return () => {
			window.removeEventListener('keydown', _onKeyDown)
		}
	})

	return (
		<div className={`modal ${className}`} onMouseDown={onHide}>
			<div className="modalPanel" onMouseDown={e => e.stopPropagation()}>
				<div className="modalPanelInner" >
					{children}
				</div>
			</div>
		</div>
	)
})
