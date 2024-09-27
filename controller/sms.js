import { samehSmsAuth } from '../services/samehAuth.js'
import SmsService from '../services/sms.js'
import cron from 'node-cron'

const services = new SmsService()

export default function (fastify, opts, done) {
  // cron.schedule('*/10 * * * * *', async () => {
  //   await samehSmsAuth({ username: 'samehSmsProvider', password: 'sms12345678910' });
  // });
  
  fastify.get('/auth', samehSmsAuth);

  fastify.get('/smsList', services.smsList);

  fastify.get('/sendSms', services.smsSender);

  done();
};