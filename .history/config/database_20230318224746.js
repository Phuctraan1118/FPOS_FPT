const mogoose = require('mongoose')

const { DB_CON_STRING } = process.env

module.exports = () => {
    // mogoose.connect("mongodb://localhost/ecommerce")
    mogoose.connect("mongodb+srv://hquanghoa25092001:ohMongodb0701m@cluster0.k8hw2zc.mongodb.net/easybuy?retryWrites=true&w=majority")
        .then(() => console.log('DB Connection Successfull'))
        .catch(err => console.log(err.message))
}