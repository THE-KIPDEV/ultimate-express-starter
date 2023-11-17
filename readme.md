# Ultimate express starter

An ultimate starter for REST API with Express, Typescript, Prisma & PM2.
Based on : https://github.com/ljlm0402/typescript-express-starter

## Installation

To install this application on your computer, follow these steps:


1. Clone repo

   ```bash
   git clone https://github.com/YohannKIPFER/express-node-blog

2. Install dependencies (node v14.18.3)

   ```bash
   npm install

3. Copy .env.example.local to .env.development.local and run migration

   ```bash
   npx prisma migrate dev

4. Run project

   ```bash
   npm run dev
   
## Features 

1. CRUD system for a blog, categories, slug
2. Register / Login / Forgot password / Reset password
3. Public and private media library system
4. Email system with Mailjet and mailService
5. Admin & user role management
6. 2FA system by Authentificator (OTP) or SMS
 
## Environments and DB

.env is just for Prisma
The .env.development.local is to be used locally
You need to create a .env.production.local for production.

MJ_APIKEY_PUBLIC = xxx
MJ_APIKEY_PRIVATE = xxx

To be replaced by API's https://www.mailjet.com/ keys for emails.

TWILIO_ACCOUNT_SID = xxx
TWILIO_AUTH_TOKEN = xxx

To be replaced by API's https://www.twilio.com/en-us keys for SMS 2FA.
   
## Bruno collection

You'll find a Bruno collection in the BrunoCollection folder, which you can open directly with the Bruno API client.

## Author

Kipdev, content creator and developer.

## Buy me a coffee 
https://www.buymeacoffee.com/kipdev