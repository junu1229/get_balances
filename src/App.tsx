import React from 'react';
import kanalogo from './logo.svg';
import { useEffect, useState } from 'react';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { IProvider } from '@web3auth/base';
import { WALLET_ADAPTERS } from '@web3auth/base';
import { NetworkNames, SDKGateway, initializeSdkGateway } from "@kanalabs/mirai";
import RPC from "./web3RPC";

const clientId = 'BEu0FZHBVQCJ3AUr4R7XWvUXHsGauHM0a0yiKJ0nRSy-zZStEWbQnq2yPvJqpNhmp3ywDsFWKtHoBtwY-bLY2WU';
const chainConfig = {
  chainNamespace: "eip155",
  chainId: "0x1",
  rpcTarget: "https://rpc.ankr.com/eth",
  displayName: "Ethereum Mainnet",
  blockExplorer: "https://goerli.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
};

function App() {

  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [sdkGateway, setSdkGateway] = useState<SDKGateway>();
  const [mumbaiInstance, setMumbaiInstance] = useState<any>(null);
  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    const init = async () => {
      try {
        const web3auth = new Web3AuthNoModal({
          clientId, 
          web3AuthNetwork: "testnet", 
          chainConfig: {
            chainNamespace: 'eip155',
            chainId: "0x1",
            rpcTarget: "https://rpc.ankr.com/eth",
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

  const login = async () => {
    if (!web3auth) {
      return;
    }
    const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      mfaLevel: "default", 
      loginProvider: "google",
    });
    setProvider(web3authProvider);
    if (!web3authProvider) {
      return;
    }
    const rpc = new RPC(web3authProvider);
    const privateKey = await rpc.getPrivateKey();
    console.log(privateKey);
    const sdkGateway = await initializeSdkGateway({ privateKey: '0x' + privateKey }, { networks: [NetworkNames.Mumbai] })
    console.log(typeof(sdkGateway));
    setSdkGateway(sdkGateway);

    const mumbaiInstance = sdkGateway.setCurrentInstance(NetworkNames.Mumbai);
    setMumbaiInstance(mumbaiInstance);
  };

  const logout = async () => {
    if (!web3auth) {
      console.log("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    console.log('logout');
    setBalance('');
    await sdkGateway?.destroy();
  };

  const checkBalance = async () => {
    const address = await mumbaiInstance.getCounterFactualAddress();
    const balances = await mumbaiInstance.getNativeBalance();
    setBalance(balances);
  };



  const loggedInView = (
    <>
    <button onClick={logout} style={{backgroundColor: 'white', border: '0', borderRadius: '20px', width: '20%', height: '100px', marginTop: '150px', fontSize: '60px', fontFamily: 'sans-serif' }}>logout</button>
    <button onClick={checkBalance} style={{backgroundColor: 'white', border: '0', borderRadius: '20px', width: '20%', height: '100px', marginTop: '150px', fontSize: '60px', fontFamily: 'sans-serif' }}>Check balance</button>
    <div style={{backgroundColor: 'white', border: '0', borderRadius: '20px', width: '20%', height: '100px', marginTop: '150px', fontSize: '60px', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{marginRight: '30px'}}>balance: </p>
      <p>{balance}</p>
    </div>
    </>
  );
    
  const unloggedInView = (
    <>
    <button onClick={login} style={{backgroundColor: 'white', border: '0', borderRadius: '20px', width: '20%', height: '100px', marginTop: '150px', fontSize: '60px', fontFamily: 'sans-serif' }}>Login</button>
    </>
  );
      
  return (
    <div style={{backgroundColor: 'black', height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
      <img style={{width: '40%'}} src={kanalogo}></img>
      {provider ? loggedInView  : unloggedInView }
    </div>
  );
}

export default App;
