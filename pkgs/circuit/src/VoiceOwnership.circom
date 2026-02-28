pragma circom 2.0.0;

include "./VoiceCommitmentTemplate.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * VoiceOwnership circuit verifies that the current voice features are within a certain Hamming distance from the reference voice features, and that the commitment to the reference features is correct.
 * 音声所有権回路は、現在の音声特徴が参照音声特徴から一定のハミング距離内にあり、参照特徴へのコミットメントが正しいことを検証します。
 */
template VoiceOwnership(hammingThreshold) {
    // 入力信号: 参照音声特徴、現在の音声特徴、ソルト、公開コミットメント
    signal input referenceFeatures[8];
    signal input currentFeatures[8];
    signal input salt;
    signal input publicCommitment;

    // コンポーネントと信号の宣言
    component referenceBits[8];
    component currentBits[8];
    signal diffBits[8][64];
    signal partialDistance[8][65];
    signal blockDistance[8];
    signal totalDistancePartial[9];
    signal totalDistance;

    // 64ビットごとの特徴量をビットに分解し、ハミング距離を計算
    for (var i = 0; i < 8; i++) {
        referenceBits[i] = Num2Bits(64);
        referenceBits[i].in <== referenceFeatures[i];

        currentBits[i] = Num2Bits(64);
        currentBits[i].in <== currentFeatures[i];

        partialDistance[i][0] <== 0;

        for (var j = 0; j < 64; j++) {
            // XOR演算によりビット差を計算
            diffBits[i][j] <== referenceBits[i].out[j] + currentBits[i].out[j] - 2 * referenceBits[i].out[j] * currentBits[i].out[j];
            partialDistance[i][j + 1] <== partialDistance[i][j] + diffBits[i][j];
        }

        blockDistance[i] <== partialDistance[i][64];
    }

    // 全ブロックのハミング距離を合計
    totalDistancePartial[0] <== 0;
    for (var k = 0; k < 8; k++) {
        totalDistancePartial[k + 1] <== totalDistancePartial[k] + blockDistance[k];
    }
    totalDistance <== totalDistancePartial[8];

    // ハミング距離がしきい値以下であることを検証
    component thresholdCheck = LessThan(10);
    thresholdCheck.in[0] <== totalDistance;
    thresholdCheck.in[1] <== hammingThreshold + 1;
    thresholdCheck.out === 1;

    // コミットメントの検証
    component commitment = VoiceCommitment();
    for (var m = 0; m < 8; m++) {
        commitment.voiceFeatures[m] <== referenceFeatures[m];
    }
    commitment.salt <== salt;

    publicCommitment === commitment.commitment;
}

// メインコンポーネント: ハミング距離のしきい値を128に設定
component main {public [publicCommitment]} = VoiceOwnership(128);
