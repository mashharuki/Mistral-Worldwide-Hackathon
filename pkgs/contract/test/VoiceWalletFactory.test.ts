import { expect } from "chai";
import { ethers } from "hardhat";

describe("VoiceWalletFactory", () => {
  it("EntryPoint v0.7.0アドレス互換: 生成Walletが指定EntryPointを参照する", async () => {
    const [, owner] = await ethers.getSigners();
    const entryPointV07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

    const factoryFactory = await ethers.getContractFactory("VoiceWalletFactory");
    const factory = await factoryFactory.deploy(entryPointV07);
    await factory.waitForDeployment();

    const verifierFactory = await ethers.getContractFactory("MockGroth16Verifier");
    const verifier = await verifierFactory.deploy();
    await verifier.waitForDeployment();

    const commitment = ethers.keccak256(ethers.toUtf8Bytes("voice-commitment-v07"));
    const salt = ethers.keccak256(ethers.toUtf8Bytes("wallet-salt-v07"));

    const walletAddress = await factory.getAddress(
      owner.address,
      await verifier.getAddress(),
      commitment,
      salt,
    );
    await factory
      .connect(owner)
      .createWallet(owner.address, await verifier.getAddress(), commitment, salt);

    const wallet = await ethers.getContractAt("VoiceWallet", walletAddress);
    expect(await wallet.entryPoint()).to.eq(entryPointV07);
  });

  it("同一のcommitment + saltでgetAddressとcreateWalletのアドレスが一致する", async () => {
    const [deployer, owner] = await ethers.getSigners();

    const factoryFactory = await ethers.getContractFactory("VoiceWalletFactory");
    const factory = await factoryFactory.deploy(deployer.address);
    await factory.waitForDeployment();

    const verifierFactory = await ethers.getContractFactory("MockGroth16Verifier");
    const verifier = await verifierFactory.deploy();
    await verifier.waitForDeployment();

    // commitmentとsaltは同一の値を使用する必要がある
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("voice-commitment-factory"));
    const salt = ethers.keccak256(ethers.toUtf8Bytes("wallet-salt"));

    // createWalletを呼び出す前にgetAddressでアドレスを予測できることを確認
    const predicted = await factory.getAddress(
      owner.address,
      await verifier.getAddress(),
      commitment,
      salt,
    );

    // createWalletを呼び出して実際にウォレットをデプロイ
    await factory
      .connect(owner)
      .createWallet(owner.address, await verifier.getAddress(), commitment, salt);

    // 初期化用のコードがデプロイされていることを確認
    const code = await ethers.provider.getCode(predicted);
    expect(code).to.not.eq("0x");

    // createWalletを呼び出した後も同じアドレスが予測できることを確認
    const predictedAfterDeploy = await factory.getAddress(
      owner.address,
      await verifier.getAddress(),
      commitment,
      salt,
    );
    expect(predictedAfterDeploy).to.eq(predicted);
  });

  it("未デプロイでもgetAddressで事前計算できる", async () => {
    const [deployer, owner] = await ethers.getSigners();
    const factoryFactory = await ethers.getContractFactory("VoiceWalletFactory");
    const factory = await factoryFactory.deploy(deployer.address);
    await factory.waitForDeployment();

    const verifierFactory = await ethers.getContractFactory("MockGroth16Verifier");
    const verifier = await verifierFactory.deploy();
    await verifier.waitForDeployment();

    const commitment = ethers.keccak256(ethers.toUtf8Bytes("voice-commitment-factory-2"));
    const salt = ethers.keccak256(ethers.toUtf8Bytes("wallet-salt-2"));

    // ウォレットはまだデプロイされていないが、getAddressでアドレスを予測できることを確認
    const predicted = await factory.getAddress(
      owner.address,
      await verifier.getAddress(),
      commitment,
      salt,
    );
    // 予測されたアドレスが正しい形式であることを確認
    expect(predicted).to.match(/^0x[a-fA-F0-9]{40}$/);
  });
});
