pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

/**
 * VoiceCommitment template computes a Poseidon hash commitment from voice features and salt.
 * 音声特徴とソルトからPoseidonハッシュコミットメントを計算します。
 */
template VoiceCommitment() {
    // 入力信号: 音声特徴（8個の64ビット値）とソルト
    signal input voiceFeatures[8];
    signal input salt;
    // 出力信号: コミットメント値
    signal output commitment;

    // Poseidonハッシュコンポーネント（9入力）
    component hash = Poseidon(9);
    component bits[8];

    // 音声特徴をハッシュ入力に設定
    for (var i = 0; i < 8; i++) {
        bits[i] = Num2Bits(64);
        bits[i].in <== voiceFeatures[i];
        hash.inputs[i] <== voiceFeatures[i];
    }

    // ソルトを9番目のハッシュ入力に設定
    hash.inputs[8] <== salt;
    // ハッシュ結果をコミットメントとして出力
    commitment <== hash.out;
}
