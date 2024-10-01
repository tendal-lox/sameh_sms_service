import { samehSmsAuth } from '../services/samehAuthentication.js'
import SmsService from '../services/smsService.js'
import cron from 'node-cron'

const services = new SmsService()

export default function (fastify: any, opts: any, done: any) {
  let cronSchedule = `*/2 * * * * *`

  cron.schedule(cronSchedule, async () => {
    // const {changeCronSchedule} = await services.smsSender(fastify.req, fastify.reply)

    console.log(111111111111, cronSchedule)
    const changeCronSchedule = true
    changeCronSchedule ? cronSchedule = `*/10 * * * * *` : null
  });
  
  fastify.get('/auth', samehSmsAuth);

  fastify.get('/smsList', services.smsListAccess);

  fastify.get('/sendSms', services.smsSender);

  done();
};