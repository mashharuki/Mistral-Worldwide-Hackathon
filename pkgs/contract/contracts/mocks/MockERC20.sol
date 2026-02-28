// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice VoiceWallet テスト用の最小 ERC20 モック
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MCK") {}

    /// @dev テスト簡略化のため誰でも mint 可能
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
