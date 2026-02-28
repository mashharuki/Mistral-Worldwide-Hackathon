// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice VoiceWallet の外部公開インターフェース
interface IVoiceWallet {
    /// @return 登録済みの音声コミットメント
    function voiceCommitment() external view returns (bytes32);

    /// @return Groth16 verifier コントラクトアドレス
    function verifier() external view returns (address);

    /// @notice ETH を送金する
    function executeEthTransfer(address payable to, uint256 amount) external;

    /// @notice ERC20 トークンを送金する
    function executeERC20Transfer(
        address token,
        address to,
        uint256 amount
    ) external;
}
