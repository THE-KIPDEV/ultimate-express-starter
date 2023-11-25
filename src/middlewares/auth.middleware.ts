import { PrismaClient } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/httpException';
import { DataStoredInToken, RequestWithUser } from '@interfaces/auth.interface';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const getAuthorization = req => {
  const coockie = req.cookies['Authorization'];
  if (coockie) return coockie;

  const header = req.header('Authorization');
  if (header) return header.split('Bearer ')[1];

  return null;
};

export const AuthMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = getAuthorization(req);

    if (Authorization) {
      const { id } = (await verify(Authorization, SECRET_KEY)) as DataStoredInToken;
      const users = new PrismaClient().user;
      const subscription = new PrismaClient().subscriptions;
      const findUser = await users.findUnique({ where: { id: Number(id) } });

      if (findUser) {
        const findSubscription = await subscription.findFirst({ where: { user_id: Number(findUser.id), sub_id: { not: { equals: null } } } });

        if (findSubscription) {
          const subId = findSubscription.sub_id;
          const stripeSub = await stripe.subscriptions.retrieve(subId);
          const status = stripeSub.status;
          if (status === 'canceled') {
            await subscription.update({ where: { id: findSubscription.id }, data: { status: 'canceled' } });
            findUser.subscription = null;
          }

          if (status === 'active') {
            await subscription.update({ where: { id: findSubscription.id }, data: { status: 'active' } });
            findUser.subscription = stripeSub;
          }
        }

        console.log(findUser);

        req.user = findUser;

        next();
      } else {
        next(new HttpException(401, 'Wrong authentication token'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing'));
    }
  } catch (error) {
    console.log(error);
    next(new HttpException(401, 'Wrong authentication token'));
  }
};
