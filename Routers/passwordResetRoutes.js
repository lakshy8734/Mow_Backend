const express = require("express");
const Router = express.Router();
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const user = require("../Model/register");
const nodemailer = require("nodemailer");

// Function to generate a random and strong password
function generateRandomPassword() {
 const length = 12; // You can adjust the length of the password
 const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]\:;"<>,.?/';
 let password = '';
 for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
 }
 return password;
}

// Password reset route with validation
Router.post(
 "/reset-password",
 body("email").isEmail().withMessage("Email is not valid"),
 async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    try {
      console.log("h1");
      // Check if the email exists in your database
      const userExist = await user.findOne({ email: email });
      if (!userExist) {
        return res.status(400).json({ Message: "You have to register first." });
      }

      // Generate a new random and strong password
      const newPassword = generateRandomPassword();
      console.log(newPassword);

      // Update the user's password in the database
      userExist.password = await bcrypt.hash(newPassword, 10);
      await userExist.save();
      console.log("h2");
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      // Send email
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Your New Password",
        text: `Your new password is: ${newPassword}`,
      });

      res
        .status(200)
        .json({ Message: "A new password has been sent to your email." });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ Message: "Internal Server Error at password reset side" });
    }
 }
);

module.exports = Router;