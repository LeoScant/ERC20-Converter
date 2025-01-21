# AudaSynth Project

AudaSynth is a decentralized application that enables users to swap between EURT (Euro Token) and TASK tokens. The project consists of a Next.js frontend application and Solidity smart contracts deployed on the Sepolia testnet.

## Project Structure

The project is organized into two main parts:

### Frontend Application (`/converter`)
- Built with Next.js and TypeScript
- Modern and responsive UI for token swapping
- Real-time conversion rate display
- Wallet connection and transaction management
- Token balance display and management

### Smart Contracts (`/smart-contracts`)
The project includes three main smart contracts:

1. **EURT Token** ([View on Etherscan](https://sepolia.etherscan.io/address/0x7c3Ce3E3bC9cdf810BE79428A340D01B57abDDA8))
   - ERC20 token representing Euro Token
   - 6 decimals precision
   - Features: minting, burning, and blacklisting capabilities
   - Role-based access control for administrative functions

2. **TASK Token** ([View on Etherscan](https://sepolia.etherscan.io/address/0xD0dCCeefA103ed98706cAAF138eB896f26A0e558))
   - ERC20 token with 18 decimals precision
   - Features: minting, burning, and blacklisting capabilities
   - Role-based access control for administrative functions

3. **Swap Contract** ([View on Etherscan](https://sepolia.etherscan.io/address/0x5eAEC45A2b2d125f164aE5716eDC09Dc504cd481))
   - Manages the conversion between EURT and TASK tokens
   - Configurable conversion rate
   - Automatic token burning and minting during swaps
   - Owner-controlled rate adjustment

## Features

- **Token Swapping**: Convert between EURT and TASK tokens at the current conversion rate
- **Role-Based Access**: Secure management of token minting, burning, and blacklisting
- **Blacklist Management**: Ability to restrict specific addresses from token transfers
- **Dynamic Conversion Rate**: Adjustable rate for token conversion
- **User-Friendly Interface**: Easy-to-use frontend for performing swaps and viewing balances

## Smart Contract Addresses (Sepolia Testnet)

- EURT Token: [`0x7c3Ce3E3bC9cdf810BE79428A340D01B57abDDA8`](https://sepolia.etherscan.io/address/0x7c3Ce3E3bC9cdf810BE79428A340D01B57abDDA8)
- TASK Token: [`0xD0dCCeefA103ed98706cAAF138eB896f26A0e558`](https://sepolia.etherscan.io/address/0xD0dCCeefA103ed98706cAAF138eB896f26A0e558)
- Swap Contract: [`0x5eAEC45A2b2d125f164aE5716eDC09Dc504cd481`](https://sepolia.etherscan.io/address/0x5eAEC45A2b2d125f164aE5716eDC09Dc504cd481)