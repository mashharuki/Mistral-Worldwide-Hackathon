pragma circom 2.0.0;

include "./VoiceCommitmentTemplate.circom";
include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

/**
 * VoiceOwnership circuit verifies that the current voice features are within a certain Hamming distance from the reference voice features, and that the commitment to the reference features is correct.
 */
template VoiceOwnership(hammingThreshold) {
    signal input referenceFeatures[8];
    signal input currentFeatures[8];
    signal input salt;
    signal input publicCommitment;

    component referenceBits[8];
    component currentBits[8];
    signal diffBits[8][64];
    signal partialDistance[8][65];
    signal blockDistance[8];
    signal totalDistancePartial[9];
    signal totalDistance;

    for (var i = 0; i < 8; i++) {
        referenceBits[i] = Num2Bits(64);
        referenceBits[i].in <== referenceFeatures[i];

        currentBits[i] = Num2Bits(64);
        currentBits[i].in <== currentFeatures[i];

        partialDistance[i][0] <== 0;

        for (var j = 0; j < 64; j++) {
            diffBits[i][j] <== referenceBits[i].out[j] + currentBits[i].out[j] - 2 * referenceBits[i].out[j] * currentBits[i].out[j];
            partialDistance[i][j + 1] <== partialDistance[i][j] + diffBits[i][j];
        }

        blockDistance[i] <== partialDistance[i][64];
    }

    totalDistancePartial[0] <== 0;
    for (var k = 0; k < 8; k++) {
        totalDistancePartial[k + 1] <== totalDistancePartial[k] + blockDistance[k];
    }
    totalDistance <== totalDistancePartial[8];

    // totalDistance <= hammingThreshold
    component thresholdCheck = LessThan(10);
    thresholdCheck.in[0] <== totalDistance;
    thresholdCheck.in[1] <== hammingThreshold + 1;
    thresholdCheck.out === 1;

    component commitment = VoiceCommitment();
    for (var m = 0; m < 8; m++) {
        commitment.voiceFeatures[m] <== referenceFeatures[m];
    }
    commitment.salt <== salt;

    publicCommitment === commitment.commitment;
}

component main {public [publicCommitment]} = VoiceOwnership(128);
