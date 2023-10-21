// You can also use CommonJS `require('@sentry/node')` instead of `import`
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require("@sentry/profiling-node");

const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const socketIo = require('socket.io');
const https = require('https');
const fs = require('fs');

const {createServer} = require("http");

const routes = require('./routes');
const app = express();
const server = createServer(app);

////////////////////////////////
Sentry.init({
    dsn: 'https://144f12f37a8e6d0afb4f81f88461bddd@o4506059481153536.ingest.sentry.io/4506059510972416',
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

////////////////////////////////

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'wpublic')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes);

/////////////////////////
app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});
//////////////////////


app.use(cors({
    origin: 'http://localhost:4200',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
}));

/*
const server = https.createServer({
    key: fs.readFileSync('C:/Users/talis/privatekey.key'),
    cert: fs.readFileSync('C:/Users/talis/certificate.crt')
}, app);

const PORT = 443;
server.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}/news`);
});
*/

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/news`);
});

module.exports = app;
