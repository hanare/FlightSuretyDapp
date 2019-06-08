
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');


contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 30;
  var config;
  let timestamp = Math.floor(Date.now() / 1000);
  let flight = 'ND1309';
  const clientAccount = accounts[10];
  before('setup contract', async () => {
    config = await Test.Config(accounts);

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

  });


  it('can register oracles', async () => {

    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a] });
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it(`(insurance) client can pay upto 1 ether and buy insurance for a flight `, async () => {

    const insuranceFund = web3.utils.toWei("1", 'ether'); // 10 ether 


    
    let tx, result;
    try {
      result = await config.flightSuretyApp.getAirline(config.owner);
      //console.log("result ",result);
      tx = await config.flightSuretyApp.buyInsurance(config.owner, flight, timestamp, { from: clientAccount, value: insuranceFund });

    } catch (e) {
      console.log("ERROR ", e);
    }
    //console.log("tx log ",tx);
    truffleAssert.eventEmitted(tx, 'InsuranceStatus', (ev) => {
      //console.log(tx.logs[0], "INSURANCE ", ev)
      return ev.val.toString() === tx.logs[0].args.val.toString();
      //return true;
    }, "Event:InsuranceStatus failed");
  })
  it('can request flight status', async () => {

    // ARRANGE
    //let flight = 'ND1309'; // Course number

    let tx;
    const STATUS_CODE_LATE_AIRLINE = 20;
    // Submit a request for oracles to get status information for a flight
    tx = await config.flightSuretyApp.fetchFlightStatus(config.owner, flight, timestamp);
    // ACT
    //console.log("fetchFlightStatus",tx);
    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature

    
    for (let a = 1; a < TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a] });
      for (let idx = 0; idx < 3; idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          tx = await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.owner, flight, timestamp, STATUS_CODE_LATE_AIRLINE, { from: accounts[a] });
          
          truffleAssert.eventEmitted(tx, 'FlightStatusInfo', (ev) => {
            //console.log(tx, "FlightStatusInfo   ", ev)
            return ev.flight ===  flight && ev.status.toNumber() === 20;
            //return true;
          }, "Event:FlightStatusInfo failed");
          
          truffleAssert.eventEmitted(tx, 'InsuranceStatus', (ev) => {
            //console.log(tx, "InsuranceStatus   ", ev)
            return ev.msg === "Amount Credited to clients account";
            
          }, "Event:InsuranceStatus failed");
        }
        catch (e) {
          // Enable this when debugging
          console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }

    const funding = web3.utils.toWei("10", 'ether'); 
    txresult = await config.flightSuretyApp.fundAirline( accounts[2], { from:  accounts[2], value: funding });
    txresult = await config.flightSuretyApp.airlineRegisteration(accounts[2], { from: config.owner });

    const addr =  '0x43ba38c57B07C2BfD520444C18f032A6D7b1bc0F';     
    //console.log( "contract balance ", web3.utils.fromWei(await web3.eth.getBalance(addr),"ether"))
    const customerMoneyBefore = web3.utils.fromWei(await web3.eth.getBalance(clientAccount),"ether")
    //  console.log("\nBalance before ",customerMoneyBefore);
    tx = await config.flightSuretyApp.withdraw({from: clientAccount});
    console.log(tx);
    const customerMoneyAfter = web3.utils.fromWei(await web3.eth.getBalance(clientAccount),"ether")
    //console.log("balance After: ",customerMoneyAfter,"\nbalance before ",customerMoneyBefore);
    assert.equal(customerMoneyAfter>customerMoneyBefore,true,"Money transfer failed to the client ");
   


  });

  

});
