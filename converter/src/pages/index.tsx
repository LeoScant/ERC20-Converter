import { ERC20_ABI, SWAP_ABI, SWAP_ADDRESS, TOKENS } from '@/constants/tokens';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [swapAmount, setSwapAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [conversionRate, setConversionRate] = useState<number>(2);

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
      // Only get EURT and TASK balances
      const relevantTokens = {
        EURT: TOKENS.EURT,
        TASK: TOKENS.TASK
      };
      
      for (const [name, address] of Object.entries(relevantTokens)) {
        try {
          const { formatted, symbol } = await getTokenBalance(address, account, provider);
          balances[name] = `${formatted} ${symbol}`;
        } catch (error) {
          console.error(`Error fetching ${name} balance:`, error);
          balances[name] = 'Error';
        }
      }
      setTokenBalances(balances);

      // Get conversion rate from Swap contract
      const swapContract = new Contract(SWAP_ADDRESS, SWAP_ABI, provider);
      const rate = await swapContract.conversionRate();
      setConversionRate(Number(rate));
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

  const handleSwap = async () => {
    if (!provider || !account || !swapAmount) return;

    try {
      setIsSwapping(true);
      const signer = await provider.getSigner();
      const eurtContract = new Contract(TOKENS.EURT, ERC20_ABI, signer);
      const swapContract = new Contract(SWAP_ADDRESS, SWAP_ABI, signer);

      // Get EURT decimals
      const eurtDecimals = await eurtContract.decimals();

      // Parse amount with correct decimals
      const eurtAmount = ethers.parseUnits(swapAmount, eurtDecimals);

      // Check EURT balance
      const eurtBalance = await eurtContract.balanceOf(account);
      if (eurtBalance < eurtAmount) {
        throw new Error(`Insufficient EURT balance. You have ${ethers.formatUnits(eurtBalance, eurtDecimals)} EURT`);
      }

      // Check if we need to approve
      const currentAllowance = await eurtContract.allowance(account, SWAP_ADDRESS);
      if (currentAllowance < eurtAmount) {
        console.log('Approving EURT spend...');
        const approveTx = await eurtContract.approve(SWAP_ADDRESS, eurtAmount);
        await approveTx.wait();
        console.log('Approval confirmed');
      }

      // Execute swap
      console.log('Executing swap...');
      const swapTx = await swapContract.swapEURTtoTASK(eurtAmount);
      await swapTx.wait();
      console.log('Swap completed');

      await updateBalances(account, provider);
      setSwapAmount('');
      alert('Swap completed successfully!');
    } catch (error: unknown) {
      console.error('Error during swap:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Error during swap. Check console for details.');
      }
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-2xl mx-auto p-6">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            EURT to TASK Swap
          </h1>
          <Link 
            href="/uniswap"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            TATA/EURT Swap →
          </Link>
        </div>
        
        {!isConnected ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <p className="text-lg text-center mb-6 text-gray-600 dark:text-gray-300">
                Connect your MetaMask wallet to start swapping tokens
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
                {Object.entries(tokenBalances).map(([name, balance]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <span className="text-gray-600 dark:text-gray-300">{name} Balance</span>
                    <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                      {isLoading ? (
                        <div className="animate-pulse bg-purple-200 dark:bg-purple-800 h-6 w-24 rounded"></div>
                      ) : (
                        balance
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-4">Swap EURT to TASK</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-gray-600 dark:text-gray-300 mb-2 block">
                    EURT Amount to Swap
                  </label>
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="Enter EURT amount"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-gray-600 dark:text-gray-300">
                    You will receive:
                    <span className="font-mono font-medium text-purple-600 dark:text-purple-400 ml-2">
                      {Number(swapAmount) / conversionRate} TASK
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Rate: {conversionRate} EURT = 1 TASK
                  </p>
                </div>

                <button
                  onClick={handleSwap}
                  disabled={!swapAmount || isSwapping || isLoading}
                  className="w-full px-6 py-3 text-lg font-medium text-white transition-all duration-200 
                           bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl
                           hover:from-blue-600 hover:to-purple-600 
                           focus:ring-2 focus:ring-blue-300 focus:outline-none
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSwapping ? 'Swapping...' : 'Swap Tokens'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
