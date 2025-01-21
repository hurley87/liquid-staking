// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title stPEAQ Token Contract
 * @notice This contract implements a staked version of the PEAQ token with rebasing functionality
 * @dev Inherits from ERC20 and Ownable contracts
 */
contract stPEAQ is ERC20, ERC20Permit, Ownable, Pausable {
    uint256 private _scalingFactor = 1e18;
    uint256 private _totalUnderlying;
    address public stakingContract;

    event ScalingFactorUpdated(uint256 oldFactor, uint256 newFactor);
    event StakingContractUpdated(address oldContract, address newContract);

    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "Caller is not the staking contract");
        _;
    }

    /**
     * @notice Constructor initializes the stPEAQ token and sets the staking contract address
     * @param _stakingContract Address of the staking contract that will manage this token
     */
    constructor(address _stakingContract) 
        ERC20("Staked PEAQ", "stPEAQ")
        ERC20Permit("Staked PEAQ")
        Ownable(msg.sender) 
    {
        stakingContract = _stakingContract;
    }

    /**
     * @notice Updates the staking contract address
     * @dev Only callable by the contract owner
     * @param _stakingContract New staking contract address
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        require(_stakingContract != address(0), "Invalid address");
        stakingContract = _stakingContract;
        emit StakingContractUpdated(stakingContract, _stakingContract);
    }

    /**
     * @notice Updates the scaling factor used for token calculations
     * @dev Only callable by the contract owner
     * @param newScalingFactor New scaling factor value (must be greater than 0)
     */
    function setScalingFactor(uint256 newScalingFactor) external onlyOwner {
        require(newScalingFactor > 0, "Scaling factor must be positive");
        uint256 oldFactor = _scalingFactor;
        _scalingFactor = newScalingFactor;
        emit ScalingFactorUpdated(oldFactor, newScalingFactor);
    }

    /**
     * @notice Mints new stPEAQ tokens
     * @dev Only callable by the staking contract
     * @param to Address to receive the minted tokens
     * @param amount Amount of underlying tokens to mint (will be scaled)
     */
    function mint(address to, uint256 amount) external onlyStakingContract whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        uint256 scaledAmount = (amount * 1e18) / _scalingFactor;
        _mint(to, scaledAmount);
        _totalUnderlying += amount;
    }

    /**
     * @notice Burns stPEAQ tokens
     * @dev Only callable by the staking contract
     * @param from Address to burn tokens from
     * @param amount Amount of underlying tokens to burn (will be scaled)
     */
    function burn(address from, uint256 amount) external onlyStakingContract whenNotPaused {
        uint256 scaledAmount = (amount * 1e18) / _scalingFactor;
        _burn(from, scaledAmount);
        _totalUnderlying -= amount;
    }

    /**
     * @notice Performs a rebase operation to adjust token balances
     * @dev Only callable by the staking contract
     * @param newTotalUnderlying New total amount of underlying tokens (must be greater than current total)
     */
    function rebase(uint256 newTotalUnderlying) external onlyStakingContract {
        require(newTotalUnderlying > _totalUnderlying, "Rebase must increase value");
        require(totalSupply() > 0, "Cannot rebase with zero supply");
        _scalingFactor = (newTotalUnderlying * 1e18) / totalSupply();
        _totalUnderlying = newTotalUnderlying;
    }

    /**
     * @notice Returns the balance of tokens for a given account
     * @dev Overrides ERC20 balanceOf to apply scaling factor
     * @param account Address to check balance for
     * @return uint256 Scaled balance of the account
     */
    function balanceOf(address account) public view override returns (uint256) {
        uint256 scaledBalance = super.balanceOf(account);
        uint256 adjustedBalance = scaledBalance * _scalingFactor;
        return adjustedBalance / 1e18;
    }

    /**
     * @notice Returns the total supply of tokens
     * @dev Overrides ERC20 totalSupply to reflect the scaled supply
     * @return uint256 Scaled total supply
     */
    function totalSupply() public view override returns (uint256) {
        return (_totalUnderlying * 1e18) / _scalingFactor;
    }

    /**
     * @notice Returns the current scaling factor
     * @return uint256 Current scaling factor
     */
    function getScalingFactor() external view returns (uint256) {
        return _scalingFactor;
    }

    /**
     * @notice Returns the total amount of underlying PEAQ tokens
     * @return uint256 Total underlying PEAQ
     */
    function getTotalUnderlying() external view returns (uint256) {
        return _totalUnderlying;
    }

    /**
     * @notice Converts stPEAQ amount to underlying PEAQ amount
     * @param stPeaqAmount Amount of stPEAQ tokens
     * @return uint256 Equivalent amount of underlying PEAQ tokens
     */
    function getUnderlyingAmount(uint256 stPeaqAmount) external view returns (uint256) {
        return (stPeaqAmount * _scalingFactor) / 1e18;
    }

    /**
     * @notice Converts PEAQ amount to stPEAQ amount
     * @param peaqAmount Amount of PEAQ tokens
     * @return uint256 Equivalent amount of stPEAQ tokens
     */
    function getStPeaqAmount(uint256 peaqAmount) external view returns (uint256) {
        return (peaqAmount * 1e18) / _scalingFactor;
    }

    /// @notice Pauses all token transfers and operations
    /// @dev Can only be called by the contract owner
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract, allowing transfers and operations
    /// @dev Can only be called by the contract owner
    function unpause() external onlyOwner {
        _unpause();
    }
}