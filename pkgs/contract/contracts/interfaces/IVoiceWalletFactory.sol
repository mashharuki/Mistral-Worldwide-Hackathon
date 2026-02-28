// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVoiceWalletFactory {
    function createWallet(
        address owner,
        address verifier,
        bytes32 voiceCommitment,
        bytes32 salt
    ) external returns (address);

    function getAddress(
        address owner,
        address verifier,
        bytes32 voiceCommitment,
        bytes32 salt
    ) external view returns (address);
}
