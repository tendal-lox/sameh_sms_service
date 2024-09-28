import axios from 'axios';
import RedisService from "../infrastructure/database/redisSetup.js";
import {samehSmsAuth} from './samehAuthentication.js'
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import async from 'async';

export default class SmsService {
  private smsRedis: any

  constructor() {
    this.smsRedis = new RedisService(null, null)
  }
  
  smsListAccess = async (req: any, reply: any) => {
    let samehAccessToken: string = await this.smsRedis.get("samehAccessToken");

    if (!samehAccessToken) {
      samehAccessToken = await samehSmsAuth({ username: `${process.env.USERNAME}`, password: `${process.env.PASSWORD}` });
    }

    try {
      const fetchResult = await fetch('https://sameh.behdasht.gov.ir/api/v2/sms/updatedList', {
        method: 'GET',
        headers:{
          Authorization: `Bearer ${samehAccessToken}`,
          "Content-Type": "application/json"
        }})
      const {data} = await fetchResult.json()

      return { receivedSmsList: data?.updatedList, samehAccessToken };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('سرویس سامح در دسترس نیست / خطا در دریافت لیست پیامک ها')
    }
  }

  smsSender = async (req: any, reply: any) => {
    const { receivedSmsList, samehAccessToken } = await this.smsListAccess(req, reply);

    if (!receivedSmsList[0])
      throw new NotFoundException('لیستی جهت ارسال پیامک وجود ندارد')

    const q = async.queue(async (task: any, cb: Function) => {

      console.log(11111111, task)
      // const text = JSON.parse(task.each?.body);

      // console.log(123123123)

      // try {
      //   const result = await axios({
      //     method: 'get',
      //     url: `https://api.kavenegar.com/v1/${process.env.KAVENEGAR_API_KEY}/verify/lookup.json?receptor=${each?.to}&token=${text.token}&token10=${text.token10}&token20=${text.token20}&template=${each.template}`,
      //     validateStatus: null
      //   });
      //   const data = result?.data

      //   if (!data.entries)
      //     throw new NotFoundException(data.return)

      //   if (data.entries[0].status === 5 && data.entries[0].statustext === 'ارسال به مخابرات') {
      //     // API from sameh that update sms status to 2
      //     await axios({
      //       method: 'put',
      //       url: 'https://sameh.behdasht.gov.ir/api/v2/sms/updateSmsStatus',
      //       data: { smsId: each.id },
      //       headers: {
      //         Authorization: `Bearer ${samehAccessToken}`,
      //         "Content-Type": "application/json"
      //       }
      //     });
      //   }
      // } catch (err) {
      //   console.error(err)
      //   throw new InternalServerErrorException(err)
      // }

      cb()
    }, 2)
    await q.drain()

    q.error((err, task) => {
      console.error(err, task);
      throw new InternalServerErrorException(err)
    });

    q.push(receivedSmsList, (err) => {
      console.log('Inejecting receivedSmsList successfully done');
    });

    // async.mapLimit(receivedSmsList, 10, async (each: any, cb: Function) => {
    //   const text = JSON.parse(each?.body);

    //   console.log(123123123)

    //   try {
    //     const result = await axios({
    //       method: 'get',
    //       url: `https://api.kavenegar.com/v1/${process.env.KAVENEGAR_API_KEY}/verify/lookup.json?receptor=${each?.to}&token=${text.token}&token10=${text.token10}&token20=${text.token20}&template=${each.template}`,
    //       validateStatus: null
    //     });
    //     const data = result?.data

    //     if (!data.entries)
    //       throw new NotFoundException(data.return)

    //     if (data.entries[0].status === 5 && data.entries[0].statustext === 'ارسال به مخابرات') {
    //       // API from sameh that update sms status to 2
    //       await axios({
    //         method: 'put',
    //         url: 'https://sameh.behdasht.gov.ir/api/v2/sms/updateSmsStatus',
    //         data: { smsId: each.id },
    //         headers: {
    //           Authorization: `Bearer ${samehAccessToken}`,
    //           "Content-Type": "application/json"
    //         }
    //       });
    //     }
    //   } catch (err) {
    //     console.error(err)
    //     throw new InternalServerErrorException(err)
    //   }

    //   cb(null)
    // })

    return { message: 'پیامک ها با موفقیت ارسال شدند' };
  }
};