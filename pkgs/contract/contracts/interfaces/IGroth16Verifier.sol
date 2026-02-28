// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice snarkjs 生成 Verifier との最小互換インターフェース
interface IGroth16Verifier {
    /// @notice Groth16 proof を検証する
    /// @return true の場合のみ証明が有効
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[1] memory input
    ) external view returns (bool);
}
