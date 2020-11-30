//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.12;

library SafeMath{
 
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }
    
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }
    
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

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
    
}

interface ERC20Interface {
    function totalSupply() external view returns (uint256);
    function balanceOf(address tokenOwner) external view returns (uint256 balance);
    function allowance(address tokenOwner, address spender) external view returns (uint256 remaining);
    function transfer(address to, uint256 tokens) external returns (bool success);
    function approve(address spender, uint256 tokens) external returns (bool success);
    function transferFrom(address from, address to, uint256 tokens) external returns (bool success);

    event Transfer(address indexed from, address indexed to, uint256 tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint256 tokens);
}


contract dappToken is ERC20Interface {
    
    using SafeMath for uint256;
    uint256 internal _totalSupply;
    
    string public _symbol;
    string public _name;
    uint256 public _decimals = 18;
    uint256 private _decimalConversion = 10**18;

    mapping (address => uint256) internal _balances;
    mapping (address => mapping (address => uint256)) internal allowed;
    
    
     constructor (string memory name, string memory symbol,uint256 totalSupply) public {
        _name = name;
        _symbol = symbol;
        _totalSupply = totalSupply * _decimalConversion;
        _balances[msg.sender] = _totalSupply;
        emit Transfer(address(0), msg.sender, _totalSupply);
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint256) {
        return _decimals;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address tokenOwner) public view override returns (uint256 balance){
        return _balances[tokenOwner];
    }
    
    function allowance(address tokenOwner, address spender) public view override returns (uint256 remaining){
        return allowed[tokenOwner][spender];
    }
    
    function transfer(address to, uint256 tokens) public override returns (bool success){

        require(tokens <= _balances[msg.sender],'transfer amount exceeds balance');

    
        _balances[msg.sender] = _balances[msg.sender].sub(tokens);
        _balances[to] = _balances[to].add(tokens);
    
        _totalSupply = _totalSupply.sub(tokens);
    
        emit Transfer(msg.sender, to, tokens);
        
        return true;
    }
    
    function approve(address spender, uint256 tokens) public override returns (bool success){
        allowed[msg.sender][spender] = tokens;
        emit Approval(msg.sender, spender, tokens);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 tokens) public override returns (bool success){
        require(tokens <= _balances[msg.sender],'transfer amount exceeds balance');
        _balances[from] = SafeMath.sub(_balances[from], tokens);
        allowed[from][msg.sender] = SafeMath.sub(allowed[from][msg.sender], tokens);
        _balances[to] = SafeMath.add(_balances[to], tokens);
        emit Transfer(from, to, tokens);
        return true;
    }
}

