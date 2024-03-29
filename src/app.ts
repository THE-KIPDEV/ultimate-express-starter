import 'reflect-metadata';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@config';
import { Routes } from '@interfaces/routes.interface';
import { ErrorMiddleware } from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
import { StripeController } from '@controllers/stripe.controller';

import { verify } from 'jsonwebtoken';
import { SECRET_KEY } from '@config';
import { DataStoredInToken } from '@interfaces/auth.interface';
import { UserController } from '@/controllers/users.controller';

export class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public stripe = new StripeController();
  public user = new UserController();
  public http: any;
  public io: any;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;
    this.http = require('http').createServer(this.app);
    this.io = require('socket.io')(this.http, {
      cors: {
        origin: '*',
      },
    });

    this.app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
      const sig = request.headers['stripe-signature'];

      let event;

      try {
        event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          this.stripe.receivePayment(event);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      response.send();
    });

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeSocket();
    this.initializeUploadsFolder();
  }

  private initializeUploadsFolder() {
    this.app.use(express.static('src/public'));
  }

  public listen() {
    this.http.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public initializeSocket() {
    this.io.on('connection', socket => {
      const token = socket.handshake.headers.access_token;
      const { id } = verify(token, SECRET_KEY) as DataStoredInToken;

      this.user.setSocketId(id, socket.id);
      console.log('user connected', socket.id);

      socket.on('message', (data: any) => {
        console.log(data);
      });

      socket.on('disconnect', () => {
        console.log('user disconnected');
      });
    });
  }

  public getServer() {
    return this.app;
  }

  public getSocketInstance() {
    return this.io;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '1.0.0',
          description: 'Example docs',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(ErrorMiddleware);
  }
}
