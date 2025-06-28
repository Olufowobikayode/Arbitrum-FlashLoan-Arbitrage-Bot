// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title AuditedFlashloanArbitrageBot
 * @dev Secure flashloan arbitrage bot using OpenZeppelin libraries
 * @author FlashArb Team
 * @notice This contract executes arbitrage trades using flashloans from multiple providers
 */
contract AuditedFlashloanArbitrageBot is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using Address for address;

    // Events
    event FlashloanExecuted(
        address indexed token,
        uint256 amount,
        address indexed provider,
        uint256 profit,
        uint256 gasUsed
    );
    
    event ArbitrageExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 profit
    );
    
    event EmergencyWithdraw(
        address indexed token,
        uint256 amount,
        address indexed to
    );
    
    event ProviderAdded(address indexed provider, string name);
    event ProviderRemoved(address indexed provider);
    event DEXAdded(address indexed dex, string name);
    event DEXRemoved(address indexed dex);
    
    event ProfitWithdrawn(
        address indexed token,
        uint256 amount,
        address indexed to
    );

    // Structs
    struct FlashloanProvider {
        address providerAddress;
        string name;
        uint256 fee; // in basis points
        bool isActive;
        uint256 maxAmount;
    }

    struct DEXInfo {
        address dexAddress;
        string name;
        uint256 fee; // in basis points
        bool isActive;
        bytes4 swapSelector;
    }

    struct ArbitrageParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        address[] dexPath;
        bytes[] swapData;
        uint256 minProfitBps; // minimum profit in basis points
        uint256 maxSlippageBps; // maximum slippage in basis points
        uint256 deadline;
    }

    struct SecurityParams {
        uint256 maxGasPrice;
        uint256 maxGasLimit;
        uint256 maxFlashloanAmount;
        uint256 minProfitThreshold;
        bool requireSimulation;
        mapping(address => bool) blacklistedTokens;
        mapping(address => bool) trustedCallers;
    }

    // State variables
    mapping(address => FlashloanProvider) public flashloanProviders;
    mapping(address => DEXInfo) public registeredDEXes;
    mapping(address => uint256) public tokenBalances;
    mapping(bytes32 => bool) public executedTrades;
    
    address[] public providerList;
    address[] public dexList;
    
    SecurityParams public securityParams;
    
    uint256 public constant MAX_BPS = 10000;
    uint256 public constant MAX_SLIPPAGE_BPS = 500; // 5%
    uint256 public constant MIN_PROFIT_BPS = 10; // 0.1%
    
    uint256 public totalProfitGenerated;
    uint256 public totalTradesExecuted;
    uint256 public emergencyStopTimestamp;
    
    bool public emergencyStop;

    // Modifiers
    modifier onlyTrustedCaller() {
        require(
            securityParams.trustedCallers[msg.sender] || msg.sender == owner(),
            "AuditedBot: Caller not trusted"
        );
        _;
    }

    modifier validGasPrice() {
        require(
            tx.gasprice <= securityParams.maxGasPrice,
            "AuditedBot: Gas price too high"
        );
        _;
    }

    modifier notEmergencyStop() {
        require(!emergencyStop, "AuditedBot: Emergency stop active");
        _;
    }

    modifier validToken(address token) {
        require(token != address(0), "AuditedBot: Invalid token address");
        require(!securityParams.blacklistedTokens[token], "AuditedBot: Token blacklisted");
        _;
    }

    /**
     * @dev Constructor
     * @param _maxGasPrice Maximum allowed gas price
     * @param _maxGasLimit Maximum allowed gas limit
     * @param _maxFlashloanAmount Maximum flashloan amount
     * @param _minProfitThreshold Minimum profit threshold in wei
     */
    constructor(
        uint256 _maxGasPrice,
        uint256 _maxGasLimit,
        uint256 _maxFlashloanAmount,
        uint256 _minProfitThreshold
    ) {
        securityParams.maxGasPrice = _maxGasPrice;
        securityParams.maxGasLimit = _maxGasLimit;
        securityParams.maxFlashloanAmount = _maxFlashloanAmount;
        securityParams.minProfitThreshold = _minProfitThreshold;
        securityParams.requireSimulation = true;
        securityParams.trustedCallers[msg.sender] = true;
    }

    /**
     * @dev Execute arbitrage with flashloan
     * @param provider Flashloan provider address
     * @param params Arbitrage parameters
     */
    function executeArbitrageWithFlashloan(
        address provider,
        ArbitrageParams calldata params
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyTrustedCaller 
        validGasPrice 
        notEmergencyStop
        validToken(params.tokenIn)
        validToken(params.tokenOut)
    {
        require(block.timestamp <= params.deadline, "AuditedBot: Transaction expired");
        require(params.amountIn <= securityParams.maxFlashloanAmount, "AuditedBot: Amount too large");
        require(params.minProfitBps >= MIN_PROFIT_BPS, "AuditedBot: Profit threshold too low");
        require(params.maxSlippageBps <= MAX_SLIPPAGE_BPS, "AuditedBot: Slippage too high");
        
        FlashloanProvider memory flashProvider = flashloanProviders[provider];
        require(flashProvider.isActive, "AuditedBot: Provider not active");
        require(params.amountIn <= flashProvider.maxAmount, "AuditedBot: Amount exceeds provider limit");

        // Generate unique trade ID
        bytes32 tradeId = keccak256(abi.encodePacked(
            block.timestamp,
            block.number,
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn
        ));
        
        require(!executedTrades[tradeId], "AuditedBot: Trade already executed");
        executedTrades[tradeId] = true;

        uint256 initialBalance = IERC20(params.tokenIn).balanceOf(address(this));
        uint256 gasStart = gasleft();

        // Execute flashloan
        _executeFlashloan(provider, params.tokenIn, params.amountIn, abi.encode(params));

        uint256 finalBalance = IERC20(params.tokenIn).balanceOf(address(this));
        uint256 gasUsed = gasStart.sub(gasleft());
        
        require(finalBalance > initialBalance, "AuditedBot: Trade not profitable");
        
        uint256 profit = finalBalance.sub(initialBalance);
        uint256 minProfit = params.amountIn.mul(params.minProfitBps).div(MAX_BPS);
        
        require(profit >= minProfit, "AuditedBot: Insufficient profit");
        require(profit >= securityParams.minProfitThreshold, "AuditedBot: Below minimum threshold");

        totalProfitGenerated = totalProfitGenerated.add(profit);
        totalTradesExecuted = totalTradesExecuted.add(1);
        tokenBalances[params.tokenIn] = tokenBalances[params.tokenIn].add(profit);

        emit FlashloanExecuted(params.tokenIn, params.amountIn, provider, profit, gasUsed);
        emit ArbitrageExecuted(params.tokenIn, params.tokenOut, params.amountIn, finalBalance, profit);
    }

    /**
     * @dev Internal function to execute flashloan
     * @param provider Flashloan provider address
     * @param token Token to borrow
     * @param amount Amount to borrow
     * @param data Encoded arbitrage parameters
     */
    function _executeFlashloan(
        address provider,
        address token,
        uint256 amount,
        bytes memory data
    ) internal {
        // This would call the specific flashloan provider
        // Implementation depends on the provider (Aave, Balancer, etc.)
        
        // For Aave V3
        if (keccak256(bytes(flashloanProviders[provider].name)) == keccak256(bytes("Aave V3"))) {
            _executeAaveFlashloan(provider, token, amount, data);
        }
        // For Balancer
        else if (keccak256(bytes(flashloanProviders[provider].name)) == keccak256(bytes("Balancer"))) {
            _executeBalancerFlashloan(provider, token, amount, data);
        }
        else {
            revert("AuditedBot: Unsupported provider");
        }
    }

    /**
     * @dev Execute Aave flashloan
     */
    function _executeAaveFlashloan(
        address provider,
        address token,
        uint256 amount,
        bytes memory data
    ) internal {
        // Aave flashloan implementation
        address[] memory assets = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        uint256[] memory modes = new uint256[](1);
        
        assets[0] = token;
        amounts[0] = amount;
        modes[0] = 0; // No debt mode
        
        // Call Aave pool
        (bool success,) = provider.call(
            abi.encodeWithSignature(
                "flashLoan(address,address[],uint256[],uint256[],address,bytes,uint16)",
                address(this),
                assets,
                amounts,
                modes,
                address(this),
                data,
                0
            )
        );
        
        require(success, "AuditedBot: Aave flashloan failed");
    }

    /**
     * @dev Execute Balancer flashloan
     */
    function _executeBalancerFlashloan(
        address provider,
        address token,
        uint256 amount,
        bytes memory data
    ) internal {
        // Balancer flashloan implementation
        address[] memory tokens = new address[](1);
        uint256[] memory amounts = new uint256[](1);
        
        tokens[0] = token;
        amounts[0] = amount;
        
        (bool success,) = provider.call(
            abi.encodeWithSignature(
                "flashLoan(address,address[],uint256[],bytes)",
                address(this),
                tokens,
                amounts,
                data
            )
        );
        
        require(success, "AuditedBot: Balancer flashloan failed");
    }

    /**
     * @dev Flashloan callback for Aave
     */
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        require(initiator == address(this), "AuditedBot: Invalid initiator");
        
        ArbitrageParams memory arbParams = abi.decode(params, (ArbitrageParams));
        
        // Execute arbitrage
        _executeArbitrage(arbParams);
        
        // Repay flashloan
        for (uint256 i = 0; i < assets.length; i++) {
            uint256 amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).safeTransfer(msg.sender, amountOwing);
        }
        
        return true;
    }

    /**
     * @dev Flashloan callback for Balancer
     */
    function receiveFlashLoan(
        address[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external {
        ArbitrageParams memory arbParams = abi.decode(userData, (ArbitrageParams));
        
        // Execute arbitrage
        _executeArbitrage(arbParams);
        
        // Repay flashloan
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 amountOwing = amounts[i].add(feeAmounts[i]);
            IERC20(tokens[i]).safeTransfer(msg.sender, amountOwing);
        }
    }

    /**
     * @dev Execute arbitrage logic
     * @param params Arbitrage parameters
     */
    function _executeArbitrage(ArbitrageParams memory params) internal {
        uint256 currentAmount = params.amountIn;
        address currentToken = params.tokenIn;
        
        // Execute swaps through DEX path
        for (uint256 i = 0; i < params.dexPath.length; i++) {
            address dex = params.dexPath[i];
            require(registeredDEXes[dex].isActive, "AuditedBot: DEX not active");
            
            // Get swap data for this step
            bytes memory swapData = params.swapData[i];
            
            // Execute swap
            uint256 balanceBefore = _getTokenBalance(
                i == params.dexPath.length - 1 ? params.tokenOut : currentToken
            );
            
            (bool success,) = dex.call(swapData);
            require(success, "AuditedBot: Swap failed");
            
            uint256 balanceAfter = _getTokenBalance(
                i == params.dexPath.length - 1 ? params.tokenOut : currentToken
            );
            
            require(balanceAfter > balanceBefore, "AuditedBot: Swap not profitable");
            currentAmount = balanceAfter.sub(balanceBefore);
            
            // Update current token for next iteration
            if (i < params.dexPath.length - 1) {
                // Determine next token based on swap
                currentToken = _getNextToken(currentToken, params.tokenOut);
            }
        }
        
        // Verify final profit
        uint256 finalAmount = _getTokenBalance(params.tokenOut);
        require(finalAmount >= params.amountIn, "AuditedBot: Final amount insufficient");
        
        // Convert back to input token if needed
        if (params.tokenOut != params.tokenIn) {
            _convertTokens(params.tokenOut, params.tokenIn, finalAmount);
        }
    }

    /**
     * @dev Get token balance
     */
    function _getTokenBalance(address token) internal view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Get next token in swap path
     */
    function _getNextToken(address currentToken, address finalToken) internal pure returns (address) {
        // Simplified logic - in real implementation, this would be more complex
        return finalToken;
    }

    /**
     * @dev Convert tokens
     */
    function _convertTokens(address tokenIn, address tokenOut, uint256 amount) internal {
        // Simplified conversion logic
        // In real implementation, this would use a DEX to convert
    }

    /**
     * @dev Add flashloan provider
     */
    function addFlashloanProvider(
        address provider,
        string memory name,
        uint256 fee,
        uint256 maxAmount
    ) external onlyOwner {
        require(provider != address(0), "AuditedBot: Invalid provider");
        require(bytes(name).length > 0, "AuditedBot: Invalid name");
        
        flashloanProviders[provider] = FlashloanProvider({
            providerAddress: provider,
            name: name,
            fee: fee,
            isActive: true,
            maxAmount: maxAmount
        });
        
        providerList.push(provider);
        emit ProviderAdded(provider, name);
    }

    /**
     * @dev Remove flashloan provider
     */
    function removeFlashloanProvider(address provider) external onlyOwner {
        require(flashloanProviders[provider].providerAddress != address(0), "AuditedBot: Provider not found");
        
        delete flashloanProviders[provider];
        
        // Remove from list
        for (uint256 i = 0; i < providerList.length; i++) {
            if (providerList[i] == provider) {
                providerList[i] = providerList[providerList.length - 1];
                providerList.pop();
                break;
            }
        }
        
        emit ProviderRemoved(provider);
    }

    /**
     * @dev Add DEX
     */
    function addDEX(
        address dex,
        string memory name,
        uint256 fee,
        bytes4 swapSelector
    ) external onlyOwner {
        require(dex != address(0), "AuditedBot: Invalid DEX");
        require(bytes(name).length > 0, "AuditedBot: Invalid name");
        
        registeredDEXes[dex] = DEXInfo({
            dexAddress: dex,
            name: name,
            fee: fee,
            isActive: true,
            swapSelector: swapSelector
        });
        
        dexList.push(dex);
        emit DEXAdded(dex, name);
    }

    /**
     * @dev Remove DEX
     */
    function removeDEX(address dex) external onlyOwner {
        require(registeredDEXes[dex].dexAddress != address(0), "AuditedBot: DEX not found");
        
        delete registeredDEXes[dex];
        
        // Remove from list
        for (uint256 i = 0; i < dexList.length; i++) {
            if (dexList[i] == dex) {
                dexList[i] = dexList[dexList.length - 1];
                dexList.pop();
                break;
            }
        }
        
        emit DEXRemoved(dex);
    }

    /**
     * @dev Update security parameters
     */
    function updateSecurityParams(
        uint256 _maxGasPrice,
        uint256 _maxGasLimit,
        uint256 _maxFlashloanAmount,
        uint256 _minProfitThreshold
    ) external onlyOwner {
        securityParams.maxGasPrice = _maxGasPrice;
        securityParams.maxGasLimit = _maxGasLimit;
        securityParams.maxFlashloanAmount = _maxFlashloanAmount;
        securityParams.minProfitThreshold = _minProfitThreshold;
    }

    /**
     * @dev Add trusted caller
     */
    function addTrustedCaller(address caller) external onlyOwner {
        securityParams.trustedCallers[caller] = true;
    }

    /**
     * @dev Remove trusted caller
     */
    function removeTrustedCaller(address caller) external onlyOwner {
        securityParams.trustedCallers[caller] = false;
    }

    /**
     * @dev Blacklist token
     */
    function blacklistToken(address token) external onlyOwner {
        securityParams.blacklistedTokens[token] = true;
    }

    /**
     * @dev Remove token from blacklist
     */
    function removeTokenFromBlacklist(address token) external onlyOwner {
        securityParams.blacklistedTokens[token] = false;
    }

    /**
     * @dev Emergency stop
     */
    function emergencyStopToggle() external onlyOwner {
        emergencyStop = !emergencyStop;
        emergencyStopTimestamp = block.timestamp;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraw profits
     */
    function withdrawProfits(address token, uint256 amount, address to) external onlyOwner {
        require(to != address(0), "AuditedBot: Invalid recipient");
        require(amount <= tokenBalances[token], "AuditedBot: Insufficient balance");
        
        tokenBalances[token] = tokenBalances[token].sub(amount);
        IERC20(token).safeTransfer(to, amount);
        
        emit ProfitWithdrawn(token, amount, to);
    }

    /**
     * @dev Emergency withdraw
     */
    function emergencyWithdraw(address token, address to) external onlyOwner {
        require(to != address(0), "AuditedBot: Invalid recipient");
        
        uint256 balance;
        if (token == address(0)) {
            balance = address(this).balance;
            payable(to).transfer(balance);
        } else {
            balance = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransfer(to, balance);
        }
        
        emit EmergencyWithdraw(token, balance, to);
    }

    /**
     * @dev Get provider count
     */
    function getProviderCount() external view returns (uint256) {
        return providerList.length;
    }

    /**
     * @dev Get DEX count
     */
    function getDEXCount() external view returns (uint256) {
        return dexList.length;
    }

    /**
     * @dev Check if caller is trusted
     */
    function isTrustedCaller(address caller) external view returns (bool) {
        return securityParams.trustedCallers[caller];
    }

    /**
     * @dev Check if token is blacklisted
     */
    function isTokenBlacklisted(address token) external view returns (bool) {
        return securityParams.blacklistedTokens[token];
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}

    /**
     * @dev Fallback function
     */
    fallback() external payable {}
}
