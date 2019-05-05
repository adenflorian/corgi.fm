import * as React from 'react'
import {useEffect} from 'react'
import {ShamuBorder} from '../Panel/Panel'
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
		<div className={`modal ${className}`} onClick={onHide}>
			<div className="modalPanel" onClick={e => e.stopPropagation()}>
				<div className="modalPanelInner" >
					{children}
				</div>
				<ShamuBorder saturate={false} />
			</div>
		</div>
	)
})
