const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify} = require('util');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    port: 3307,
    database: process.env.DATABASE
});



exports.register = (req,res) => {
    console.log(req.body);
    
    const { name, email, password, passwordConfirm } = req.body;

    db.query('SELECT email FROM users WHERE email=?',[ email ], async(error,result) => {
            if(error){
                console.log(error);
            }
            
            if(result.length > 0){
                return res.render('register',{
                    message: 'email already registered'
                })
            }
            else if(password != passwordConfirm){
                return res.render('register',{
                    message: 'Passwords do not match'
                });
            }
            let hashedPassword = await bcrypt.hash(password,8);
            console.log(hashedPassword);

            db.query('INSERT INTO users SET ?', {name : name, email : email, password : hashedPassword}, (error,result) => {
                if(error){
                    console.log(error);
                } else {
                    console.log(result);
                    return res.render('register',{
                        message: 'User registered'
                    });
                }
            });

        });
};


exports.login = async(req, res) => {
    try {
        const { email , password} = req.body;
        if(!email || !password){
            return res.status(400).render('login',{
                message : 'Enter an email and password'
            });
        }

        db.query('SELECT * FROM users WHERE email = ?',[ email ], async(error, result) =>{
            if(!result || !(await bcrypt.compare(password, result[0].password)) ){
                res.status(401).render('login',{
                    message: 'Enter valid email or password'
                })
            } else{
                id = result[0].id;

                const token = jwt.sign({ id: id}, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });
                console.log("This is token" + token);

                const cookieoptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES*24*60*60*1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt',token, cookieoptions );
                res.status(200).redirect('/');
            }
        } )

    } catch (error) {
        console.log(error);
    }
}


exports.isLoggedin = async (req, res, next) => {
    if(req.cookies.jwt){
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            console.log(decoded);

            db.query('SELECT * FROM users WHERE id = ?',[ decoded.id ], (error, result) =>{
                if(!result){
                    return next();
                }
                req.user = result[0];
                db.query('SELECT SUM(amount) AS received FROM transactions WHERE received = ?',[ decoded.id ], (error, result) =>{
                    if(!result){
                        return next();
                    }
                    req.received = result[0].received;
                    console.log(req.received);
                    db.query('SELECT SUM(amount) AS send FROM transactions WHERE send = ?',[ decoded.id ], (error, result) =>{
                        if(!result){
                            return next();
                        }
                        req.send = result[0].send;
                        req.total = req.send - req.received;
                        console.log(req.total);
                        console.log(req.send);
                        return next();
                    });
                });  
            }); 
            
        } catch (error) {
            console.log(error);
            return next();
        }
        }
        else{
            next();
    }
}

exports.logout = async (req, res) => {
        res.cookie('jwt', 'logout', {
        expires: new Date(Date.now() + 2*1000),
        httpOnly: true
    });
    res.status(200).redirect('/');
}

exports.transactions = (req,res) => {
    console.log(req.body);
    
    const { sender, recieved , amount } = req.body;

            db.query('INSERT INTO transactions SET ?', {send: sender, received: recieved, amount: amount}, (error,result) => {
                if(error){
                    console.log(error);
                } else {
                    console.log(result);
                    return res.render('transactions',{
                        message: 'Transaction successfull'
                    });
                }
            });
};
