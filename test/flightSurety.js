
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');


contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, { from: config.owner });
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSuretyData.registerAuthorizedCaller(config.owner);

        }
        catch (e) {
             
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });




    it(`(airline) can register another Airline using registerAirline() after funding is done `, async () => {
        // ARRANGE
        let newAirline = accounts[2];
        let result;

        const funding = web3.utils.toWei("10", 'ether');
        // ACT
        try {
            result = await config.flightSuretyApp.getAirline(newAirline);
            assert.equal(result[0], false, "Airline should not be registered initally");
            await config.flightSuretyApp.airlineRegisteration(newAirline, { from: config.owner });
            result = await config.flightSuretyApp.getAirline(newAirline);
            // console.log(result);
            assert.equal(result[0], true, "Airline should  not be able to register another airline if it has not provided funding");
            assert.equal(result[1], false, "Amount deposited ");
            await config.flightSuretyApp.fundAirline(newAirline, { from: newAirline, value: funding });

            //await config.flightSuretyApp.airlineRegisteration(newAirline, { from: config.owner });
        }
        catch (e) {
            console.log("error: ", e);
        }

        result = await config.flightSuretyApp.getAirline.call(newAirline);
        //console.log("tx ", result);irline Already Registered
        // ASSERT
        assert.equal(result[0], true, "Airline should  not be able to register another airline if it has not provided funding");
        assert.equal(result[1], true, "Airline should be able to register another airline if it has provided funding");
        //clean up
        await config.flightSuretyApp.removeAirline(newAirline);
    });

    it(`(airline) register another airline only if it has been funded and the other airline is registered and funded  `, async () => {
        // ARRANGE
        let newAirline = accounts[2];
        let newAirline2 = accounts[3];
        let result;
        const funding = web3.utils.toWei("10", 'ether'); // 10 ether 
        //console.log("funds ", funding);
        let txresult, txresult2, txresultPay;
        // ACT
        try {
            // txresult = await config.flightSuretyApp.airlineRegisteration(accounts[2], { from: config.firstAirline  });
            result = await config.flightSuretyApp.getAirline.call(config.owner);
            assert.equal(result[0], true, "Airline should  be able to registered inorder to able to register another airline");
            txresult = await config.flightSuretyApp.fundAirline(newAirline, { from: newAirline, value: funding });
            txresult = await config.flightSuretyApp.airlineRegisteration(newAirline, { from: config.owner });

            truffleAssert.eventEmitted(txresult, 'RegisteringAirline', (ev) => {
                //  console.log(ev, "----", txresult)
                return ev.address === txresult.logs[0].args.address;

            }, "Event:RegisteringAirline failed");
            truffleAssert.eventEmitted(txresult, 'AirlineRegistered', (ev) => {
                //   console.log(ev, "----", txresult)
                return ev.address === txresult.logs[0].args.address;

            }, "Event:AirlineRegistered failed");
            txresultPay = await config.flightSuretyApp.fundAirline(newAirline2, { from: newAirline2, value: funding });
            txresult2 = await config.flightSuretyApp.airlineRegisteration(newAirline2, { from: newAirline });


        }
        catch (e) {
            console.log("ERROR ", e);
        }

        truffleAssert.eventEmitted(txresult2, 'AirlineRegistered', (ev) => {
            //console.log(ev, "-- AirlineRegistered --", txresult2)
            return ev.address === txresult2.logs[0].args.address;

        }, "Event:AirlineRegistered failed");
        result = await config.flightSuretyApp.getAirline.call(newAirline);
        assert.equal(result[0], true, "Airline should  be able to register another airline if it has provided funding");
        result = await config.flightSuretyApp.getAirline.call(newAirline2);
        assert.equal(result[0], true, "Airline should  be able to register another airline if it has provided funding");


        await config.flightSuretyApp.removeAirline(newAirline);
        await config.flightSuretyApp.removeAirline(newAirline2);
    });

//     it(`Debugging `, async () => {
//         let result ; 
// /// config.owner
//         result =  await config.flightSuretyApp.getAirline.call(config.owner);
//         console.log("RESULT ",result);
//         for (let j = 1; j < 8; j++) {
//             result =  await config.flightSuretyApp.getAirline.call(accounts[j]);
//             console.log(j," test ",result);  
//             result =  await config.flightSuretyApp.debuging.call();
//             console.log(j," debug ",result);   
//         } 
//         assert.equal(true,true," ");
//     });

    it(`(airline) registration more than 5 airline should require consensus `, async () => {
        // ARRANGE
        

        let result;

        const funding = web3.utils.toWei("10", 'ether'); // 10 ether 
         
        let txresult = new Array(), txresultPay = new Array();
        // ACT
        try {
            let i;
            result = await config.flightSuretyApp.getAirline.call(config.owner);
            assert.equal(result[0], true, "Owner Airline is not registered");
            for ( i = 3; i < 7; i++) {
                let payment = await config.flightSuretyApp.fundAirline(accounts[i], { from: accounts[i], value: funding });
                txresultPay.push(payment);
                let tx = await config.flightSuretyApp.airlineRegisteration(accounts[i], { from: config.owner })
                txresult.push(tx);
                //console.log(i," ###############################")
                //console.log(i," ===  ",tx);
                // for (let j = 1; j < 8; j++) {
                //     result =  await config.flightSuretyApp.getAirline.call(accounts[j]);
                //     console.log(j," test ",result);  
                //     result =  await config.flightSuretyApp.debuging.call();
                //     console.log(j," debug ",result);   
                // } 

            }
            txresultPay.push(await config.flightSuretyApp.fundAirline(accounts[7], { from: accounts[7], value: funding }));
            let  y = await config.flightSuretyApp.airlineRegisteration(accounts[7], { from: config.owner })
            txresult.push(y)
            //console.log("7 ===  ",y);
            
            //console.log(i," ###############################")
            // for (let j = 1; j < 8; j++) {
            //     result =  await config.flightSuretyApp.getAirline.call(accounts[j]);
            //     console.log(j," test ",result);  
            //     result =  await config.flightSuretyApp.debuging.call();
            //     console.log(j," debug ",result);   
            // } 
            
        }
        catch (e) {
            console.log("ERROR ", e);
        }


        // ASSERT

        for (let i = 0; i < txresult.length - 1; i++) {
            truffleAssert.eventEmitted(txresult[i], 'AirlineRegistered', (ev) => {
                return ev.address === txresult[i].logs[0].args.address;
            }, "Event:AirlineRegistered failed");
            truffleAssert.eventEmitted(txresultPay[i], 'AirlineFunded', (ev) => {
                // console.log(ev, "----", txresult)
                return ev.address === txresultPay[i].logs[0].args.address;
            }, "Event:AirlineFunded failed");
            result = await config.flightSuretyApp.getAirline(accounts[i + 3]);
            assert.equal(result[0], true, `Airline should  be able to register another airline if it has provided funding ${i} ${result[0]} ${result[1]}  ${result[2]} `);
        }
        result = await config.flightSuretyApp.getAirline(accounts[7]);
        //console.log("result ", result);
        assert.equal(result[0], false, "Airline should  not be able to register without consensus");

        for (let i = 3; i <= 6; i++) {
            await config.flightSuretyApp.removeAirline(accounts[i]);
            // let k  = await config.flightSuretyApp.debuging.call();
            //console.log(" SIZE OF N ",k)
        }
    });


    it(`(airline) registration new airline after 5 airline requires 50%  consensus `, async () => {
        // ARRANGE
        let result;
        const funding = web3.utils.toWei("10", 'ether'); // 10 ether 
        //console.log("funds ", funding);
        let txresult = new Array(), txresultPay = new Array();
        let txconsensus = new Array();

        for (let i = 3; i < 7; i++) {
            result = await config.flightSuretyApp.getAirline(accounts[i]);
            //console.log(i, "result check before", result);
            //assert.equal(result[0], true, "Airline not registered");
        }
        // ACT
        try {
            const vtxresult = await config.flightSuretyApp.getAirline(config.owner);
            //console.log("Airline OWner ", vtxresult);
            result = await config.flightSuretyData.getAirline(config.owner);
           // console.log(result);
            assert.equal(result[0], true, "Owner Airline is not registered");
            for (let i = 3; i < 7; i++) {
                txresultPay.push(await config.flightSuretyApp.fundAirline(accounts[i], { from: accounts[i], value: funding }));
                txresult.push(await config.flightSuretyApp.airlineRegisteration(accounts[i], { from: config.owner }));
                //console.log("Airline ", i,txresultPay[i]);                
                ///txresult.push();
            }
        }
        catch (e) {
            console.log("ERROR ", e);
        }



        for (let i = 3; i < 7; i++) {
            result = await config.flightSuretyApp.getAirline(accounts[i]);
            //console.log(i, "result check after", result);
            //assert.equal(result[0], true, "Airline n registered");
        }

        // ASSERT
        for (let i = 0; i < txresultPay.length - 1; i++) {

            truffleAssert.eventEmitted(txresult[i], 'AirlineRegistered', (ev) => {
                return ev.address === txresult[i].logs[0].args.address;
            }, "Event:AirlineRegistered failed");
            // truffleAssert.eventEmitted(txresult[i], 'Log', (ev) => {
            //     console.log(ev, "LOG EVENT ");
            //     //return ev.address === txresult[i].logs[0].args.address;
            //     return true;
            // }, "Event:Log failed");
        }

        try {
            let tx = await config.flightSuretyApp.fundAirline(accounts[7], { from: accounts[7], value: funding })
            txconsensus.push(tx);
            tx = await config.flightSuretyApp.airlineRegisteration(accounts[7], { from: config.owner })
            txconsensus.push(tx);
            for (let i = 3; i < 5; i++) {
                tx = await config.flightSuretyApp.airlineRegisteration(accounts[7], { from: accounts[i] })
                txconsensus.push(tx);
            }
        } catch (e) {
            console.log("Error ", e);
        }
        for (let i = 3; i < 5; i++) {
            result = await config.flightSuretyApp.getAirline(accounts[i]);
            //console.log(i, "result check", result);
            assert.equal(result[0], true, "Airline not registered");
        }
        result = await config.flightSuretyApp.getAirline(accounts[7]);
        //console.log("last contract clear", result);
        assert.equal(result[0], true, "Airline should  not be able to register without consensus");

        for (let i = 3; i <= 7; i++) {
            await config.flightSuretyApp.removeAirline(accounts[i]);
        }
    });


    
});
