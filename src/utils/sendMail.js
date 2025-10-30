import nodemailer from "nodemailer"


const sendRegistrationMail = async (userEmail , fullname) => {
  try {
    
      const transporter = nodemailer.createTransport({
      service: "gmail", // Use "hotmail", "yahoo", etc. for other services
      auth: {
        user: process.env.MAIL_SENDER_USER,
        pass: process.env.MAIL_PASS_KEY,
      },
      });
    
        await transporter.verify();
        console.log("✅ Mail server is ready to send emails");
    
        const registrationMailOptions = {
        from: process.env.MAIL_SENDER_USER, // Sender
        to:userEmail , // Single or multiple receivers
        subject: "Welcome to VideoTube🎉",
        html: `<h2>Hello ${fullname}, welcome to VideoTube!</h2>
             <p>We’re delighted to have you as part of our growing community.</p>
             <p>Your account is now active, and you can begin exploring our platform’s features anytime.</p>
             <p>If you have any questions, feel free to reach out — we’re here to help.</p>
              <br> <br>
             <b>Best wishes,<br/>VideoTube Support Team</b> `// HTML body
      }
    
    
        const info = await transporter.sendMail(registrationMailOptions);

        console.log("Message sent:  " , info);

  } catch (error) {
    console.error("❌ Failed to send registration mail:", error.message);
    console.error("Full Error:", error);
    return null
  }

}


export { sendRegistrationMail }