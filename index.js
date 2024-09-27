import Fastify from 'fastify'
import dotenv from 'dotenv';
dotenv.config()
import sms from './controller/sms.js'
import RedisService from './infrastructure/database/redisSetup.js';
import { HttpException } from '@nestjs/common';

const fastify = new Fastify({logger: true})

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
  fastify.log.error({
    statusCode,
    message,
    error
  })
})

const start = async () => {
    try {
      await fastify.listen({ port: process.env.PORT })

      new RedisService(process.env.REDIS_PORT, process.env.REDIS_HOSTNAME)
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
}
start()