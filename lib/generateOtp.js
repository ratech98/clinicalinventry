// Function to generate a 4-digit OTP
const generate4DigitOtp = () => {
    let otp = '';
    for (let i = 0; i < 4; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

const generate6DigitOtp = () => {
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

module.exports = { generate4DigitOtp, generate6DigitOtp };
