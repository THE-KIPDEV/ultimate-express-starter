import { MailService } from '../../services/mail.service';
import dayjs from 'dayjs';
const mailService = new MailService();
require('dayjs/locale/fr');
export async function sendMailForgetPassword(email, firstname, lastname, link, passwordTokenExpires) {
  const subject = `${firstname}, réintialisez votre mot de passe ! 🔒`;

  const buttonText = 'Réinitialiser mon mot de passe';

  const date = dayjs(passwordTokenExpires).locale('fr').format('dddd DD MMMM YYYY à HH:mm');

  const content = `
    <p>Bonjour ${firstname} ${lastname},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Le lien est valide jusqu'à ${date}.</p>
    <p>Pour cela, cliquez sur le lien ci-dessous :</p>
  `;

  const disclaimer = `
 <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
 <p>À bientôt sur KIPDEV !</p>`;

  mailService.sendEmail(email, subject, content, firstname, lastname, link, disclaimer, buttonText);
}

export async function sendMailPasswordReset(email, firstname, lastname, link) {
  const subject = `${firstname}, votre mot de passe a été changé ! 🔒`;

  const buttonText = 'Se connecter';

  const content = `
    <p>Bonjour ${firstname} ${lastname},</p>
    <p>Vous avez bien modifié votre mot de passe.</p>
    <p>Si vous n'êtes pas à l'origine de la demande, merci de contacter yohann@kipdev.io.</p>
  `;

  const disclaimer = `
 <p>À bientôt sur KIPDEV !</p>`;

  mailService.sendEmail(email, subject, content, firstname, lastname, link, disclaimer, buttonText);
}
