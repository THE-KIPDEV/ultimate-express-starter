import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';
import { CreateSubscriptionDto } from '@dtos/subscriptions.dto';
import { HttpException } from '@/exceptions/httpException';
import { Subscription } from '@interfaces/subscriptions.interface';
import { User } from '@interfaces/users.interface';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { sendSubValidated, sendPurchaseConfirmed } from '@mails/stripe/stripe.mail';
import { PaymentsIntent } from '@/interfaces/paymentIntent.interface';

@Service()
export class StripeService {
  public subscription = new PrismaClient().subscriptions;
  public paymentIntent = new PrismaClient().paymentsIntent;
  public user = new PrismaClient().user;

  public async createPaymentIntent(user: User): Promise<string> {
    try {
      const customerId = user.customer_id_stripe;

      const session = await stripe.checkout.sessions.create({
        success_url: `${process.env.FRONT_END}/payment/success`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: 2000,
              product_data: {
                name: 'T-shirt',
                description: 'Comfortable cotton t-shirt',
                images: ['https://example.com/t-shirt.png'],
              },
            },
          },
        ],
        mode: 'payment',
        customer: customerId ? customerId : null,
      });

      await this.paymentIntent.create({
        data: {
          user_id: user.id,
          session_stripe: session.id,
          customer_id: customerId ? customerId : null,
          product: 't-shirt',
        },
      });

      return session.url;
    } catch (error) {
      throw new HttpException(500, error.message);
    }
  }

  public async createSubscription(subscriptionData: CreateSubscriptionDto, user: User): Promise<string> {
    try {
      let price;
      if (subscriptionData.periodicity === 'monthly') {
        price = process.env.STRIPE_MONTHLY_PRICE;
      }

      if (subscriptionData.periodicity === 'yearly') {
        price = process.env.STRIPE_YEARLY_PRICE;
      }

      const customerId = user.customer_id_stripe;

      const session = await stripe.checkout.sessions.create({
        success_url: `${process.env.FRONT_END}/subscribe/success`,
        line_items: [{ price, quantity: 1 }],
        mode: 'subscription',
        customer: customerId ? customerId : null,
      });

      await this.subscription.create({
        data: {
          periodicity: subscriptionData.periodicity,
          user_id: user.id,
          session_stripe: session.id,
          status: 'pending',
          customer_id: customerId ? customerId : null,
        },
      });

      return session.url;
    } catch (error) {
      throw new HttpException(500, error.message);
    }
  }

  public async receivePayment(event) {
    const session = event.data.object;

    if (session.mode === 'payment') {
      const sessionId = session.id;
      const customerId = session.customer;
      const paymentId = session.payment_intent;

      // get payment intent
      const paymentIntent = await this.paymentIntent.findUnique({ where: { session_stripe: sessionId } });

      if (!paymentIntent) {
        throw new HttpException(500, 'Payment intent not found');
      }

      await this.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { customer_id: customerId, payment_id: paymentId },
      });

      const user = await this.user.findUnique({ where: { id: paymentIntent.user_id } });

      await this.user.update({
        where: { id: user.id },
        data: { customer_id_stripe: customerId },
      });

      await sendPurchaseConfirmed(user.email, user.first_name, user.last_name, paymentIntent.product, process.env.FRONT_END);
    } else if (session.mode === 'subscription') {
      const sessionId = session.id;
      const customerId = session.customer;
      const subId = session.subscription;

      // get subscription
      const subscription = await this.subscription.findUnique({ where: { session_stripe: sessionId } });

      if (!subscription) {
        throw new HttpException(500, 'Subscription not found');
      }

      await this.subscription.update({
        where: { id: subscription.id },
        data: { status: 'active', customer_id: customerId, sub_id: subId },
      });

      // get user
      const user = await this.user.findUnique({ where: { id: subscription.user_id } });

      await this.user.update({
        where: { id: user.id },
        data: { customer_id_stripe: customerId },
      });

      await sendSubValidated(user.email, user.first_name, user.last_name, process.env.FRONT_END);
    }
  }

  public async getPortalLink(user: User): Promise<string> {
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.customer_id_stripe,
    });

    return portal.url;
  }
}
