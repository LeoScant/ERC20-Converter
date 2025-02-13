export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

export const SWAP_ABI = [
  "function swapEURTtoTASK(uint256 _eurtAmount)",
  "function conversionRate() view returns (uint256)"
];

export const UNISWAP_ROUTER_ABI = [
  // Factory and WETH functions
  "function factory() external pure returns (address)",
  "function WETH() external pure returns (address)",
  
  // Add Liquidity
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
  
  // Remove Liquidity
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountToken, uint amountETH)",
  "function removeLiquidityETHSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external returns (uint amountETH)",
  "function removeLiquidityWithPermit(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountA, uint amountB)",
  "function removeLiquidityETHWithPermit(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountToken, uint amountETH)",
  "function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint amountETH)",
  
  // Price/Amount Calculation Functions
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] memory path) public view returns (uint[] memory amounts)",
  "function quote(uint amountA, uint reserveA, uint reserveB) external pure returns (uint amountB)",
  "function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)",
  "function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) external pure returns (uint amountIn)",
  
  // Swap Functions
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
];

export const TOKENS = {
  EURT: "0x2963EB3234cdE23de571d65Cfa32b491AEbafcEb",
  TASK: "0xb14345b782ecF1B56F445ff24e00f76ce3e2571E",
  TATA: "0xF9B68BF808d59d53f42defd09Ef355fE29EeCcA2"
} as const;

export const SWAP_ADDRESS = "0xD60b00f239bD33734B34dB2F5eF44c843db43E36";
export const UNISWAP_ROUTER_ADDRESS = "0x320565d880a1979Af45589D0fe48BbE6673D51D3"; 
export const UNISWAP_FACTORY_ADDRESS = "0x89a067753F7E701EF63Cc396fd47864255bAd72b";
export const WETH_ADDRESS = "0x7b79995e5f793a07bc00c21412e50ecae098e7f9";

export const UNISWAP_FACTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenA",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenB",
        "type": "address"
      }
    ],
    "name": "getPair",
    "outputs": [
      {
        "internalType": "address",
        "name": "pair",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export const UNISWAP_V2_PAIR_ABI = [
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)"
];