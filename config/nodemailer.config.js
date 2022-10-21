const { SENDER, SENDER_PASSWORD } = process.env;

async function mailConfig() {
  let config = {
    service: "gmail",
    auth: {
      user: SENDER,
      pass: SENDER_PASSWORD,
    },
  };
  return config;
}

function createMessage(email, otp) {
  let message = {
    from: SENDER,
    to: email,
    subject: "OTP Verification Email",
    text: "YOUR OTP IS: " + otp,
  };
  return message;
}

module.exports = {
  mailConfig,
  createMessage,
};
