
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

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
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
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }

    async withdraw(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .withdraw().send({ from: self.owner}, (error, result) => {
              console.log("RESULT",result);
              console.log("ERROR",error);
              
                callback(error);
            });
    }

    async  buyInsurance(airline, flight, time, amount, callback) {
        let self = this;
        let timestamp = Math.floor(new Date(time) / 1000);
        console.log("TIME ", new Date(time), " ", timestamp);
        console.log("TIMESTAMP BUY INSURANCE ", timestamp);

        const insuranceFund = self.web3.utils.toWei(`${amount}`, 'ether'); // 10 ether 
        const AIRLINE = self.airlines[airline];
        console.log(AIRLINE, flight, timestamp, amount, insuranceFund);

        self.flightSuretyApp.methods.buyInsurance(AIRLINE, flight, timestamp).send(
            { from: self.owner, value: insuranceFund }, (error, result) => {
            callback(error, insuranceFund);
        });

    }



}