
var Test = require('../config/testConfig.js');
//var BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');


contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 30;
  var config;
  let timestamp = Math.floor(Date.now() / 1000);
  let flight = 'ND1309';
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


    const clientAccount = accounts[10];
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
      console.log(tx.logs[0], "INSURANCE ", ev)
      return ev.val.toString() === tx.logs[0].args.val.toString();
      //return true;
    }, "Event:InsuranceStatus failed");
  })
  it('can request flight status', async () => {

    // ARRANGE
    let flight = 'ND1309'; // Course number

    let tx;
    const STATUS_CODE_LATE_AIRLINE = 20;
    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);
    // ACT

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
          truffleAssert.eventEmitted(tx, 'InsuranceStatus', (ev) => {
            console.log(tx, "INSURANCE Paid ", ev)
            //return ev.address === txresult[i].logs[0].args.;
            return true;
          }, "Event:InsuranceStatus failed");
        }
        catch (e) {
          // Enable this when debugging
          console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }


  });



});
