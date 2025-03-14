// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MonadTokenDistribute {
    address public owner;
    uint256 public minClaimAmount = 10 ether; // 最小领取金额，默认 10 Ether
    uint256 public maxClaimAmount = 20 ether; // 最大领取金额，默认 20 Ether

    mapping(address => uint256) public totalClaimed;
    mapping(address => uint256) public claimedNonce;

    event TokensClaimed(
        address indexed claimant,
        uint256 amount,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}

    function setClaimRange(uint256 _minAmount, uint256 _maxAmount) external {
        require(msg.sender == owner, "Only owner can set claim range");
        require(
            _minAmount <= _maxAmount,
            "Min amount must be less than or equal to max amount"
        );
        minClaimAmount = _minAmount;
        maxClaimAmount = _maxAmount;
    }

    function claim(
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes memory signature
    ) external {
        address claimant = msg.sender;
        // 检查 deadline
        require(block.timestamp <= deadline, "Signature expired");
        // 检查 nonce
        require(claimedNonce[claimant] == nonce, "Invalid or used nonce");
        // 检查金额范围
        require(
            amount >= minClaimAmount && amount <= maxClaimAmount,
            "Amount out of range"
        );
        // 检查合约余额
        require(
            address(this).balance >= amount,
            "Insufficient contract balance"
        );

        // 构造消息哈希
        bytes32 messageHash = keccak256(
            abi.encodePacked(claimant, amount, nonce, deadline, address(this))
        );
        bytes32 ethSignedMessageHash = toEthSignedMessageHash(messageHash);

        // 验证签名
        address signer = recoverSigner(ethSignedMessageHash, signature);
        require(signer == owner, "Invalid signature");

        // 更新状态
        claimedNonce[claimant]++;
        totalClaimed[claimant] += amount;

        // 分发代币
        (bool sent, ) = claimant.call{value: amount}("");
        require(sent, "Failed to send MON");
        emit TokensClaimed(claimant, amount, block.timestamp);
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

    function getTotalClaimed(address claimant) external view returns (uint256) {
        return totalClaimed[claimant];
    }

    function getNonce(address claimant) external view returns (uint256) {
        return claimedNonce[claimant];
    }

    function toEthSignedMessageHash(
        bytes32 hash
    ) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }

    function recoverSigner(
        bytes32 ethSignedMessageHash,
        bytes memory signature
    ) private pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(signature);
        return ecrecover(ethSignedMessageHash, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) private pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }
}
