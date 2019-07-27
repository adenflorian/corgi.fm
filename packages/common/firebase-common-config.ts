/* cspell: disable */
// Not secret, since it goes in the client
export const firebaseCommonConfigs: Config = {
	local: {
		projectId: 'corgifm-local',
	},
	test: {
		projectId: 'corgifm-test',
	},
	prod: {
		projectId: 'corgifm-prod',
	},
}
/* cspell: enable */

export interface Config {
	local: Record<string, string>
	test: Record<string, string>
	prod: Record<string, string>
}
