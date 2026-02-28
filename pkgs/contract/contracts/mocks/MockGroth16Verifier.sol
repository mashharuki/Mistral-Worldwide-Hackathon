// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IGroth16Verifier.sol";

/// @notice VoiceWallet テスト用 verifier モック
contract MockGroth16Verifier is IGroth16Verifier {
    /// @dev verifyProof の戻り値を外部から切り替える
    bool private _result = true;

    function setResult(bool result_) external {
        _result = result_;
    }

    function verifyProof(
        uint256[2] memory,
        uint256[2][2] memory,
        uint256[2] memory,
        uint256[1] memory
    ) external view returns (bool) {
        return _result;
    }
}
