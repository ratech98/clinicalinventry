const generateOtp = () => {
    //     const data = Math.random() * 4
    //     console.log('data', data)
    // return Math.floor(Math.random() * 9999) + 1000
    var otp = ''
    for (var i = 0; i < 4; i++) {
        otp += Math.floor(Math.random() * 10)
    }
    return otp
}

module.exports = {generateOtp}
