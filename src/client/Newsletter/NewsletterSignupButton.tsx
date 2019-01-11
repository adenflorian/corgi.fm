import * as React from 'react'
import {Button} from '../Button/Button'

export const NewsletterSignupButton = () =>
	<Button
		buttonProps={{onClick: () => window.location.pathname = '/newsletter'}}
	>
		Newsletter Signup
	</Button>
