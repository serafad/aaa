const express = require("express");
const depositRouter = express.Router();
const passport = require("passport");
const passportConfig = require("../passport");
const JWT = require("jsonwebtoken");
const User = require("../models/User");
const Company = require("../models/Companyinfo");
const Deposit = require("../models/deposit");
const Level = require("../models/level");
const Autopool = require("../models/autopool");
const Ledger = require("../models/ledger");
const Matrix = require("../models/matrix");
const Withdraw = require("../models/withdraw");
const mongoose = require("mongoose");
const TronWeb = require('tronweb')
const Constant = require("../models/constant");
const HttpProvider = TronWeb.providers.HttpProvider; // This provider is optional, you can just use a url for the nodes instead
const fullNode = new HttpProvider('https://api.trongrid.io'); // Full node http endpoint
const solidityNode = new HttpProvider('https://api.trongrid.io'); // Solidity node http endpoint
const eventServer = 'https://api.trongrid.io/'; // Contract events http endpoint

const privateKey = 'e76561249ccd55b7b18027a231e212e666464240766b612082505071ba16e272';

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": '1580da2c-063d-46a5-b1e3-814998853c1c' },
    privateKey: 'e76561249ccd55b7b18027a231e212e666464240766b612082505071ba16e272'
});

depositRouter.post('/depositdetail',(req,res)=>{
    const id = req.body.id;
    Deposit.find({"userId":id},(err,deposit)=>{
        if(err){
            return(err)
        }else{
            res.status(200).json({
                message: { msgBody: "User Sucessfully Updated", msgError: false,deposit:deposit},
              });
        }
    })
})
depositRouter.post('/level_detail',(req,res)=>{
    const id = req.body.id;
    Level.find({"userId":id},(err,level)=>{
        if(err){
            return(err)
        }else{
            res.status(200).json({
                message: { msgBody: "User Sucessfully Updated", msgError: false,level:level},
              });
        }
    })
})

depositRouter.post('/matrix_detail',(req,res)=>{
    const id = req.body.id;
    Matrix.find({"userId":id},(err,level)=>{
        if(err){
            return(err)
        }else{
            res.status(200).json({
                message: { msgBody: "User Sucessfully Updated", msgError: false,level:level},
              });
        }
    })
})
depositRouter.post('/auto_detail',async(req,res)=>{
    const id = req.body.id;
    Autopool.find({"userId":id},(err,level)=>{
        if(err){
            return(err)
        }else{
            res.status(200).json({
                message: { msgBody: "User Sucessfully Updated", msgError: false,level:level},
              });
        }
    })
})
depositRouter.post('/withd',async(req,res)=>{
    const id = req.body.id;
    Withdraw.find({"userId":id},(err,level)=>{
        if(err){
            return(err)
        }else{
            console.log(level)
            res.status(200).json({
                message: { msgBody: "User Sucessfully Updated", msgError: false,level:level},
              });
        }
    })
})

depositRouter.post('/withdraw',(req,res)=>{
    console.log(req.body);
    User.findOne({'_id':req.body.id},(err,user)=>{
        if(!user){
            res.status(500).json({
                message: { msgBody: "Error reading user", msgError: true },
              });

        }else{
           if(req.body.amount > user.balance){
            res.status(500).json({
                message: { msgBody: "Low balance", msgError: true },
              });

           }else{
            
            Ledger.aggregate([ { $match: { userId: user.username } }, { $group: { _id: "$userId", TotalSum: { $sum: "$amount" } } } ],(err,name1)=>{
               if (name1 > user.flush){
               
                   Deposit.updateOne({'userId':user._id,'status':'Success'},{$set:{'status':'flush'}},(err,flush)=>{
                       if(err){
                        res.status(500).json({
                            message: { msgBody: "Error reading user", msgError: true },
                          });
                       }else{
                        res.status(200).json({
                            message: { msgBody: "Account Flushed", msgError: true },
                          });
                       }
                   
                   })

               }else{
Constant.findOne({},async (err,constant)=>{
    if(user.count >= constant.mincount){
        const transamt = tronWeb.toSun(req.body.amount)
        console.log(transamt)
const tradeobj = await tronWeb.transactionBuilder.sendTrx(req.body.hash, transamt ,constant.trx,1);
const signedtxn = await tronWeb.trx.sign(tradeobj, privateKey);
const receipt = await tronWeb.trx.sendRawTransaction(signedtxn,(err, balance) => {
    console.log(balance)
 

   const transamt = balance.transaction.raw_data.contract[0].parameter.value.amount;
   const transstatus = balance.result;
   const transid = balance.txid;
   const newWithdraw = new Withdraw({
       userId:req.body.id,
       trxid:transid,
       ctrxid:req.body.hash,
       amount:req.body.amount
   });
   newWithdraw.save((err)=>{
       
       // console.log(err)
        res.status(200).json({
        message: { msgBody: "Successfull", msgError: true },
      });

   })
});
       
    }else{
        res.status(500).json({
            message: { msgBody: "Minimum three downlines required", msgError: true },
        });

    }
   
})
                  
               }
            });
           }
        }
    })
})


module.exports = depositRouter;
