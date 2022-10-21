const otpGenerator = require("otp-generator");

module.exports = async function getSixDigitOTP() {
  let otp = await otpGenerator.generate(6, {
    digits: true,
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};
