const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const webRoutes = require('./routes/web.routes');
const masterRtRwRoutes = require('./routes/masterRtRw.routes');
const muzakkiRoutes = require('./routes/muzakki.routes');
const mustahikRoutes = require('./routes/mustahik.routes');
const distribusiRoutes = require('./routes/distribusi.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const laporanRoutes = require('./routes/laporan.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ message: 'SiZakat API is healthy' });
});

app.use('/', webRoutes);
app.use('/auth', authRoutes);
app.use('/api/master/rt-rw', masterRtRwRoutes);
app.use('/api/muzakki', muzakkiRoutes);
app.use('/api/mustahik', mustahikRoutes);
app.use('/api/distribusi', distribusiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/laporan', laporanRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
