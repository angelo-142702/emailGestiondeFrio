const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

//validacion de email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
//Coniguracion del transporter de nodemailer
const createTransporter = () => {
    return nodemailer.createTransport({ 
        service:process.env.email_SERVICE || 'gmail',
        auth: {
            user:process.env.EMAIL_USER,
            pass:process.env.EMAIL_PASS
        }
    });
}
//ruta para enviar email
router.post('/send', async (req, res, next) => {
    try {
          // Verificar si req.body existe
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: 'Cuerpo de la solicitud vacío o no proporcionado'
      });
    }
        const{
            name,
            email,
            phone,
            message,
            asunto = 'Gestion de Frio',
            destino = process.env.DESTINATION_EMAIL
        } = req.body;
        //validacion de campos
        if(!name || !email || !message){
            return res.status(400).json({ error: 'Nombre, email y mensaje son obligatorios.'});
        }
        if(!isValidEmail(email)){
            return res.status(400).json({ error: 'Formato de email invalido.'});
        }
        if (destino && !isValidEmail(destino)) {
            return res.status(400).json({ error: 'Formato de email destino invalido.'});    
        }
        //Crear el contenido del email
        const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: destino,
      subject: asunto,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1109a5ff; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 20px; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #1107c5ff; }
            .field-value { margin-top: 5px; padding: 10px; background-color: white; border-radius: 3px; border-left: 4px solid #4F46E5; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Gestion de frío</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="field-label">Nombre:</div>
                <div class="field-value">${name}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Email:</div>
                <div class="field-value">${email}</div>
              </div>
              
              ${phone ? `
              <div class="field">
                <div class="field-label">Teléfono:</div>
                <div class="field-value">${phone}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="field-label">Mensaje:</div>
                <div class="field-value">${message.replace(/\n/g, '<br>')}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Fecha y Hora:</div>
                <div class="field-value">${new Date().toLocaleString()}</div>
              </div>
            </div>
            <div class="footer">
              <p>Este mensaje fue enviado desde el formulario de contacto de tu sitio web.</p>
              <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Nuevo mensaje del formulario de contacto:
        
        Nombre: ${name}
        Email: ${email}
        ${phone ? `Teléfono: ${phone}` : ''}
        Mensaje: ${message}
        
        Fecha y hora: ${new Date().toLocaleString()}
      `
    };
        //Enviar el email
        const transporte = createTransporter();
        const info = await transporte.sendMail(mailOptions);
        console.log('Email enviado: ' + info.response);
        res.json({ message: 'Mensaje enviado correctamente.', success: true , message: info.messageId});
    }catch (error) {
        console.error('Error al enviar el email:', error);
        //manejar errores especiicos de nodemailer
        if (error.code === 'EAUTH') {
            return res.status(500).json({ error: 'Error de autenticación con el servicio de email.'});
        }
        res.status(500).json({ error: 'Error al enviar el mensaje. Por favor intente nuevamente mas tarde.',
            details:process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;