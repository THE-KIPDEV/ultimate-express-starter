import { App } from '@/app';
import { AuthRoute } from '@routes/auth.route';
import { UserRoute } from '@routes/users.route';
import { ArticleRoute } from '@routes/articles.route';
import { CategoryRoute } from '@routes/categories.route';
import { MediaRoute } from '@routes/medias.route';
import { StripeRoute } from '@routes/stripe.route';
import { ValidateEnv } from '@utils/validateEnv';

ValidateEnv();

const app = new App([new UserRoute(), new AuthRoute(), new ArticleRoute(), new CategoryRoute(), new MediaRoute(), new StripeRoute()]);

app.listen();
