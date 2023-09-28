import type { IProvider } from "@web3auth/base";
import Web3 from "web3";

export default class EthereumRpc {
  private provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  // 유저 계정 가져오기
  async getAccounts(): Promise<any> {
    try {
      const web3 = new Web3(this.provider as any);

      const address = (await web3.eth.getAccounts())[0];

      return address;
    } catch (error) {
      return error;
    }
  }

  // 프라이빗 키 가져오기 (Mirai SDK 연결 시 사용 됨)
  async getPrivateKey(): Promise<any> {
    try {
      const privateKey = await this.provider.request({
        method: "eth_private_key",
      });

      return privateKey;
    } catch (error) {
      return error as string;
    }
  }
}