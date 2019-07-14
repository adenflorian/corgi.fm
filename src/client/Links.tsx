import React from 'react'
import {
	FaDiscord as DiscordIcon, FaPatreon as PatreonIcon,
} from 'react-icons/fa'
import {
	IoMdMail as MailIcon,
} from 'react-icons/io'
import {IconType} from 'react-icons/lib/iconBase'
import {ButtonLink} from './Button/ButtonLink'

export function DiscordLink() {
	return getLink('https://discord.gg/qADwrxd', 'Discord', DiscordIcon, '#7289DA')
}

export function NewsletterLink() {
	return getLink('/newsletter', 'Newsletter', MailIcon)
}

export function PatreonLink() {
	return getLink('https://www.patreon.com/corgifm', 'Patreon', PatreonIcon, '#f96854')
}

function getLink(url: string, label: string, Icon: IconType, backgroundColor?: string) {
	return (
		<ButtonLink href={url} newTab={true} >
			<Icon
				style={{
					marginRight: 8,
					backgroundColor,
				}}
			/>
			<span>{label}</span>
		</ButtonLink>
	)
}
