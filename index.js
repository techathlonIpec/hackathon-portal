const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')


// Load configuration from dotenv
dotenv.config()

// Making App Instance
const app = express()

// Setting the app
app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (request,response)=>{
    response.render('index.ejs')
})
app.listen(process.env.PORT, ()=>{
    console.log(`Server is listening on Port ${process.env.PORT}`)
})