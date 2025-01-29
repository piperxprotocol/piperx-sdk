import { ethers } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
import { getCreate2Address } from 'ethers/lib/utils';
import { solidityPack } from 'ethers/lib/utils';
import { piperv3_factory_abi } from './abi';

const URL = 'https://odyssey.storyrpc.io/'
export const provider = new ethers.providers.JsonRpcProvider(URL);
export const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider)

export const defaultTokens = [
  '0x40fCa9cB1AB15eD9B5bDA19A52ac00A78AE08e1D',
  '0x02F75bdBb4732cc6419aC15EeBeE6BCee66e826f',
  '0x6D46EF45795B1c3e2a5f2A3F7aba5ea551be966f'
]

export const fee2TickSpace = {"500": 10, "3000": 60, "10000": 200}

export const WIP_ADDRESS = "0xe8CabF9d1FFB6CE23cF0a86641849543ec7BD7d5"

export const v2FactoryAddress = "0x700722D24f9256Be288f56449E8AB1D27C4a70ca"

export const v2RouterAddress = "0x8812d810EA7CC4e1c3FB45cef19D6a7ECBf2D85D"

export const piperv3QuoterAddress = "0x82C210d4aA5948f68E46Af355C0399c2E921e8e4"

export const piperv3SwapRouterAddress = "0xbBb8B63596d5447a12Ddee557ac9fA326f42B57D"

export const piperv3FactoryAddress = "0xf3d448d7A83F749695c49d8411247fC3868fB633" // "0xDbc2D2C9514A50E905355388b8474fF3E7c59065" // "0x29330ED17323ecF354cE4AE871b2051cAF73E36D"

export const piperv3NFTPositionManagerAddress = "0xf03c65d9be145746f800E2781eD140F6dd238F38" //"0xBbd6437059feFa1E525645206eBc4cE942996f06" //"0xC938d8751164699c849716Ae504035601D485104"

export const multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11"

export const v2ComputeAddress = (token0: string, token1: string) => {
  const [token0Sorted, token1Sorted] = token0.toLowerCase() < token1.toLowerCase()
      ? [token0, token1]
      : [token1, token0]

  const salt = keccak256(solidityPack(['address', 'address'], [token0Sorted, token1Sorted]))
  const initCodeHash = "0x754f724019203c806610a02ada224eb21dbe068a93d50486e52cf0ae30de457a"

  return getCreate2Address(v2FactoryAddress, salt, initCodeHash) as `0x${string}`
}

export const v3ComputeAddress = async (
  token0: string, 
  token1: string, 
  fee: number
): Promise<string> => {
  
  const contract = new ethers.Contract(piperv3FactoryAddress, piperv3_factory_abi, provider);
  
  const poolAddress = await contract.getPool(
    token0,
    token1,
    fee
  );
  
  return poolAddress;
}