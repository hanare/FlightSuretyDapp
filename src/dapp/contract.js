
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }

    async registerOracle(callback) {
        let self = this;
        let fee = await self.flightSuretyApp.REGISTRATION_FEE.call();
        self.flightSuretyApp.methods
            .registerOracle().send({ from: self.owner, value: fee }, (error, result) => {
                callback(error, fee);
            });
    }

    async buyInsurance(airline,flight,insuranceFund,time, callback) {
        let self = this;
        let timestamp = Math.floor(Date(time) / 1000);
        console.log("TIMESTAMP BUY INSURANCE ",timestamp);
        let fee = await self.flightSuretyApp.REGISTRATION_FEE.call();
        tx = await self.flightSuretyApp.buyInsurance(config.owner, flight, timestamp, { from: clientAccount, value: insuranceFund });

        self.flightSuretyApp.methods
            .buyInsurance().send({ from: self.owner, value: fee }, (error, result) => {
                callback(error, fee);
            });
    }

    
}