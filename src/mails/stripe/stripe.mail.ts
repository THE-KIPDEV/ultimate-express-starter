import { MailService } from '../../services/mail.service';
const mailService = new MailService();

export async function sendPurchaseConfirmed(email, firstname, lastname, product_name, link) {
  const subject = `${firstname}, merci pour votre achat`;

  const buttonText = 'Voir mon récap';

  const content = `
    <p>Bonjour ${firstname} ${lastname},</p>
    <p>Merci pour votre achat de ${product_name}.</p>
  `;

  const disclaimer = `
 <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
 <p>À bientôt sur KIPDEV !</p>`;

  mailService.sendEmail(email, subject, content, firstname, lastname, link, disclaimer, buttonText);
}

export async function sendSubValidated(email, firstname, lastname, link) {
  const subject = `${firstname}, merci pour votre abonnement`;

  const buttonText = 'Profitez de mon abonnement';

  const content = `
    <p>Bonjour ${firstname} ${lastname},</p>
    <p>Merci pour votre achat, vous pouvez profiter de votre abonnement dès à présent.</p>
  `;

  const disclaimer = `
 <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
 <p>À bientôt sur KIPDEV !</p>`;

  mailService.sendEmail(email, subject, content, firstname, lastname, link, disclaimer, buttonText);
}
