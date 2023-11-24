import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { Subscription } from '@interfaces/subscriptions.interface';
import { StripeService } from '@services/stripe.service';

export class StripeController {
  public stripe = Container.get(StripeService);

  public createSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subscriptionData: Subscription = req.body;
      const createSubscriptionData: Subscription = await this.stripe.createSubscription(subscriptionData, req.user);

      res.status(201).json({ data: createSubscriptionData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createPaymentIntentData = await this.stripe.createPaymentIntent(req.user);

      res.status(201).json({ data: createPaymentIntentData, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public receivePayment = async (event: any): Promise<void> => {
    await this.stripe.receivePayment(event);
  };

  public getPortalLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const portalLink = await this.stripe.getPortalLink(req.user);

      res.status(200).json({ data: portalLink, message: 'portalLink' });
    } catch (error) {
      next(error);
    }
  };
}
