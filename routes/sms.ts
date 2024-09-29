import { samehSmsAuth } from '../services/samehAuthentication.js'
import SmsService from '../services/smsService.js'
import cron from 'node-cron'

const services = new SmsService()

export default function (fastify: any, opts: any, done: any) {
  cron.schedule('* */2 * * * *', async () => {
    await services.smsSender(fastify.req, fastify.reply)
  });
  
  fastify.get('/auth', samehSmsAuth);

  fastify.get('/smsList', services.smsListAccess);

  fastify.get('/sendSms', services.smsSender);

  done();
};