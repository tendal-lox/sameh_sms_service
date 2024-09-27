import {samehSmsAuth} from './samehAuth.js';
import RedisService from '../infrastructure/database/redisSetup.js';
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

export default class SmsService {
    constructor() {
      this.redis = new RedisService()
    }

    smsList = async (req, reply) => {
      let samehAccessToken = await this.redis.get("samehAccessToken");

      if (!samehAccessToken) {
        samehAccessToken = await samehSmsAuth({ username: 'samehSmsProvider', password: 'sms12345678910' });
      }
  
      try {
        const fetchResult = await fetch('https://sameh.behdasht.gov.ir/api/v2/sms/updatedList', {
          method: 'GET',
          headers:{
            Authorization: `Bearer ${samehAccessToken}`,
            "Content-Type": "application/json"
          }})
        const {data} = await fetchResult.json()

        await this.redis.setex("samehAccessToken", 4800, samehAccessToken);
  
        return { receivedSmsList: data?.updatedList, samehAccessToken };
      } catch (err) {
        throw new InternalServerErrorException('سرویس سامح در دسترس نیست / خطا در دریافت لیست پیامک ها')
      }
    }
  
    smsSender = async () => {
      const { receivedSmsList, samehAccessToken } = await this.smsList();
  
      console.log(1111111, receivedSmsList);

      if (!receivedSmsList)
        throw new NotFoundException('لیستی جهت ارسال پیامک وجود ندارد')
        // return {statusCode: 404, message: 'لیستی جهت ارسال پیامک وجود ندارد'}
  
      for (const each of receivedSmsList) {
        const text = JSON.parse(each?.body);
  
        console.log(1111111111111, process.env.KAVENEGAR_API_KEY)
  
        // try {
        //   const { data } = await axios({
        //     method: 'get',
        //     url: `https://api.kavenegar.com/v1/${process.env.KAVENEGAR_API_KEY}/verify/lookup.json?receptor=${each?.to}&token=${text.token}&token10=${text.token10}&token20=${text.token20}&template=${each.template}`
        //   });
  
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
        //   console.error(err);
        // }
      }
      return { message: 'API called successfully' };
    }
};