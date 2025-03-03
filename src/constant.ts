import { ethers } from 'ethers';
import { defaultAbiCoder, keccak256 } from 'ethers/lib/utils';
import { getCreate2Address } from 'ethers/lib/utils';
import { solidityPack } from 'ethers/lib/utils';
import { piperv3_factory_abi } from './abi';
import { providers } from 'ethers';

const URL = 'https://mainnet.storyrpc.io';
export const provider = new providers.JsonRpcProvider(URL);

export const defaultTokens = [
  '0xF1815bd50389c46847f0Bda824eC8da914045D14',
  '0x1514000000000000000000000000000000000000'
]

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

export const fee2TickSpace = {"500": 10, "3000": 60, "10000": 200}

export const WIP_ADDRESS = "0x1514000000000000000000000000000000000000"

export const v2FactoryAddress = "0x6D3e2f58954bf4E1d0C4bA26a85a1b49b2e244C6"

export const v2RouterAddress = "0x674eFAa8C50cBEF923ECe625d3c276B7Bb1c16fB"

export const piperv3QuoterAddress = "0xe8CabF9d1FFB6CE23cF0a86641849543ec7BD7d5"

export const piperv3SwapRouterAddress = "0x8295c195CEe31404ea082d253a140310b9a0A37e"

export const piperv3FactoryAddress = "0xb8c21e89983B5EcCD841846eA294c4c8a89718f1"

export const piperv3NFTPositionManagerAddress = "0x700722D24f9256Be288f56449E8AB1D27C4a70ca" 

export const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11"

export const initCodeHashV2 = "0x823e88fdeb5597aaf4f360932ab07eb2ec6bb4dd75d44afb6814de02dd6cff9c"

export const initCodeHashV3 = "0xa8ffca5939bbe6e18e96df724ec3b3539269b282d1be4a535d654f640a37dcf5"

export const v2ComputeAddress = (token0: string, token1: string) => {
  const [token0Sorted, token1Sorted] = token0.toLowerCase() < token1.toLowerCase()
      ? [token0, token1]
      : [token1, token0]

  const salt = keccak256(solidityPack(['address', 'address'], [token0Sorted, token1Sorted]))
  const initCodeHash = initCodeHashV2

  return getCreate2Address(v2FactoryAddress, salt, initCodeHash) as `0x${string}`
}

export const v3ComputeAddress = async (
  token0: string, 
  token1: string, 
  fee: number
) => {
  const [token0Sorted, token1Sorted] = token0.toLowerCase() < token1.toLowerCase()
      ? [token0, token1]
      : [token1, token0]

  const salt = keccak256(defaultAbiCoder.encode(['address', 'address', 'uint24'], [token0Sorted, token1Sorted, fee]));
  const initCodeHash = initCodeHashV3

  return getCreate2Address(piperv3FactoryAddress, salt, initCodeHash) as `0x${string}`  
}