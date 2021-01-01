const nodemailer = require('nodemailer');

//Settingup access to .env file from root folder
const path = require('path');
const dotenv = require('dotenv').config({path: path.resolve(__dirname, './.env') })

//----------------------------------------------------
//https://nodemailer.com/about/
//transporter = service that actually sends the email
//service - Gmail,Yahoo,sendGrid,mailGun etc.., Activate in Gmail(service) - less secure app option
//auth - user, pass
//----- FOR Email Testing -----
//https://mailtrap.io/
//fake emailer - mailtrap -> email testing => fakes to send email but in actual email are trap in mailtrap inbox
//mailtrap - create project -> settings -> integrations -> credentials => host port username password
//----------------------------------------------------

//==================================
// SENDING EMAIL'S USING nodemailer
//==================================
//async - await func => return promises
//ERRORS handled in -> 
const sendEmail = async(options)=>{
    
    //1) CREATE a Transporter Object
    const transporter = nodemailer.createTransport({
        //service: 'gmail', 'yahoo' etc  -> allow turn less secure app = true(in gmail)

        //getting fields from mailtrap
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth:{
            user: process.env.EMAIL_USERNAME,  
            pass: process.env.EMAIL_PASSWORD
        },
        
        //debug: true, // show debug output
        //logger: true // log information in console
    });

    //2) Define Email Options
    const mailOptions = {   
        from: 'Test email  👻 <test@emails.io>',    //app_Official-email_handler - who sends emails
        to: options.email,                         //user whom the email is sent to
        subject: options.subject,                  //Email subject
        text: options.message                      //Email message
        //html: 'conveting message to html'  
    };

    //3) Actually SENDING Email
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;