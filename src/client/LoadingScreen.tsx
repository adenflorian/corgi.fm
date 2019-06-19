import React from 'react'
import './LoadingScreen.less'

export function LoadingScreen({loading}: {loading: boolean}) {
	return (
		<div className={`loadingScreen ${loading ? 'loading' : ''}`}>
			<div className="corgi">corgi.fm</div>
			<div className="message">woofing</div>
		</div>
	)
}
