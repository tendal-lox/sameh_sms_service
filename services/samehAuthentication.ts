import axios from 'axios'
import RedisService from "../infrastructure/database/redisSetup.js";
import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

const redis = new RedisService(null, null);

export const samehSmsAuth = async ({username, password}: {username: string, password: string}) => {
  try {
    const axiosResult = await axios({
      method: 'post',
      url: "https://sameh.behdasht.gov.ir/api/v2/user/login",
      data: { username, password },
      headers: { "Content-Type": "application/json" },
      validateStatus: null,
    });
    const { accessToken } = axiosResult.data.data;

    if (!accessToken)
      throw new NotFoundException('خطا در دریافت توکن')

    await redis.setex("samehAccessToken", 4800, accessToken);

    return accessToken;
  } catch (error) {
    console.error(error);

    throw new InternalServerErrorException('سرویس سامح در دسترس نیست / خطای دریافت توکن')
  }
};