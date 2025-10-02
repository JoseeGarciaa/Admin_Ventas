import express from 'express';
import path from 'path';
import url from 'url';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import flash from 'connect-flash';
import expressLayouts from 'express-ejs-layouts';

import indexRoutes from './routes/index.js';
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { attachUser } from './middleware/auth.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({ secret: 'admin-ventas-secret', resave: false, saveUninitialized: true }));
app.use(flash());
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.flash = (type) => {
    if (!type) return { success: req.flash('success'), error: req.flash('error') };
    return req.flash(type);
  };
  next();
});

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/tenants', tenantRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
