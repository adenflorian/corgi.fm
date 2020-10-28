import React, {useEffect, useState} from 'react'
import './LoadingScreen.less'
import {noop} from '@corgifm/common/common-utils'

export function LoadingScreen({loading}: {loading: boolean}) {
	const [visible, setVisible] = useState(true)

	useEffect(() => {
		if (loading) {
			setVisible(true)
			return noop
		} else {
			const timeout = setTimeout(() => {
				setVisible(false)
			}, 5000)

			return () => clearTimeout(timeout)
		}
	}, [loading])

	return (
		<div
			className={`loadingScreen ${loading ? 'loading' : ''}`}
			style={{display: loading || visible ? undefined : 'none'}}
		>
			<div className="corgi">corgi.fm</div>
			<div className="message">
				<span className="woof">woofing</span>
				<span className="dot1">.</span>
				<span className="dot2">.</span>
				<span className="dot3">.</span>
			</div>
		</div>
	)
}
