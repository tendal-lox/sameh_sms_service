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

  bulkUpdateSmsStatus = async ({results, samehAccessToken}: {results: any, samehAccessToken: string}) => {
    await axios({
      method: 'put',
      url: 'https://sameh.behdasht.gov.ir/api/v2/sms/updateSmsStatus',
      data:  { results },
      headers: {
        Authorization: `Bearer ${samehAccessToken}`,
        "Content-Type": "application/json"
      },
      validateStatus: null,
    })
  }

  smsSender = async (req: any, reply: any) => {
    const { receivedSmsList, samehAccessToken } = await this.smsListAccess(req, reply);

    if (!receivedSmsList[0]) {
      console.log('لیستی جهت ارسال پیامک وجود ندارد')
      throw new NotFoundException('لیستی جهت ارسال پیامک وجود ندارد')
    }

    try {
      const results = await async.mapLimit(receivedSmsList, 10, async (each: any, cb: any) => {
        const text = JSON.parse(each?.body);

        axios({
          method: 'get',
          url: `https://api.kavenegar.com/v1/${process.env.KAVENEGAR_API_KEY}/verify/lookup.json?receptor=${each?.to}&token=${text.token}&token10=${text.token10}&token20=${text.token20}&template=${each.template}`,
          validateStatus: null
        }).then(async result => {
          const data = result?.data

          if (!data.entries)
            cb(null, {id: +each.id, status: 3, result: (data?.return?.message).toString()})

          if (data.entries[0].status === 5 && data.entries[0].statustext === 'ارسال به مخابرات') {
            cb(null, {id: +each.id, status: 2, result: (data.entries[0]?.messageid).toString()})
          }
        }).catch(err => {
          console.error(err)
          throw new InternalServerErrorException(err)
        })
      })

      await this.bulkUpdateSmsStatus({results, samehAccessToken})

      console.log('Messages status', results)

      console.log('پیامک ها با موفقیت ارسال شدند')
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException(err)
    }

    return {message: 'پیامک ها با موفقیت ارسال شدند'};
  }
};