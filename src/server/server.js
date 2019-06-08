// import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
// import Config from './config.json';
// import Web3 from 'web3';
// import express from 'express';
const express = require('express');

const FlightSuretyApp = require("../../build/contracts/FlightSuretyApp.json");
const Config = require("./config.json");
const Web3 = require('web3');
let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

const TEST_ORACLES_COUNT = 21;



flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  console.log(event)
});

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})


exports.register = async function () {
  const fee = web3.utils.toWei("1", 'ether'); 
  //let fee = await flightSuretyApp.REGISTRATION_FEE.call();
  for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
  
     await  flightSuretyApp.methods.registerOracle()
     .send({ from: web3.eth.accounts[a], value: fee })
     .then((error,result)=>{
        if(error){
          console.log("error",error);
        }
    });
    let result = await flightSuretyApp.getMyIndexes.methods.call({ from: accounts[a] });
    console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
  }

}


// app.get('/registerOracles', async (req,res)=>{

//   for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
//     await config.flightSuretyApp.registerOracle({ from: web3.eth.accounts[a], value: fee });
//     let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
//     console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
//   }

//   res.send({
//     message: "Registering Oracles"
//   })
// })

exports.module = app;// default app;


