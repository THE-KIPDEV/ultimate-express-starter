import { Router } from 'express';
import { StripeController } from '@controllers/stripe.controller';
import { CreateSubscriptionDto } from '@dtos/subscriptions.dto';
import { Routes } from '@interfaces/routes.interface';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '../middlewares/auth.middleware';

export class StripeRoute implements Routes {
  public path = '/stripe';
  public router = Router();
  public stripe = new StripeController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(`${this.path}/subscribe`, AuthMiddleware, ValidationMiddleware(CreateSubscriptionDto), this.stripe.createSubscription);
    this.router.post(`${this.path}/pay`, AuthMiddleware, this.stripe.createPaymentIntent);
    this.router.get(`${this.path}/portal`, AuthMiddleware, this.stripe.getPortalLink);
  }
}
