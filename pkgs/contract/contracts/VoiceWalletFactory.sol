// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./VoiceWallet.sol";
import "./interfaces/IVoiceWalletFactory.sol";

/**
 * 声の特徴量からウォレットを生成するファクトリーコントラクト
 * - 同じ特徴量とソルトを使用して複数回呼び出しても同じウォレットアドレスが生成される
 * - ウォレットはERC1967Proxyを使用してデプロイされるため、ガスコストを削減できる
 * - ウォレットの初期化には、オーナーアドレス、EntryPointアドレス、検証者アドレス、声の特徴量のコミットメントが必要
 */
contract VoiceWalletFactory is IVoiceWalletFactory {
    // カスタムエラー定義
    error InvalidEntryPoint();
    error InvalidVerifier();
    error InvalidOwner();

    IEntryPoint public immutable entryPoint;
    address public immutable walletImplementation;

    event VoiceWalletCreated(
        address indexed wallet,
        bytes32 indexed voiceCommitment,
        bytes32 indexed salt
    );

    /**
     * コンストラクター
     */
    constructor(address anEntryPoint) {
        if (anEntryPoint == address(0)) {
            revert InvalidEntryPoint();
        }

        entryPoint = IEntryPoint(anEntryPoint);
        walletImplementation = address(new VoiceWallet(entryPoint));
    }

    /**
     * ウォレット作成メソッド
     */
    function createWallet(
        address owner,
        address verifier,
        bytes32 voiceCommitment,
        bytes32 salt
    ) external returns (address wallet) {
        if (owner == address(0)) {
            revert InvalidOwner();
        }
        if (verifier == address(0)) {
            revert InvalidVerifier();
        }

        wallet = getAddress(owner, verifier, voiceCommitment, salt);
        if (wallet.code.length > 0) {
            return wallet;
        }

        bytes memory initData = abi.encodeCall(
            VoiceWallet.initialize,
            (owner, address(entryPoint), verifier, voiceCommitment)
        );
        wallet = address(
            new ERC1967Proxy{salt: salt}(walletImplementation, initData)
        );

        emit VoiceWalletCreated(wallet, voiceCommitment, salt);
    }

    /**
     * アドレスを取得するメソッド
     */
    function getAddress(
        address owner,
        address verifier,
        bytes32 voiceCommitment,
        bytes32 salt
    ) public view returns (address) {
        bytes memory initData = abi.encodeCall(
            VoiceWallet.initialize,
            (owner, address(entryPoint), verifier, voiceCommitment)
        );
        bytes memory initCode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(walletImplementation, initData)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(initCode)
            )
        );
        return address(uint160(uint256(hash)));
    }
}
