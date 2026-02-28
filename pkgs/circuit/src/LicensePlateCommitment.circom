pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

/**
 * LicensePlateCommitment - 車両ナンバープレート番号からコミットメントを生成
 *
 * この回路は、Poseidonハッシュを使用して、車両のナンバープレートからプライバシーを保護した
 * コミットメントを作成します。このコミットメントを使用すると、実際のナンバープレート番号を
 * オンチェーンで公開することなく、決定論的なERC-4337ウォレットアドレスを作成できます。
 *
 * プライバシー設計:
 * - 入力: plateChars (8つのフィールド要素) + salt (1つのフィールド要素)
 * - 出力: commitment (Poseidonハッシュ)
 * - ナンバープレート番号はオンチェーンで公開されず、コミットメントのみが公開されます
 *
 * 日本のナンバープレート形式:
 * - 地域 (地名): 例: 品川
 * - 分類 (分類番号): 例: 330
 * - ひらがな: 例: あ
 * - 一連番号: 例: 1234
 * - 例: 品川330あ1234 (エンコード後は最大8文字)
 */
template LicensePlateCommitment() {
    // 入力シグナル
    signal input plateChars[8];  // 8つのフィールド要素としてのナンバープレート (UTF-8エンコード)
    signal input salt;            // プライバシーのためのランダムなソルト

    // 出力シグナル
    signal output commitment;

    // 9つの入力 (8文字 + 1ソルト) でPoseidonハッシュを使用
    component hash = Poseidon(9);

    // ナンバープレートの文字を入力
    for (var i = 0; i < 8; i++) {
        hash.inputs[i] <== plateChars[i];
    }

    // ソルトを最後の入力として供給
    hash.inputs[8] <== salt;

    // コミットメントを出力
    commitment <== hash.out;
}

/**
 * LicensePlateOwnership - ナンバープレートを公開せずに所有権を証明する
 *
 * この回路は、証明者が公開されたコミットメントと一致するナンバープレート番号を知っていることを、
 * 実際のナンバープレート番号を明かすことなく証明します。
 *
 * 公開入力:
 * - publicCommitment: オンチェーンに保存されたコミットメント
 *
 * 秘密入力:
 * - plateChars: 実際のナンバープレート (秘密)
 * - salt: コミットメント生成に使用されたソルト (秘密)
 *
 * 回路の検証内容: commitment(plateChars, salt) == publicCommitment
 */
template LicensePlateOwnership() {
    // 秘密入力
    signal input plateChars[8];
    signal input salt;

    // 公開入力
    signal input publicCommitment;

    // 秘密入力からコミットメントを生成
    component commitmentGenerator = LicensePlateCommitment();
    for (var i = 0; i < 8; i++) {
        commitmentGenerator.plateChars[i] <== plateChars[i];
    }
    commitmentGenerator.salt <== salt;

    // 生成されたコミットメントが公開コミットメントと一致することを検証
    publicCommitment === commitmentGenerator.commitment;
}

// メインコンポーネント: ナンバープレート番号を公開せずに所有権を証明
// 公開: publicCommitment
// 秘密: plateChars, salt
component main {public [publicCommitment]} = LicensePlateOwnership();
