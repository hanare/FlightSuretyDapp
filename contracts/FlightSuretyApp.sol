pragma solidity ^0.5.0;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;          // Account used to deploy contract
    
 
     
    mapping(address => bool) registeredAirline;
    mapping(address => uint256)  airlineVotes;
    uint256 M ;
   
    event AirlineRegistered(string airline);
    event InsuranceStatus(string msg, uint val);
    event AirlineFunded(string msg);
    event Log(uint256 valDiv, uint256 valN, uint256 valM, address airline,bool status);

  
    event RegisteringAirline(string msg);
    FlightSuretyData flightSuretyData;
 
    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
         // Modify to call data contract's status
         require(flightSuretyData.isOperational(),"Contract is currently not operational");  
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address flightSuretyDataContract) public {
     contractOwner = msg.sender;
     flightSuretyData =   FlightSuretyData(flightSuretyDataContract);
     registeredAirline[contractOwner] = true;
 

    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public pure returns(bool) 
    {
        return true;  // Modify to call data contract's status
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *
    */   



    function voteAirline(address airline,address voter) internal {
        require(voter!=airline, "Voter cannot be the same as airline");
        if(airlineVotes[airline] == 0){
            airlineVotes[airline] = 1;
        } 
        else {
            uint temp = airlineVotes[airline];
            airlineVotes[airline] = temp+1;
        }
    }


    function airlineRegisteration(address airline) external payable returns(bool success, uint256 votes) 
    {
    //     uint amount;bool isRegistered;bool hasDeposited;
    //     (isRegistered, hasDeposited, amount ) = flightSuretyData.getAirline(airline);
    //    if( msg.value == 0) {
    //      flightSuretyData.setAirline(airline,false,false,0);
    //      return (false , 0);
    //    }
    //    else{
    //        // address(flightSuretyData).delegatecall(bytes32(keccak256("fund(uint256)")));
    //     //   flightSuretyData.payAirlineRegistrationFee(airline);
           
    //        emit RegisteringAirline("Register airline ");
    //        return flightSuretyData.registerAirline(airline);
    //    }
     uint amount;bool isRegistered;bool hasDeposited;

        (isRegistered, hasDeposited, amount ) = flightSuretyData.getAirline(msg.sender);
      
        uint NN = flightSuretyData.getN();
        require(hasDeposited, "This airline has not deposited 10 ether");
        require(isRegistered,"This sender is not a registered airline");
        emit Log(SafeMath.div(NN,2),NN,M,airline, isRegistered);
        emit RegisteringAirline("Registering Airline");
        if( NN<5 ){
            require(!registeredAirline[airline], "The airline is already registered ");
            registeredAirline[airline] = true;
            flightSuretyData.registerAirline(airline);
            (isRegistered, hasDeposited, amount ) = flightSuretyData.getAirline(airline);           
            emit AirlineRegistered("Airline is registered");
            return (true,M);
        } else {
            emit AirlineRegistered("Airline registeration is in consensus ");
            voteAirline(airline,msg.sender);
            M = airlineVotes[airline];
             
            if( M >= SafeMath.div(NN,2)){
                emit AirlineRegistered("Airline is in consensus Achieved");
                emit Log(SafeMath.div(NN,2),NN,M,airline, isRegistered);
                registeredAirline[airline] = true;
                flightSuretyData.registerAirline(airline);
                airlineVotes[airline] = 0;
                emit AirlineRegistered("Airline registered");
             return (true,M);
            }
            return(false,M);
        }
        return (false,M);
    }

    function removeAirline(address airline) external {
        flightSuretyData.deRegisterAirline(airline);
        registeredAirline[airline] =  false;         
    }

    function debuging() external returns (uint N, uint m) {
        uint NN = flightSuretyData.getN();
        return (NN,M);
    }

    function fundAirline(address airline) public payable requireIsOperational {
        require(msg.value >= AIRLINE_REGISTRATION_FEE, "Not enough ether to pay");
        uint256 returnAmount  =  msg.value - AIRLINE_REGISTRATION_FEE;
        flightSuretyData.fund.value(AIRLINE_REGISTRATION_FEE)(airline);

        msg.sender.transfer(returnAmount);
        emit AirlineFunded("Airline Funded");

        uint amount;bool isRegistered;bool hasDeposited;

        (isRegistered, hasDeposited, amount ) = flightSuretyData.getAirline(airline);
    }

    

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight(address airline,string calldata flight , uint256 timestamp) external {

        
          //  bytes32 key =    getFlightKey(airline,flight,timestamp);
            if(registeredAirline[airline] == true){
                flightSuretyData.registerFlight(airline,flight,timestamp,true);
            } else {
                flightSuretyData.registerFlight(airline,flight,timestamp,true);
            }            
    }

    function buyInsurance(address airline, string calldata flight, uint256 timestamp) external payable {
        uint amount;bool isRegistered;bool hasDeposited;
        (isRegistered, hasDeposited, amount ) = flightSuretyData.getAirline(airline);
     
        require(isRegistered && hasDeposited ,"Airline is not registered so you cannot buy insurance");
        bytes32 key = getFlightKey(airline,flight,timestamp);
        if(msg.value > 1 ether){
            // Extra ethers to be transfered back to the sender
            msg.sender.transfer(msg.value - MAX_INSURANCE_FEE);            
            flightSuretyData.buy.value(MAX_INSURANCE_FEE)(key,msg.sender);
            
        } else {             
             flightSuretyData.buy.value(msg.value)(key,msg.sender);
        }
        emit InsuranceStatus("Insurance Bought ",msg.value);
    }

    function withdraw() external {
        uint256 fund = flightSuretyData.getFunds(msg.sender);
        msg.sender.transfer(fund);
    }
    
   /**
    * @dev Called after oracle has updated flight status
    *
    */  
    function processFlightStatus
                                (
                                    address airline,
                                    string memory flight,
                                    uint256 timestamp,
                                    uint8 statusCode
                                )
                                internal
                                 
    {
     
        bytes32 key = getFlightKey(airline,flight,timestamp);
        // require(flightSuretyData.flights[key].airline == airline,"No such flight exist");
        // flightSuretyData.flights[key].statusCode = statusCode;
        // flightSuretyData.flights[key].updatedTimestamp = timestamp;
        if(statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(key);
            emit InsuranceStatus("Amount Credited to clients account ",0);
        }

    }


    // Generate a request for oracles to fetch flight information
      function fetchFlightStatus
                        (
                            address airline,
                            string calldata flight,
                            uint256 timestamp                            
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    } 


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;    

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;
    uint256 public constant MAX_INSURANCE_FEE = 1 ether;
     

    uint256 public constant AIRLINE_REGISTRATION_FEE = 10 ether;
    
    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;        
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns( uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string calldata flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp)); 
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string  memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns( uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

function getAirline(address airline)  public  view   returns (
        bool isRegistered,
        bool hasDeposited,
        uint  amount
    ){
        return flightSuretyData.getAirline(airline);
    }

}   



contract FlightSuretyData{
    function registerAirline(address airline)
                            external ;


    function getAirline(address airline)  public  view   returns (
        bool isRegistered,
        bool hasDeposited,
        uint  amount
    );
    function setAirline(address airline, bool isRegistered)   public;
    // function payAirlineRegistrationFee(address airline) external payable;
    function isOperational() public view returns(bool);
    function fund(address airline) public payable;
    function deRegisterAirline(address airline ) external;
    function creditInsurees(bytes32 flightkey) external;
    function registerFlight(address airline,string calldata flight,uint256 timestamp,bool isRegistered) external;
    function buy(bytes32 flightKey,address clientAdd) external payable;
    function getFunds(address insuree) external returns(uint256 amount);
     function getN() external returns (uint N);
     
}