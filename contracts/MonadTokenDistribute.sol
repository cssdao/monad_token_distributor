// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MonadTokenDistribute {
    address public owner;

    mapping(address => bool) public whitelist;
    mapping(address => bool) public hasClaimed;
    mapping(address => uint256) public claimableAmount;

    event TokensClaimed(address indexed claimant, uint256 amount, uint256 timestamp);
    event Whitelisted(address indexed account, bool status, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function addToWhitelist(address[] calldata accounts, uint256[] calldata amounts) external {
        require(msg.sender == owner, "Only owner can modify whitelist");
        require(accounts.length == amounts.length, "Arrays length mismatch");
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = true;
            claimableAmount[accounts[i]] = amounts[i];
            emit Whitelisted(accounts[i], true, amounts[i]);
        }
    }

    function removeFromWhitelist(address[] calldata accounts) external {
        require(msg.sender == owner, "Only owner can modify whitelist");
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = false;
            claimableAmount[accounts[i]] = 0;
            emit Whitelisted(accounts[i], false, 0);
        }
    }

    function claim() external {
        address claimant = msg.sender;
        require(whitelist[claimant], "Address not whitelisted");
        require(!hasClaimed[claimant], "Already claimed");
        uint256 amount = claimableAmount[claimant];
        require(address(this).balance >= amount, "Insufficient contract balance");

        hasClaimed[claimant] = true;
        whitelist[claimant] = false;
        (bool sent, ) = claimant.call{value: amount}("");
        require(sent, "Failed to send MON");
        emit TokensClaimed(claimant, amount, block.timestamp);
        emit Whitelisted(claimant, false, 0);
    }

    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool sent, ) = owner.call{value: balance}("");
        require(sent, "Failed to withdraw");
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function isWhitelisted(address account) external view returns (bool) {
        return whitelist[account];
    }

    function hasClaimedStatus(address account) external view returns (bool) {
        return hasClaimed[account];
    }

    function getClaimableAmount(address account) external view returns (uint256) {
        return claimableAmount[account];
    }
}