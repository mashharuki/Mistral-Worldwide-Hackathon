import { expect } from "chai";
import { ethers } from "hardhat";

describe("VoiceWallet", () => {
  /**
   * コントラクトのデプロイとコミットメントの初期化を行うフィクスチャ関数
   * @returns
   */
  async function deployFixture() {
    const [owner, entryPoint, recipient] = await ethers.getSigners();

    const verifierFactory = await ethers.getContractFactory(
      "MockGroth16Verifier",
    );
    const verifier = await verifierFactory.deploy();
    await verifier.waitForDeployment();

    const walletFactory = await ethers.getContractFactory("VoiceWallet");
    const implementation = await walletFactory.deploy(entryPoint.address);
    await implementation.waitForDeployment();

    // コミットメントはテスト用に固定値を使用
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("voice-commitment"));
    // initialize関数の呼び出しデータをエンコード
    const initializeData = walletFactory.interface.encodeFunctionData(
      "initialize(address,address,address,bytes32)",
      [
        owner.address,
        entryPoint.address,
        await verifier.getAddress(),
        commitment,
      ],
    );

    // ERC1967ProxyをデプロイしてWalletコントラクトを初期化
    const proxyFactory = await ethers.getContractFactory("TestERC1967Proxy");
    const proxy = await proxyFactory.deploy(
      await implementation.getAddress(),
      initializeData,
    );
    await proxy.waitForDeployment();
    // Proxyを通じてWalletコントラクトのインスタンスを取得
    const wallet = walletFactory.attach(await proxy.getAddress());

    return { owner, entryPoint, recipient, verifier, wallet, commitment };
  }

  /**
   * コミットメントからZK proofの署名データを構築するヘルパー関数
   * @param commitment
   * @returns
   */
  function buildSignature(commitment: string) {
    // テスト用に固定のpublic signalとproofをエンコード
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256[2]", "uint256[2][2]", "uint256[2]", "uint256[1]"],
      [
        [1, 2],
        [
          [3, 4],
          [5, 6],
        ],
        [7, 8],
        [BigInt(commitment)],
      ],
    );
  }

  it("有効なZK proofでvalidateUserOpが成功する", async () => {
    const { entryPoint, wallet, commitment } = await deployFixture();
    const signature = buildSignature(commitment);

    const userOp = {
      sender: await wallet.getAddress(),
      nonce: 0n,
      initCode: "0x",
      callData: "0x",
      accountGasLimits: ethers.ZeroHash,
      preVerificationGas: 0n,
      gasFees: ethers.ZeroHash,
      paymasterAndData: "0x",
      signature,
    };

    const validationData = await wallet
      .connect(entryPoint)
      .validateUserOp.staticCall(userOp, ethers.ZeroHash, 0n);

    expect(validationData).to.eq(0n);
    await expect(
      wallet.connect(entryPoint).validateUserOp(userOp, ethers.ZeroHash, 0n),
    ).to.not.be.reverted;
  });

  it("無効なZK proofではrevertする", async () => {
    const { entryPoint, wallet, verifier, commitment } = await deployFixture();
    await verifier.setResult(false);

    const userOp = {
      sender: await wallet.getAddress(),
      nonce: 0n,
      initCode: "0x",
      callData: "0x",
      accountGasLimits: ethers.ZeroHash,
      preVerificationGas: 0n,
      gasFees: ethers.ZeroHash,
      paymasterAndData: "0x",
      signature: buildSignature(commitment),
    };

    await expect(
      wallet.connect(entryPoint).validateUserOp(userOp, ethers.ZeroHash, 0n),
    ).to.be.revertedWithCustomError(wallet, "InvalidProof");
  });

  it("public signalがvoiceCommitmentと不一致ならrevertする", async () => {
    const { entryPoint, wallet } = await deployFixture();
    const wrongCommitment = ethers.keccak256(ethers.toUtf8Bytes("wrong"));

    const userOp = {
      sender: await wallet.getAddress(),
      nonce: 0n,
      initCode: "0x",
      callData: "0x",
      accountGasLimits: ethers.ZeroHash,
      preVerificationGas: 0n,
      gasFees: ethers.ZeroHash,
      paymasterAndData: "0x",
      signature: buildSignature(wrongCommitment),
    };

    await expect(
      wallet.connect(entryPoint).validateUserOp(userOp, ethers.ZeroHash, 0n),
    ).to.be.revertedWithCustomError(wallet, "InvalidPublicSignal");
  });

  it("ETH送金関数で送金できる", async () => {
    const { owner, recipient, wallet } = await deployFixture();
    const amount = ethers.parseEther("0.2");

    await owner.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther("1"),
    });

    await expect(
      wallet.connect(owner).executeEthTransfer(recipient.address, amount),
    ).to.changeEtherBalances([wallet, recipient], [-amount, amount]);
  });

  it("ERC20 transfer関数でトークン送金できる", async () => {
    const { owner, recipient, wallet } = await deployFixture();
    const tokenFactory = await ethers.getContractFactory("MockERC20");
    const token = await tokenFactory.deploy();
    await token.waitForDeployment();

    const amount = ethers.parseUnits("10", 18);
    await token.mint(await wallet.getAddress(), amount);

    await expect(
      wallet
        .connect(owner)
        .executeERC20Transfer(
          await token.getAddress(),
          recipient.address,
          amount,
        ),
    ).to.not.be.reverted;

    expect(await token.balanceOf(recipient.address)).to.eq(amount);
  });
});
