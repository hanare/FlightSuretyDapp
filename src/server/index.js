
// import http from 'http'
// import app from './server'
const http = require('http');
const app = require('./server');
const FlightSuretyApp =  require("../../build/contracts/FlightSuretyApp.json");
const Config =   require("./config.json");
const Web3 = require('web3');
// import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
// import Config from './config.json';
// import Web3 from 'web3';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);


const server = http.createServer(app)
let currentApp = app
server.listen(3000);
//registerOracles();

app.register();
    
if (module.hot) {
    module.hot.accept('./server', () => {
        server.removeListener('request', currentApp)
        server.on('request', app)
        currentApp = app
    })
}


