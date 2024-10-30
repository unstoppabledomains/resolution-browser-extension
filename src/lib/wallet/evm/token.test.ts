import {createErc20TransferTx} from "./token";

describe("token transactions", () => {
  it("should create an erc20 transfer tx", () => {
    const tx = createErc20TransferTx(
      80002,
      "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
      "0xCD0DAdAb45bAF9a06ce1279D1342EcC3F44845af",
      "0x8ee1E1d88EBE2B44eAD162777DE787Ef6A2dC2F2",
      1,
    );
    expect(tx).toMatchObject({
      chainId: 80002,
      to: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
      // expected data generated directly from Polygon scan using MetaMask:
      // https://amoy.polygonscan.com/token/0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582?a=0x8ee1e1d88ebe2b44ead162777de787ef6a2dc2f2#writeProxyContract
      data: "0xa9059cbb0000000000000000000000008ee1e1d88ebe2b44ead162777de787ef6a2dc2f20000000000000000000000000000000000000000000000000000000000000001",
      value: "0",
    });
  });
});
