import * as Koa from 'koa'
import * as Sentry from '@sentry/node'
import {logger} from '@corgifm/common/logger'
import {ValidationError} from 'class-validator'

export const handleError = async (
	ctx: Koa.ParameterizedContext<any, {}>, next: () => Promise<any>
) => {
	try {
		await next()
	} catch (error) {
		if (error[0] instanceof ValidationError) {
			ctx.status = 400
			ctx.body = {
				validationError: error,
			}
		} else {
			Sentry.withScope(scope => {
				scope.addEventProcessor(event => {
					return Sentry.Handlers.parseRequest(event, ctx.request)
				})

				const errorCode = Sentry.captureException(error)

				logger.error('unhandled api error: ', {error, errorCode})

				ctx.status = error.statusCode || error.status || 500

				ctx.body = {
					message: `something borked, here is an error code `
						+ `that the support people might`
						+ `find useful: ${errorCode}`,
				}
			})
		}
	}
}
