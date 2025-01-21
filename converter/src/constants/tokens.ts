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

export const TOKENS = {
  EURT: "0xB0eBD04Aca1C317ddf75277Fad3E2090a41deD4e",
  TASK: "0x1Ab193C1Be11C64654896390f0ed550c59E041e4"
} as const;

export const SWAP_ADDRESS = "0xcE969bA324d60A602e8EB330B242d3cb2D477c10"; 