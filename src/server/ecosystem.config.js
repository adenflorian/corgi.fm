module.exports = {
	/**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
	apps: [
		{
			name: 'corgi-fm-server',
			script: 'server.js',
			env_test: {
				NODE_ENV: 'production',
				CORGI_ENV: 'test',
			},
			env_prod: {
				NODE_ENV: 'production',
				CORGI_ENV: 'prod',
			},
		},
	],

	/**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
	// deploy: {
	// 	production: {
	// 		user: 'node',
	// 		host: '212.83.163.1',
	// 		ref: 'origin/master',
	// 		repo: 'git@github.com:repo.git',
	// 		path: '/var/www/production',
	// 		'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
	// 	},
	// 	dev: {
	// 		user: 'node',
	// 		host: '212.83.163.1',
	// 		ref: 'origin/master',
	// 		repo: 'git@github.com:repo.git',
	// 		path: '/var/www/development',
	// 		'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env dev',
	// 		env: {
	// 			NODE_ENV: 'dev',
	// 		},
	// 	},
	// },
}
