import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import dotenv from "dotenv";
// import ENV from "../config.js";
dotenv.config();
//https://ethereal.email/create
/**
  let nodeConfig = {
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: ENV.EMAIL, // generate ethereal user
    pass: ENV.PASSWORD, //generated ethereal password
  },
};
 */

//gmail
let nodeConfig = {
  service: "gmail",
  secure: "true",
  port: 465,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
};

let transporter = nodemailer.createTransport(nodeConfig);

let MailGenerator = new Mailgen({
  theme: "cerberus",
//   theme: "default",
  product: {
    name: "Mailgen",
    link: "https://mailgen.js",
  },
});

/** POST: http://localhost:8080/api/registerMail 
 * @param: {
  "userEmail" : "abc@gmail.com",
  "text" : "",
  "subject" : ""
}
*/
export const registerMail = async (req, res) => {
  const { userEmail, text, subject } = req.body;

  //body of the email
  var email = {
    body: {
      name: userEmail,
      intro: text || "Welcome Buddy",
      outro:
        "Congratulations !! You have Successful registered.",
    },
  };

  var emailBody = MailGenerator.generate(email);

  let message = {
    from: process.env.EMAIL,
    to: userEmail,
    subject: subject || "Signup Successful",
    html: emailBody,
  };

  //send mail
  transporter
    .sendMail(message)
    .then(() => {
      return res
        .status(200)
        .send({ msg: "You should recive an email from us." });
    })
    .catch((error) => res.status(500).send({ error }));
};