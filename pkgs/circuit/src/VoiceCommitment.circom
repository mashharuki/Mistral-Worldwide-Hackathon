pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

/**
 * VoiceCommitment
 * - 入力: 64bit パック済み声特徴量 8 要素 + salt
 * - 出力: Poseidon(9) コミットメント
 */
template VoiceCommitment() {
    signal input voiceFeatures[8];
    signal input salt;
    signal output commitment;

    component hash = Poseidon(9);
    component bits[8];

    for (var i = 0; i < 8; i++) {
        // 64bit 範囲チェック（2^64 未満）
        bits[i] = Num2Bits(64);
        bits[i].in <== voiceFeatures[i];

        hash.inputs[i] <== voiceFeatures[i];
    }

    hash.inputs[8] <== salt;
    commitment <== hash.out;
}

component main = VoiceCommitment();
