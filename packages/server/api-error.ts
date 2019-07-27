import * as Koa from 'koa'
import * as Sentry from '@sentry/node'
import {logger} from '@corgifm/common/logger'
import {CorgiValidationError} from '@corgifm/common/validation'

export const handleError = async (
	ctx: Koa.ParameterizedContext<any, {}>, next: () => Promise<any>
) => {
	try {
		await next()
	} catch (error) {
		if (error instanceof CorgiValidationError) {
			ctx.status = 400
			ctx.body = {
				validationError: error.validationError,
			}
		} else if (error instanceof CorgiBadRequestError) {
			ctx.status = 400
			ctx.body = {
				message: error.message,
			}
		} else if (error instanceof CorgiMethodNotAllowedError) {
			ctx.status = 405
			ctx.body = {}
		} else {
			logger.error('error[0]: ', error[0])
			Sentry.withScope(scope => {
				scope.addEventProcessor(event => {
					return Sentry.Handlers.parseRequest(event, ctx.request)
				})

				const errorCode = Sentry.captureException(error)

				logger.error('unhandled api error: ', {error, errorCode})

				ctx.status = error.statusCode || error.status || 500

				ctx.body = {
					message: `something borked, here is an error code `
						+ `that the support people might `
						+ `find useful: ${errorCode}`,
				}
			})
		}
	}
}

/** Message will be displayed to user */
export class CorgiBadRequestError extends Error {
}

/** Message will be displayed to user */
export class CorgiMethodNotAllowedError extends Error {
}
