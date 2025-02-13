import { ethers } from "hardhat";
import { TransactionResponse } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Initializing EURT/TATA liquidity pool with account:", deployer.address);

  // Indirizzi dei token e del router (sui quali si basa la factory)
  const TATA_ADDRESS = "0xF9B68BF808d59d53f42defd09Ef355fE29EeCcA2";    // Indirizzo token TATA
  const EURT_ADDRESS = "0x2963EB3234cdE23de571d65Cfa32b491AEbafcEb";      // Indirizzo token EURT
  const UNISWAP_ROUTER_ADDRESS = "0x320565d880a1979Af45589D0fe48BbE6673D51D3"; // Router Uniswap V2 (Sepolia)

  try {
    // Ottenimento delle istanze dei contratti
    const TATA = await ethers.getContractAt("TATA", TATA_ADDRESS);
    const EURT = await ethers.getContractAt("EURT", EURT_ADDRESS);
    const UniswapV2Router = await ethers.getContractAt("IUniswapV2Router02", UNISWAP_ROUTER_ADDRESS);

    // Recupera l'indirizzo della factory dal router
    const factoryAddress = await UniswapV2Router.factory();
    console.log("Factory address:", factoryAddress);

    // Istanza della factory e verifica della coppia
    const factory = await ethers.getContractAt("IUniswapV2Factory", factoryAddress);
    let pairAddress = await factory.getPair(TATA_ADDRESS, EURT_ADDRESS);
    console.log("Existing pair address:", pairAddress);

    // Se la coppia non esiste, la crea
    if (pairAddress === ethers.ZeroAddress) {
      console.log("Pair doesn't exist. Creating new pair...");
      const tx = await factory.createPair(TATA_ADDRESS, EURT_ADDRESS);
      console.log("Waiting for pair creation transaction to be mined...");
      await tx.wait();
      
      // Recupera il nuovo indirizzo della pair
      pairAddress = await factory.getPair(TATA_ADDRESS, EURT_ADDRESS);
      console.log("Pair created at address:", pairAddress);
    } else {
      console.log("Pair already exists. Continuing with initialization...");
    }

    // Istanza della pair e lettura delle riserve
    const pair = await ethers.getContractAt("IUniswapV2Pair", pairAddress);
    const reserves = await pair.getReserves();

    // Determina l'ordine dei token nella pair
    const token0 = await pair.token0();
    const isTATAToken0 = token0.toLowerCase() === TATA_ADDRESS.toLowerCase();
    const [reserveTATA, reserveEURT] = isTATAToken0
      ? [reserves[0], reserves[1]]
      : [reserves[1], reserves[0]];

    // Se la pool non è ancora inizializzata (riserve uguali a 0), esegue il seeding
    if (reserveTATA === 0n && reserveEURT === 0n) {
      console.log("Initializing liquidity pool with 80 TATA and 80,000 EURT at a rate of 1 TATA = 1000 EURT...");

      // Quantità da depositare nella pool:
      const initTATAAmount = ethers.parseUnits("80", 18);
      const initEURTAmount = ethers.parseUnits("80000", 6);

      // Compensazione per la fee di trasferimento di TATA (~0.5% fee)
      const initTATAWithFee = (initTATAAmount * 1000n) / 995n;

      // Trasferimento dei token direttamente al contratto della pair
      let tx: TransactionResponse = await TATA.transfer(pairAddress, initTATAWithFee);
      await tx.wait();
      console.log("Transferred TATA to pair.");

      tx = await EURT.transfer(pairAddress, initEURTAmount);
      await tx.wait();
      console.log("Transferred EURT to pair.");

      // Mint dei token LP per il deployer
      tx = await pair.mint(deployer.address);
      await tx.wait();
      console.log("Liquidity pool initialized, LP tokens minted to:", deployer.address);

      // Visualizza le nuove riserve della pool
      const newReserves = await pair.getReserves();
      const [newReserveTATA, newReserveEURT] = isTATAToken0
        ? [newReserves[0], newReserves[1]]
        : [newReserves[1], newReserves[0]];

      console.log("Liquidity pool reserves:", {
        TATA: ethers.formatUnits(newReserveTATA, 18),
        EURT: ethers.formatUnits(newReserveEURT, 6)
      });
    } else {
      console.log("Liquidity pool is already initialized. Current reserves:");
      console.log({
        TATA: ethers.formatUnits(reserveTATA, 18),
        EURT: ethers.formatUnits(reserveEURT, 6)
      });
    }

  } catch (error: any) {
    console.error("Error initializing liquidity pool:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in main:", error);
    process.exit(1);
  });