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

  bulkUpdateSmsStatus = async ({id, samehAccessToken}: {id: number, samehAccessToken: string}) => {
    const cargo = async.cargo(async (tasks, cb) => {
      console.log(4444444, tasks)
      await new Promise<void>((res) => {
        console.log('hellllllllllllloooooooooooo')
        res()
      })
      // await axios({
      //   method: 'put',
      //   url: 'https://sameh.behdasht.gov.ir/api/v2/sms/updateSmsStatus',
      //   data: { smsId: tasks },
      //   headers: {
      //     Authorization: `Bearer ${samehAccessToken}`,
      //     "Content-Type": "application/json"
      //   }
      // })
      cb()
    }, 10)

    await cargo.push(id)
  }

  smsSender = async (req: any, reply: any) => {
    const { receivedSmsList, samehAccessToken } = await this.smsListAccess(req, reply);

    if (!receivedSmsList[0]) {
      console.log('لیستی جهت ارسال پیامک وجود ندارد')
      throw new NotFoundException('لیستی جهت ارسال پیامک وجود ندارد')
    }

    try {
      await async.eachLimit(receivedSmsList, 10, async (each: any, cb: Function) => {
        const text = JSON.parse(each?.body);

        await this.bulkUpdateSmsStatus({id: +each.id, samehAccessToken})

        // axios({
        //   method: 'get',
        //   url: `https://api.kavenegar.com/v1/${process.env.KAVENEGAR_API_KEY}/verify/lookup.json?receptor=${each?.to}&token=${text.token}&token10=${text.token10}&token20=${text.token20}&template=${each.template}`,
        //   validateStatus: null
        // }).then(async result => {
        //   const data = result?.data
        //
        //   // if (data.return.status === 418)
        //
        //   console.log(111111111, data)
        //
        //   if (!data.entries)
        //     throw new NotFoundException(data.return)
        //
        //   if (data.entries[0].status === 5 && data.entries[0].statustext === 'ارسال به مخابرات') {
        //     await this.updateSmsStatus({id: +each.id, samehAccessToken})
        //   }
        //
        //   cb()
        // }).catch(err => {
        //   console.error(err)
        //   throw new InternalServerErrorException(err)
        // })
      })

      console.log('پیامک ها با موفقیت ارسال شدند')
    } catch (err) {
      console.error(err)
      throw new InternalServerErrorException(err)
    }

    return {message: 'پیامک ها با موفقیت ارسال شدند'};
  }
};