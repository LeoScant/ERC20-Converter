import { ERC20_ABI, TOKENS, UNISWAP_ROUTER_ABI, UNISWAP_ROUTER_ADDRESS, UNISWAP_FACTORY_ABI, UNISWAP_FACTORY_ADDRESS, UNISWAP_V2_PAIR_ABI } from '@/constants/tokens';
import { BrowserProvider, Contract, ethers } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

export default function UniswapTrade() {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [swapAmount, setSwapAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapType, setSwapType] = useState<'EURT_TO_TATA' | 'TATA_TO_EURT'>('EURT_TO_TATA');
  const [estimatedOutput, setEstimatedOutput] = useState<string>('0');

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
      // Only get EURT and TATA balances
      const relevantTokens = {
        EURT: TOKENS.EURT,
        TATA: TOKENS.TATA
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
    } finally {
      setIsLoading(false);
    }
  }, []);

  const estimateSwapOutput = useCallback(async (amount: string) => {
    if (!provider || !amount || Number(amount) <= 0) {
      setEstimatedOutput('0');
      return;
    }

    try {
      // Use provider for read-only operations instead of signer
      const router = new Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, provider);
      const path = swapType === 'EURT_TO_TATA' 
        ? [TOKENS.EURT, TOKENS.TATA]
        : [TOKENS.TATA, TOKENS.EURT];

      const inputDecimals = swapType === 'EURT_TO_TATA' ? 6 : 18;
      const outputDecimals = swapType === 'EURT_TO_TATA' ? 18 : 6;
      
      const amountIn = ethers.parseUnits(amount, inputDecimals);
      console.log("Estimating swap:", {
        amountIn: amountIn.toString(),
        path,
        inputDecimals,
        outputDecimals,
        routerAddress: UNISWAP_ROUTER_ADDRESS
      });

      // First check if the pair exists
      const factory = new Contract(UNISWAP_FACTORY_ADDRESS, UNISWAP_FACTORY_ABI, provider);
      const pairAddress = await factory.getPair(path[0], path[1]);
      
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        console.error('No liquidity pair exists for these tokens');
        setEstimatedOutput('0');
        return;
      }

      console.log('Found pair address:', pairAddress);

      // Check if both tokens exist and are accessible
      for (const tokenAddress of path) {
        try {
          const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
          const symbol = await tokenContract.symbol();
          const decimals = await tokenContract.decimals();
          console.log(`Token ${tokenAddress} verified - Symbol: ${symbol}, Decimals: ${decimals}`);
        } catch (error) {
          console.error(`Failed to verify token at address ${tokenAddress}:`, error);
          setEstimatedOutput('0');
          return;
        }
      }

      //check reserves of the pair
      const pairContract = new Contract(pairAddress, UNISWAP_V2_PAIR_ABI, provider);
      const reserves = await pairContract.getReserves();
      console.log('Reserves:', reserves);

      const amounts = await router.getAmountsOut(amountIn, path);
      console.log('Amounts calculated:', amounts.map((a: bigint) => a.toString()));
      setEstimatedOutput(ethers.formatUnits(amounts[1], outputDecimals));
    } catch (error: Error | unknown) {
      console.error('Error estimating swap output:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        if (error.message.includes('insufficient')) {
          console.error('Insufficient liquidity in the pool');
        } else if (error.message.includes('UNPREDICTABLE_GAS_LIMIT')) {
          console.error('Gas estimation failed - the swap may not be possible');
        }
      }
      setEstimatedOutput('0');
    }
  }, [provider, swapType]);

  useEffect(() => {
    estimateSwapOutput(swapAmount);
  }, [swapAmount, swapType, estimateSwapOutput]);

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
      const router = new Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, signer);
      
      const path = swapType === 'EURT_TO_TATA' 
        ? [TOKENS.EURT, TOKENS.TATA]
        : [TOKENS.TATA, TOKENS.EURT];

      const inputToken = new Contract(
        swapType === 'EURT_TO_TATA' ? TOKENS.EURT : TOKENS.TATA,
        ERC20_ABI,
        signer
      );

      const inputDecimals = swapType === 'EURT_TO_TATA' ? 6 : 18;
      const amountIn = ethers.parseUnits(swapAmount, inputDecimals);

      // Check balance
      const balance = await inputToken.balanceOf(account);
      if (balance < amountIn) {
        throw new Error(`Insufficient ${swapType === 'EURT_TO_TATA' ? 'EURT' : 'TATA'} balance`);
      }

      // Check and set allowance if needed
      const currentAllowance = await inputToken.allowance(account, UNISWAP_ROUTER_ADDRESS);
      if (currentAllowance < amountIn) {
        console.log('Approving token spend...');
        const approveTx = await inputToken.approve(UNISWAP_ROUTER_ADDRESS, amountIn);
        await approveTx.wait();
        console.log('Approval confirmed');
      }

      // Calculate minimum output amount (with 0.5% slippage tolerance)
      const amounts = await router.getAmountsOut(amountIn, path);
      const minOutput = (amounts[1] * BigInt(995)) / BigInt(1000); // 0.5% slippage

      // Execute swap
      console.log('Executing swap...');
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
      const swapTx = await router.swapExactTokensForTokens(
        amountIn,
        minOutput,
        path,
        account,
        deadline
      );
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
          <Link 
            href="/"
            className="text-blue-500 hover:text-blue-600 transition-colors"
          >
            ← Back to EURT/TASK Swap
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            TATA/EURT Swap
          </h1>
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
              <h2 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-4">Swap Tokens</h2>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSwapType('EURT_TO_TATA')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 
                              ${swapType === 'EURT_TO_TATA'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    EURT → TATA
                  </button>
                  <button
                    onClick={() => setSwapType('TATA_TO_EURT')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 
                              ${swapType === 'TATA_TO_EURT'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                  >
                    TATA → EURT
                  </button>
                </div>

                <div>
                  <label className="text-gray-600 dark:text-gray-300 mb-2 block">
                    {swapType === 'EURT_TO_TATA' ? 'EURT Amount' : 'TATA Amount'}
                  </label>
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder={`Enter ${swapType === 'EURT_TO_TATA' ? 'EURT' : 'TATA'} amount`}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <p className="text-gray-600 dark:text-gray-300">
                    You will receive approximately:
                    <span className="font-mono font-medium text-purple-600 dark:text-purple-400 ml-2">
                      {estimatedOutput} {swapType === 'EURT_TO_TATA' ? 'TATA' : 'EURT'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Rate may vary due to market conditions. 0.5% slippage tolerance applied.
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