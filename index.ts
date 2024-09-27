import Fastify from 'fastify'
import sms from './routes/sms.js'
import fastifyEnv from '@fastify/env'
import { HttpException } from '@nestjs/common';
import RedisService from './infrastructure/database/redisSetup.js'

const fastify = Fastify({logger: true})

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number,
      REDIS_HOSTNAME: string,
      REDIS_PORT: number,
      KAVENEGAR_API_KEY: string
    };
  }
}

const options = {
  schema: {
    type: 'object',
    required: ['PORT', 'REDIS_HOSTNAME', 'REDIS_PORT', 'KAVENEGAR_API_KEY'],
    properties: {
      PORT: {
        type: 'number',
        default: 3000
      },
      REDIS_HOSTNAME: {
        type: 'string'
      },
      REDIS_PORT: {
        type: 'number'
      },
      KAVENEGAR_API_KEY: {
        type: 'string'
      }
    }
  },
  dotenv: true,
  data: process.env,
}

const initialize = async () => {
  fastify.register(fastifyEnv, options)
  fastify.register(sms, { prefix: '/sms' })
  
  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpException) {
      const statusCode = error.getStatus();
      const message = error.message;
  
      reply.status(statusCode).send({
        statusCode,
        message,
        error: error.name
      });
    } else {
      reply.status(500).send({
        statusCode: 500,
        message: 'Internal Server Error',
        error: error.message || 'Something went wrong'
      });
    }
  });
}

initialize().then(_ => {
  (async () => {
    try {
      await fastify.ready()
      await fastify.listen({ port: fastify.config.PORT })

      new RedisService(fastify.config.REDIS_PORT, fastify.config.REDIS_HOSTNAME)
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  })()
})