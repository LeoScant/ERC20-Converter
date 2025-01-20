declare global {
  interface Window {
    ethereum: import('ethers').Eip1193Provider & {
      request: (args: { method: string; params?: string[] }) => Promise<string[]>;
      on: (event: 'accountsChanged', callback: (accounts: string[]) => void) => void;
    };
  }
}

import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
import styles from '@/styles/Home.module.css';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

const TOKENS = {
  EURT: "0xC29806E00A1c05d70A8eD6172BBA0992F01DcD29",
  TASK: "0xa368D6b0Efb29c167A943bd48765B95109f7b709"
};

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getTokenBalance = async (tokenAddress: string, account: string, provider: BrowserProvider) => {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(account);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();
    return { 
      formatted: ethers.formatUnits(balance, decimals),
      symbol 
    };
  };

  const updateBalances = useCallback(async (account: string, provider: BrowserProvider) => {
    setIsLoading(true);
    const balances: {[key: string]: string} = {};
    try {
      for (const [name, address] of Object.entries(TOKENS)) {
        try {
          const { formatted, symbol } = await getTokenBalance(address, account, provider);
          balances[name] = `${formatted} ${symbol}`;
        } catch (error) {
          console.error(`Error fetching ${name} balance:`, error);
          balances[name] = 'Error';
        }
      }
      setTokenBalances(balances);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await (window.ethereum as import('ethers').Eip1193Provider & { 
          request: (args: { method: string; params?: string[] }) => Promise<string[]> 
        }).request({ method: 'eth_requestAccounts' });
        const provider = new BrowserProvider(window.ethereum);
        setProvider(provider);
        
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        setIsConnected(true);

        const balance = await provider.getBalance(address);
        setEthBalance(ethers.formatEther(balance));

        await updateBalances(address, provider);
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (provider) {
            const balance = await provider.getBalance(accounts[0]);
            setEthBalance(ethers.formatEther(balance));
            await updateBalances(accounts[0], provider);
          }
        } else {
          setIsConnected(false);
          setAccount('');
          setEthBalance('0');
          setTokenBalances({});
        }
      });
    }
  }, [provider, updateBalances]);

  return (
    <div className={styles.container}>
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          Wallet Balance Checker
        </h1>
        
        {!isConnected ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <p className="text-lg text-center mb-6 text-gray-600 dark:text-gray-300">
                Connect your MetaMask wallet to view your token balances
              </p>
              <button
                onClick={connectWallet}
                className="flex items-center justify-center w-full px-6 py-3 text-lg font-medium text-white transition-all duration-200 
                         bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl hover:from-blue-600 hover:to-purple-600 
                         focus:ring-2 focus:ring-blue-300 focus:outline-none"
              >
                Connect MetaMask
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-3">Connected Account</h2>
              <p className="font-mono text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg break-all">
                {account}
              </p>
            </div>
            
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-4">Token Balances</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">ETH Balance</span>
                  <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                    {isLoading ? (
                      <div className="animate-pulse bg-blue-200 dark:bg-blue-800 h-6 w-24 rounded"></div>
                    ) : (
                      `${ethBalance} ETH`
                    )}
                  </span>
                </div>
                {Object.entries(TOKENS).map(([name]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">{name} Balance</span>
                    <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                      {isLoading ? (
                        <div className="animate-pulse bg-purple-200 dark:bg-purple-800 h-6 w-24 rounded"></div>
                      ) : (
                        tokenBalances[name] || '0'
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
