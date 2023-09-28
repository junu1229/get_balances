## 링크 및 로그인 진행

- https://dashboard.web3auth.io/login

## 프로젝트 생성 시

- Project Name: 프로젝트 이름 설정
- Select Product: Plug and Play
- Platform Type: Web Application
- Environment: Sapphire Devnet
- Select Chain You Are Building On: EVM Based Chain
- Allow user's private key usage in given wallets: Check!

## config-overrides.js 생성

```js
const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify'),
    url: require.resolve('url'),
    zlib: false,
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ]);
  config.ignoreWarnings = [/Failed to parse source map/];
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: 'pre',
    loader: require.resolve('source-map-loader'),
    resolve: {
      fullySpecified: false,
    },
  });
  return config;
};
```

## package.json 내용 추가 및 수정

```json
"devDependencies": {
"assert": "^2.0.0",
"buffer": "^6.0.3",
"crypto-browserify": "^3.12.0",
"eslint-config-react-app": "^7.0.1",
"https-browserify": "^1.0.0",
"os-browserify": "^0.3.0",
"process": "^0.11.10",
"react-app-rewired": "^2.2.1",
"stream-browserify": "^3.0.0",
"stream-http": "^3.2.0",
"url": "^0.11.0"
},
"scripts": {
"start": "react-app-rewired start",
"build": "react-app-rewired build",
"test": "react-app-rewired test",
"eject": "react-scripts eject"
}
```

## npm 설치 목록

```
npm install --save web3
npm install --save @web3auth/no-modal @web3auth/base
npm i @kanalabs/mirai
```

## src/web3RPC.ts 생성

```ts
import type { IProvider } from '@web3auth/base';
import Web3 from 'web3';

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
        method: 'eth_private_key',
      });

      return privateKey;
    } catch (error) {
      return error as string;
    }
  }
}
```

## APP.tsx 클라이언트 id 및 체인설정 코드

```tsx
const clientId = '프로젝트 클라이언트 ID';
const chainConfig = {
  chainNamespace: 'eip155',
  chainId: '0x1',
  rpcTarget: 'https://rpc.ankr.com/eth',
  displayName: 'Ethereum Mainnet',
  blockExplorer: 'https://goerli.etherscan.io',
  ticker: 'ETH',
  tickerName: 'Ethereum',
};
```

## App.tsx import 5개

```tsx
import { useEffect, useState } from 'react';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { IProvider } from '@web3auth/base';
```

## 2개의 useState 선언

```tsx
const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
const [provider, setProvider] = useState<IProvider | null>(null);
```

## useEffect 코드

```tsx
useEffect(() => {
  const init = async () => {
    try {
      const web3auth = new Web3AuthNoModal({
        clientId,
        web3AuthNetwork: 'testnet',
        chainConfig: {
          chainNamespace: 'eip155',
          chainId: '0x1',
          rpcTarget: 'https://rpc.ankr.com/eth',
        },
      });

      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: { chainConfig },
      });

      const openloginAdapter = new OpenloginAdapter({
        privateKeyProvider,
        adapterSettings: {
          network: 'mainnet',
          clientId,
        },
        loginSettings: {
          mfaLevel: 'none',
        },
      });
      web3auth.configureAdapter(openloginAdapter);
      setWeb3auth(web3auth);
      await web3auth.init();
    } catch (error) {
      console.error(error);
    }
  };

  init();
}, []);
```

## 3가지 import

```tsx
import { WALLET_ADAPTERS } from '@web3auth/base';
import {
  NetworkNames,
  SDKGateway,
  initializeSdkGateway,
} from '@kanalabs/mirai';
import RPC from './web3RPC';
```

## 3가지 useState 추가

```tsx
const [sdkGateway, setSdkGateway] = useState<SDKGateway>();
const [mumbaiInstance, setMumbaiInstance] = useState<any>(null);
const [balance, setBalance] = useState<string>();
```

## 로그인 코드

```tsx
const login = async () => {
  if (!web3auth) {
    return;
  }
  const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
    mfaLevel: 'default',
    loginProvider: 'google',
  });
  setProvider(web3authProvider);
  if (!web3authProvider) {
    return;
  }
  const rpc = new RPC(web3authProvider);
  const privateKey = await rpc.getPrivateKey();
  console.log(privateKey);
  const sdkGateway = await initializeSdkGateway(
    { privateKey: '0x' + privateKey },
    { networks: [NetworkNames.Mumbai] }
  );
  console.log(typeof sdkGateway);
  setSdkGateway(sdkGateway);

  const mumbaiInstance = sdkGateway.setCurrentInstance(NetworkNames.Mumbai);
  setMumbaiInstance(mumbaiInstance);
};
```

## 로그아웃 코드

```tsx
const logout = async () => {
  if (!web3auth) {
    console.log('web3auth not initialized yet');
    return;
  }
  await web3auth.logout();
  setProvider(null);
  console.log('logout');
  setBalance('');
  await sdkGateway?.destroy();
};
```

## 잔액 확인 코드

```tsx
const checkBalance = async () => {
  const address = await mumbaiInstance.getCounterFactualAddress();
  const balances = await mumbaiInstance.getNativeBalance();
  setBalance(balances);
};
```
