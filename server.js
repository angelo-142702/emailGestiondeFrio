const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const emailRouter = require('./routes/email');
const app = express();
//Configuracion de cors
const origin = process.env.ALLOWED_ORIGINS ;
console.log(origin);

const corsOptions = {
    origin:'*',
    methods: ['GET','POST'],
    allwedHeaders: ['Content-Type','Authorization']
};

app.use(cors(corsOptions));
//Rate limiting
app.use(express.json());  // Para parsear application/json
app.use(express.urlencoded({ extended: true }));  // Para parsear application/x-www-form-urlencoded
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    messgae: 'Demasiadas solicitudes desde esta IP, por favor intente mas tarde.'
});
app.use('/api/', limiter);
//Middleware
app.use('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});
//Rutas de email
app.use('/api/email', emailRouter);
//Manejo de errores
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada', path: req.path });
});
//manej de errores global 
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.status || 500;
    const message = err.message || 'Error interno del servidor';
    res.status(statusCode).json({ error: message,
         ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
     });
});
module.exports = app;