const express = require('express');
const mysql = require('mysql');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

app.use(express.urlencoded({ extended : false}));

app.use(express.json());
app.use(cookieParser());

app.set('view engine','hbs');

dotenv.config({ path : './.env'});

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: 3307,
    database: process.env.DATABASE
});

db.connect((err)=>{
    if(err){
        console.log(err);
    }
    else{
        console.log("connected");
    } 
})

app.use('/',require('./routes/pages'));
app.use('/auth',require('./routes/auth'));



app.listen(5000,()=>{
    console.log("running");
})