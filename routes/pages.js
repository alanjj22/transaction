const express = require('express');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/',authController.isLoggedin,(req,res)=>{
    res.render('index',{
        user:req.user,
        send:req.send,
        received: req.received,
        total: req.total
    });
});

router.get('/register',(req,res)=>{
    res.render('register')
});

router.get('/login',(req,res)=>{
    res.render('login')
});


router.get('/transactions',(req,res)=>{
    res.render('transactions')
});



router.get('/profile',authController.isLoggedin,(req,res)=>{
    if(req.user){
        res.render('profile',{
            user: req.user,
        });
    }
    else{
        res.render('login')
    }
});

module.exports = router;