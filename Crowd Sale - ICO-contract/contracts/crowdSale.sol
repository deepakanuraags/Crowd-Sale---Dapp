//SPDX-License-Identifier: UNLICENSED
pragma solidity  ^0.6.12;
library SafeMath1{
 
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
    
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
       if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }
    
     function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }
}

interface ERC20Interface1 {
    function allowance(address tokenOwner, address spender) external view returns (uint256 remaining);
    function transfer(address to, uint256 tokens) external returns (bool success);
}

contract Crowdsale {
    using SafeMath1 for uint256;

    // The token being sold
    address public token;

    // end timestamps after which tokens sale is stopped
    uint256 public endTime;

    // address where funds are collected
    address public wallet;

    // how many token units a buyer gets per wei
    uint256 public exhange_rate;

    // amount of raised money in wei
    uint256 public weiRaised;
    
    //bool to enable/disable Crowdsale
    bool public isCrowdSaleEnabled;
    
    address public creator;
    
    bool public isConfigSet;
    
    mapping(address=>bytes32) passwordMap;
    
    bytes32 keccakVal;
    
    event tokensSentToAddress(address to, uint256 tokens);
    event bonusTokensSentToAddress(address to, uint256 tokens);
    event userRegisteredForBonus(address to);
    
    modifier onlyCreator() {
        require(msg.sender == creator,'only contract creator can call this method');
        _;
    }


    constructor(uint256 _endTime, uint256 _exhange_rate, address _token, bytes32 _keccakVal) public {
        
        _endTime = _endTime.add(now);
        
        require(_endTime >= now, 'end time should be greater than now');
        require(_exhange_rate > 0, 'exhange_rate should be higher than zero');
        
        
        isCrowdSaleEnabled = false;
        endTime = _endTime;
        exhange_rate = _exhange_rate;
        wallet = msg.sender;
        creator = msg.sender;
        token = _token;
        isConfigSet = true;
        keccakVal = _keccakVal;

    }
    
    function registerUserForBonusTokens(string memory passwordFromUser) public payable{
        require(isCrowdSaleEnabled,'Crowd Sale is disabled');
        require(msg.value!=0,'should be a non zero purchase');
        require(endTime>now,'crowd sale has ended');
        require(isConfigSet,'config not set yet');
        
        uint256 ethDecimals = 10 ** 17;
        uint256 amountRequired = 2 * ethDecimals;
        
        require(msg.value >= amountRequired, 'require 0.2 eth to register for bonus tokens');
        
        // if the user has sent 0.2 eth for bonus token registration then register a hashed password the user sent in mapping and forward funds
        bytes32 hashedPasswordForUser = keccak256(abi.encodePacked(passwordFromUser, keccakVal));
        
        passwordMap[msg.sender] = hashedPasswordForUser;
        
        forwardFunds();
        
        emit userRegisteredForBonus(msg.sender);
        
    }

    


    // low level token purchase function
    function buyTokens() public payable {
        
        require(isCrowdSaleEnabled,'Crowd Sale is disabled');
        require(msg.value!=0,'should be a non zero purchase');
        require(endTime>now,'crowd sale has ended');
        require(isConfigSet,'config not set yet');

        uint256 weiAmount = msg.value;

        // calculate token amount to be sent
        uint256 tokens = weiAmount.mul(getRate());

        // update state
        weiRaised = weiRaised.add(weiAmount);

        ERC20Interface1(token).transfer(msg.sender, tokens);

        forwardFunds();
        
        emit tokensSentToAddress(msg.sender,tokens);
    }
    
    function buyTokensWithBonus(string memory passwordFromUser) public payable {
        
        bytes32 hashedPasswordForUser = keccak256(abi.encodePacked(passwordFromUser, keccakVal));
        
        require(hashedPasswordForUser == passwordMap[msg.sender], 'password not matching for purchase with bonus tokens');
        
        buyTokens();
        
        uint256 weiAmount = msg.value;

        // calculate token amount that was already sent from buyTokens
        uint256 tokens = weiAmount.mul(getRate());
        
        // calculate 20 % for bonus 
        uint256 bonusTokens = tokens.mul(20).div(100);
        
        // send bonus tokens to user
        
        ERC20Interface1(token).transfer(msg.sender, bonusTokens);
        
        emit bonusTokensSentToAddress(msg.sender,bonusTokens);
    }
    
    function enableCrowdSale(bool flag) public onlyCreator{
        isCrowdSaleEnabled = flag;
    }
    
    function updateExchangeRate(uint256 _exhange_rate) public onlyCreator{
        exhange_rate = _exhange_rate;
    }
    
    function updateCrowSaleEndTime(uint256 endTimeFromNow) public onlyCreator{
        endTime = now + endTimeFromNow;
    }

    // send ether to the fund collection wallet
    function forwardFunds() internal {
        payable(wallet).transfer(msg.value);
    }


    // @return the crowdsale rate
    function getRate() public view returns (uint256) {
        return exhange_rate;
    }

    function getCreator() public returns(address){
        return creator;
    }


}


