// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/core/Helpers.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@account-abstraction/contracts/samples/SimpleAccount.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IGroth16Verifier.sol";
import "./interfaces/IVoiceWallet.sol";

/// @title VoiceWallet
/// @notice 声コミットメントと Groth16 proof によって UserOperation を検証する ERC-4337 ウォレット
contract VoiceWallet is SimpleAccount, IVoiceWallet {
    // カスタムエラー定義
    error InvalidVerifier();
    error InvalidEntryPoint();
    error InvalidProof();
    error InvalidPublicSignal();
    error ERC20TransferFailed();

    /// @dev Groth16 verifier コントラクトアドレス
    address public verifier;
    /// @dev 登録時に固定する公開コミットメント
    bytes32 public voiceCommitment;

    /// @dev userOp.signature に格納される proof の ABI 形式
    struct Groth16Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[1] input;
    }

    /**
     * コンストラクター
     */
    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {}

    /**
     * 初期化メソッド
     */
    function initialize(
        address anOwner,
        address anEntryPoint,
        address anVerifier,
        bytes32 anVoiceCommitment
    ) public initializer {
        // SimpleAccount は constructor で EntryPoint を immutable に固定するため、
        // initialize では一致チェックのみ行う。
        if (anEntryPoint != address(entryPoint())) {
            revert InvalidEntryPoint();
        }
        if (anVerifier == address(0)) {
            revert InvalidVerifier();
        }

        _initialize(anOwner);
        verifier = anVerifier;
        voiceCommitment = anVoiceCommitment;
    }

    /**
     * ETH 転送を実行するユーティリティメソッド
     */
    function executeEthTransfer(
        address payable to,
        uint256 amount
    ) external {
        // owner もしくは EntryPoint 経由の実行のみ許可
        _requireFromEntryPointOrOwner();
        _call(to, amount, "");
    }

    /**
     * ERC20規格のトークン転送を実行するユーティリティメソッド
     */
    function executeERC20Transfer(
        address token,
        address to,
        uint256 amount
    ) external {
        _requireFromEntryPointOrOwner();

        // ERC20 実装差異（戻り値なし/true返却）に対応するため low-level call を使用
        (bool success, bytes memory result) = token.call(
            abi.encodeCall(IERC20.transfer, (to, amount))
        );
        if (!success || (result.length > 0 && !abi.decode(result, (bool)))) {
            revert ERC20TransferFailed();
        }
    }

    /**
     * 署名データが有効な Groth16 proof であることを検証するオーバーライドメソッド
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32
    ) internal override returns (uint256 validationData) {
        // userOp.signature を Groth16 proof として decode
        Groth16Proof memory proof = abi.decode(userOp.signature, (Groth16Proof));

        // public signal が登録済みコミットメントと一致することを先に検証
        if (proof.input[0] != uint256(voiceCommitment)) {
            revert InvalidPublicSignal();
        }

        // 実際の楕円曲線ペアリング検証は verifier に委譲
        bool isValid = IGroth16Verifier(verifier).verifyProof(
            proof.a,
            proof.b,
            proof.c,
            proof.input
        );
        if (!isValid) {
            revert InvalidProof();
        }

        return SIG_VALIDATION_SUCCESS;
    }
}
