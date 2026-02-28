// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice VoiceWallet テスト用の最小 ERC20 モック
contract MockERC20 is ERC20 {
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    constructor() ERC20("Mock Token", "MCK") {
        // デプロイ時に実行者へテスト用の初期供給を配布
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /// @dev テスト簡略化のため誰でも mint 可能
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
