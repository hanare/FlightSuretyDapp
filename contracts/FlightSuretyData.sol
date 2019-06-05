pragma solidity ^0.5.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address payable private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    uint256 N;
    mapping(address => bool) authorizedCaller;
    
     
    struct Airline{
        bool isRegistered;
        bool hasDeposited;
        uint amount;
        address airline;
        uint index;
    }
    enum State{
        InsuranceBought,
        AmountCredited,
        AmountTransfered
    }
    
    struct Passenger{
        address airline;
        bytes32 flightKey;
        address insuree;
        string flight;
        uint256 funds;
        State status;
    }
 
    mapping(address=>Passenger) client;
    
    mapping(bytes32=>Passenger[]) clientInsurance;
     
    mapping(address=>Airline) private registeredAirline;

      struct Flight {
        bool isRegistered;
        string flight;
        uint256 timestamp;        
        address airline;
      
    }
 
    mapping(bytes32 => Flight) private flights;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor() public 
    {
        contractOwner = msg.sender;
        registeredAirline[contractOwner] = Airline(true, true,10 ether,msg.sender,0);
        
        N = 1;
    }


    event AirlineFunded(string airline,uint funds);
 event Log(uint256 valDiv, uint256 valN, uint256 valM, address airline,bool status);

    event InsurancePayout(string msg, uint val);
    event InsuranceBought(string msg, uint val);
    event InsuranceTransferedToClient(string msg, uint val);
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
        require(operational, "Contract is currently not operational");
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

    modifier requireAuthorizedCaller(){
        require(authorizedCaller[msg.sender],"Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    function authorizeCaller(address caller ) public requireIsOperational requireContractOwner{
        require(!authorizedCaller[caller]," Caller is already authorized ");
        authorizedCaller[caller] =  true;
    }

    function deRegisterAuthorizedCaller(address caller) public requireIsOperational requireContractOwner  {
        require(authorizedCaller[caller]," Caller is not authorized ");
        delete authorizedCaller[caller];
    }
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

 
    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
 
    
    function registerAirline(address airline ) external                            
    {
       require(!registeredAirline[airline].isRegistered,"Airline Already Registered");
      
        N = N + 1;
       registeredAirline[airline].isRegistered = true;
       registeredAirline[airline].airline = msg.sender;
       
       emit Log(0,1000000,100000000,airline, registeredAirline[airline].hasDeposited);
    }

     function deRegisterAirline(address airline ) external
     {
       require(registeredAirline[airline].isRegistered,"Airline is not Registered");
        registeredAirline[airline].isRegistered = false;
        registeredAirline[airline].amount = 0;
        registeredAirline[airline].hasDeposited = false;
        
        N = N -1;
        
    }


    function getN() external returns (uint n){
        return N;
    }

     


  
   /**
    * @dev Buy insurance for a flight
    *
    */   

    
    function buy(bytes32 flightKey,address clientAdd) external payable{
        require(msg.value <=1 ether && msg.value > 0 ether,"Max 1 ether allowed ");
         
        clientInsurance[flightKey].push( Passenger( flights[flightKey].airline,flightKey,clientAdd, flights[flightKey].flight,msg.value,State.InsuranceBought));
        emit InsuranceBought("Insurance Bought ",msg.value);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(bytes32 flightkey) external                           
    {
         require(clientInsurance[flightkey].length > 0,"Client not registered ");
          for(uint i = 0; i < clientInsurance[flightkey].length ;i++){
             
            clientInsurance[flightkey][i].funds = SafeMath.add(clientInsurance[flightkey][i].funds,SafeMath.div(clientInsurance[flightkey][i].funds,2));
            clientInsurance[flightkey][i].status = State.AmountCredited;
            client[clientInsurance[flightkey][i].insuree] = clientInsurance[flightkey][i];
            emit InsurancePayout("Amount credited to insurees account ", clientInsurance[flightkey][i].funds );
          }
           delete clientInsurance[flightkey];
        
    }
    
    function registerFlight(address airline,string calldata flight,uint256 timestamp,bool isRegistered) external {
        bytes32 key = getFlightKey(  airline,  flight, timestamp);
        flights[key] = Flight(isRegistered,flight,timestamp,airline);       
    }

    function getAirline(address airline)  public  view   returns (
        bool isRegistered,
        bool hasDeposited,
        uint  amount
    ){
        return (
            registeredAirline[airline].isRegistered,
            registeredAirline[airline].hasDeposited,
            registeredAirline[airline].amount
            
             
        );
    }

    function setAirline(address airline, bool isRegistered )   public {
        registeredAirline[airline].isRegistered = isRegistered;
        
        
         
    }
    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay(address insuree) internal
    {
        require( client[insuree].funds > 0 ether,"Client not registered ");
        msg.sender.transfer(client[insuree].funds);
        emit InsuranceTransferedToClient("Amount transfered to client ", client[insuree].funds);
        //emit Log( 1,N,M,contractOwner, true );
        client[insuree].status = State.AmountTransfered;
    }

    function getFunds(address insuree) external returns(uint256 amount) {
            pay(insuree);
            return client[insuree].funds;
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund(address airline)
                            public
                            payable
                            requireIsOperational
    {        
         
          registeredAirline[airline].hasDeposited = true;
          registeredAirline[airline].amount = msg.value;
          registeredAirline[airline].airline = msg.sender;
          
         
          emit AirlineFunded("Ethers paid ",msg.value);

        //  emit Log(msg.value,N,M,airline, registeredAirline[airline].hasDeposited);
    
    }

    function getFlightKey(address airline,string memory flight,uint256 timestamp) pure internal returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }



    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund(msg.sender);
    }


}

