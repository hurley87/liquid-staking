// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Define interface with only the needed functions
interface IstPEAQ {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function rebase(uint256 newTotalUnderlying) external;
}

contract LiquidStaking is Ownable, Pausable, ReentrancyGuard {
    IstPEAQ public stPeaqToken;

    uint256 public constant MAX_FEE = 1500; // 15.00% (base 10000)
    uint256 public protocolFee = 500; // Default 5.00%
    address public feeCollector;

    struct WithdrawalRequest {
        uint256 amount; // Amount of stPEAQ burned
        uint256 unlockTime; // When the withdrawal can be claimed
    }

    mapping(address => WithdrawalRequest[]) public withdrawalRequests;

    uint256 public withdrawalDelay = 3 days; // Example: 3-day delay
    uint256 public totalStakedPEAQ;
    bool public emergencyMode = false;

    event Staked(address indexed user, uint256 amount);
    event WithdrawalRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event WithdrawalClaimed(address indexed user, uint256 amount);
    event EmergencyModeActivated();
    event EmergencyWithdrawal(address indexed user, uint256 amount);
    event WithdrawalDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event StakingLimitUpdated(uint256 newLimit);
    event ProtocolFeeUpdated(uint256 oldFee, uint256 newFee, address indexed updatedBy);
    event FeeCollectorUpdated(address indexed oldCollector, address indexed newCollector);
    event FeesCollected(uint256 amount, address indexed collector);
    event GlobalRewardLogged(
        uint256 date, // Day timestamp
        uint256 totalReward // Total reward distributed
    );  

    constructor(address _stPEAQ) Ownable(msg.sender) {
        stPeaqToken = IstPEAQ(_stPEAQ);
        feeCollector = msg.sender; // Initially set to owner
    }

    /// @notice Deposits native PEAQ tokens into the staking contract and mints stPEAQ tokens
    /// @dev The amount of stPEAQ tokens minted is equal to the PEAQ value sent
    function deposit() external payable whenNotPaused nonReentrant {
        require(totalStakedPEAQ + msg.value >= totalStakedPEAQ, "Overflow check");
        require(totalStakedPEAQ + msg.value <= stakingLimit, "Staking limit reached");
        require(msg.value > 0, "Must send PEAQ to deposit");

        // Mint stPEAQ tokens to the sender based on the deposit
        stPeaqToken.mint(msg.sender, msg.value);
        totalStakedPEAQ += msg.value;

        emit Staked(msg.sender, msg.value);
    }

    /// @notice Initiates a withdrawal request by burning stPEAQ tokens
    /// @param amount The amount of stPEAQ tokens to withdraw
    /// @dev Burns stPEAQ tokens and creates a withdrawal request with a delay period
    function requestWithdrawal(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than zero");
        require(stPeaqToken.balanceOf(msg.sender) >= amount, "Insufficient stPEAQ balance");

        // Burn stPEAQ tokens
        stPeaqToken.burn(msg.sender, amount);

        // Calculate unlock time
        uint256 unlockTime = block.timestamp + withdrawalDelay;

        // Record the withdrawal request
        withdrawalRequests[msg.sender].push(WithdrawalRequest({
            amount: amount,
            unlockTime: unlockTime
        }));

        emit WithdrawalRequested(msg.sender, amount, unlockTime);
    }

    /// @notice Claims a pending withdrawal after the delay period
    /// @param index The index of the withdrawal request to claim
    /// @dev Transfers PEAQ tokens back to the user and removes the withdrawal request
    function claimWithdrawal(uint256 index) external nonReentrant {
        require(index < withdrawalRequests[msg.sender].length, "Invalid request index");

        WithdrawalRequest memory request = withdrawalRequests[msg.sender][index];
        require(block.timestamp >= request.unlockTime, "Withdrawal not yet claimable");

        // Remove the request from the array
        uint256 lastIndex = withdrawalRequests[msg.sender].length - 1;
        if (index != lastIndex) {
            withdrawalRequests[msg.sender][index] = withdrawalRequests[msg.sender][lastIndex];
        }
        withdrawalRequests[msg.sender].pop();

        // Update total staked amount
        totalStakedPEAQ -= request.amount;

        // Send PEAQ back to the user
        payable(msg.sender).transfer(request.amount);

        emit WithdrawalClaimed(msg.sender, request.amount);
    }

    /// @notice Activates emergency mode for the contract
    /// @dev Can only be called by the contract owner
    function activateEmergencyMode() external onlyOwner {
        emergencyMode = true;
        emit EmergencyModeActivated();
    }

    /// @notice Allows users to withdraw their funds immediately during emergency
    /// @dev Calculates the user's share of PEAQ tokens based on their stPEAQ balance
    function emergencyWithdraw() external {
        require(emergencyMode, "Emergency mode is not active");

        uint256 userBalance = stPeaqToken.balanceOf(msg.sender);
        require(userBalance > 0, "No staked balance");

        // Burn the user's stPEAQ
        stPeaqToken.burn(msg.sender, userBalance);

        // Calculate the equivalent PEAQ amount
        uint256 equivalentPEAQ = (userBalance * totalStakedPEAQ) / stPeaqToken.totalSupply();
        require(equivalentPEAQ <= address(this).balance, "Insufficient contract balance");

        // Update total staked amount
        totalStakedPEAQ -= equivalentPEAQ;

        // Transfer PEAQ back to the user
        payable(msg.sender).transfer(equivalentPEAQ);

        emit EmergencyWithdrawal(msg.sender, equivalentPEAQ);
    }

    /// @notice Distributes rewards to all stakers through rebasing
    /// @dev Increases the total staked amount and triggers a rebase of stPEAQ tokens
    /// @dev Can only be called by the contract owner
    function distributeRewards() external payable onlyOwner {
        require(msg.value > 0, "Reward amount must be greater than zero");

        // Calculate protocol fee
        uint256 feeAmount = (msg.value * protocolFee) / 10000;
        uint256 rewardAmount = msg.value - feeAmount;

        // Transfer fee to collector
        if (feeAmount > 0) {
            payable(feeCollector).transfer(feeAmount);
            emit FeesCollected(feeAmount, feeCollector);
        }

        // Increase the total staked amount to reflect rewards
        totalStakedPEAQ += rewardAmount;

        // Trigger a rebase in the stPEAQ contract
        stPeaqToken.rebase(totalStakedPEAQ);

        emit GlobalRewardLogged(block.timestamp, rewardAmount);
    }

    /// @notice Allows the owner to update the withdrawal delay period
    /// @param newDelay The new delay period in seconds
    /// @dev Can only be called by the contract owner
    function setWithdrawalDelay(uint256 newDelay) external onlyOwner {
        require(newDelay > 0, "Withdrawal delay must be greater than zero");
        uint256 oldDelay = withdrawalDelay;
        withdrawalDelay = newDelay;
        emit WithdrawalDelayUpdated(oldDelay, newDelay);
    }

    /// @notice Returns all pending withdrawal requests for a user
    /// @param user Address of the user
    /// @return WithdrawalRequest[] Array of pending withdrawal requests
    function getWithdrawalRequests(address user) external view returns (WithdrawalRequest[] memory) {
        return withdrawalRequests[user];
    }

    /// @notice Calculates the current exchange rate between PEAQ and stPEAQ
    /// @return uint256 Exchange rate scaled to 1e18 (1 PEAQ = X stPEAQ)
    function getExchangeRate() public view returns (uint256) {
        if (totalStakedPEAQ == 0 || stPeaqToken.totalSupply() == 0) {
            return 1e18;
        }
        return (totalStakedPEAQ * 1e18) / stPeaqToken.totalSupply();
    }

    /// @notice Returns the amount of PEAQ tokens that can be withdrawn for a given amount of stPEAQ
    /// @param stPeaqAmount Amount of stPEAQ tokens
    /// @return uint256 Amount of PEAQ tokens that would be received
    function getWithdrawalAmount(uint256 stPeaqAmount) external view returns (uint256) {
        return (stPeaqAmount * totalStakedPEAQ) / stPeaqToken.totalSupply();
    }

    /// @notice Toggles the pause state of the contract
    /// @dev Can only be called by the contract owner
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract
    /// @dev Can only be called by the contract owner
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Maximum amount of PEAQ that can be staked
    uint256 public stakingLimit;

    /// @notice Sets the maximum staking limit
    /// @param newLimit New maximum amount of PEAQ that can be staked
    function setStakingLimit(uint256 newLimit) external onlyOwner {
        stakingLimit = newLimit;
        emit StakingLimitUpdated(newLimit);
    }

    /// @notice Updates the protocol fee
    /// @param newFee New fee in basis points (e.g., 1000 = 10%)
    /// @dev Can only be called by the contract owner
    function setProtocolFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "Fee cannot exceed 10%");
        uint256 oldFee = protocolFee;
        protocolFee = newFee;
        emit ProtocolFeeUpdated(oldFee, newFee, msg.sender);
    }

    /// @notice Updates the fee collector address
    /// @param newCollector New address to collect fees
    /// @dev Can only be called by the contract owner
    function setFeeCollector(address newCollector) external onlyOwner {
        require(newCollector != address(0), "Invalid address");
        address oldCollector = feeCollector;
        feeCollector = newCollector;
        emit FeeCollectorUpdated(oldCollector, newCollector);
    }

    /// @notice Returns the maximum allowed protocol fee
    /// @return uint256 Maximum fee in basis points (10.00%)
    function getMaxFee() external pure returns (uint256) {
        return MAX_FEE;
    }

    /// @notice Returns the amount of PEAQ tokens currently staked by an address
    /// @param account The address to check
    /// @return uint256 Amount of PEAQ tokens staked by the account
    function getStakedAmount(address account) external view returns (uint256) {
        uint256 stPeaqBalance = stPeaqToken.balanceOf(account);
        if (stPeaqBalance == 0 || stPeaqToken.totalSupply() == 0) {
            return 0;
        }
        return (stPeaqBalance * totalStakedPEAQ) / stPeaqToken.totalSupply();
    }

    /// @notice Returns the total amount of PEAQ tokens staked in the contract
    /// @return uint256 Total amount of PEAQ tokens staked
    function getTotalStaked() external view returns (uint256) {
        return totalStakedPEAQ;
    }

    /// @notice Checks if a withdrawal request is ready to be claimed
    /// @param user Address of the user
    /// @param index Index of the withdrawal request
    /// @return bool True if the request can be claimed, false otherwise
    function isWithdrawalClaimable(address user, uint256 index) external view returns (bool) {
        if (index >= withdrawalRequests[user].length) {
            return false;
        }
        return block.timestamp >= withdrawalRequests[user][index].unlockTime;
    }
}