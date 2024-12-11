import { abi, v2_factory_abi, v2_pool_abi, v2_router_abi} from './abi.js'
import { WIP_ADDRESS, provider, v2ComputeAddress, v2RouterAddress } from './constant.js'
import { ethers } from 'ethers'
import { routingExactInput } from './routing.js'
import { keccak256 } from 'ethers/lib/utils.js'
import axios from 'axios';

export const v2GetPrice = async(
    token1: string,
    token2: string
) => {
    const pairAddress = await v2ComputeAddress(token1, token2);
    
    const pairContract = new ethers.Contract(pairAddress, v2_pool_abi, provider);
    
    try {
        const [reserve1, reserve2] = await pairContract.getReserves();
        
        // Determine token order (tokens are stored in ascending order by address in Uniswap V2)
        const token1_ = token1.toLowerCase() < token2.toLowerCase() ? token1 : token2;
        
        // Calculate price based on reserves
        const price = token1_ === token1 
            ? reserve2.toString() / reserve1.toString()
            : reserve1.toString() / reserve2.toString();
            
        return price;
    } catch (error) {
        console.error("Error fetching reserves:", error);
        throw error;
    }
}

export const v2GetPriceWithDecimals = async(
    token1: string,
    token2: string,
    decimal1: number,
    decimal2: number
) => {
    const price = await v2GetPrice(token1, token2);
    return price * 10 ** (decimal1 - decimal2);
}

export const v2Swap = async(
    amount1: bigint,
    amount2Min: bigint,
    path: string[], 
    expirationTimestamp: bigint,
    signer: ethers.Signer
) => {
    try {
        const router = new ethers.Contract(v2RouterAddress, v2_router_abi, signer);
        let tx;

        if (path[0] == WIP_ADDRESS) { // swap Exact ETH for tokens
            tx = await router.swapExactETHForTokens(
                amount2Min,
                path,
                signer.getAddress(),
                expirationTimestamp,
                { value: amount1 }
            );
        } else if (path[path.length - 1] == WIP_ADDRESS) { // swap Exact tokens for ETH
            tx = await router.swapExactTokensForETH(
                amount1,
                amount2Min,
                path,
                signer.getAddress(),
                expirationTimestamp
            );
        } else {
            tx = await router.swapExactTokensForTokens(
                amount1,
                amount2Min,
                path,
                signer.getAddress(),
                expirationTimestamp
            );
        }

        return await tx.wait();
    } catch (error) {
        console.error("Error in swap:", error);
        throw error;
    }
}

export const v2AddLiquidity = async(
    token1: string,
    token2: string,
    amount1: bigint,
    amount2: bigint,
    amount1Min: bigint,
    amount2Min: bigint,
    expirationTimestamp: bigint,
    signer: ethers.Signer
) => {
    try {
        const router = new ethers.Contract(v2RouterAddress, v2_router_abi, signer);
        let tx;

        if (token1 == WIP_ADDRESS) {
            tx = await router.addLiquidityETH(
                token2,
                amount2,
                amount2Min,
                amount1Min,
                signer.getAddress(),
                expirationTimestamp,
                { value: amount1 }
            );
        } else if (token2 == WIP_ADDRESS) {
            tx = await router.addLiquidityETH(
                token1,
                amount1,
                amount1Min,
                amount2Min,
                signer.getAddress(),
                expirationTimestamp,
                { value: amount2 }
            );
        } else {
            tx = await router.addLiquidity(
                token1,
                token2,
                amount1,
                amount2,
                amount1Min,
                amount2Min,
                signer.getAddress(),
                expirationTimestamp
            );
        }

        return await tx.wait();
    } catch (error) {
        console.error("Error in addLiquidity:", error);
        throw error;
    }
}

export const v2RemoveLiquidity = async(
    token1: string,
    token2: string,
    liquidity: bigint,
    amount1Min: bigint,
    amount2Min: bigint,
    expirationTimestamp: bigint,
    signer: ethers.Signer
) => {
    try {
        const router = new ethers.Contract(v2RouterAddress, v2_router_abi, signer);
        let tx;

        if (token1 == WIP_ADDRESS) {
            tx = await router.removeLiquidityETH(
                token2,
                liquidity,
                amount2Min,
                amount1Min,
                signer.getAddress(),
                expirationTimestamp
            );
        } else if (token2 == WIP_ADDRESS) {
            tx = await router.removeLiquidityETH(
                token1,
                liquidity,
                amount1Min,
                amount2Min,
                signer.getAddress(),
                expirationTimestamp
            );
        } else {
            tx = await router.removeLiquidity(
                token1,
                token2,
                liquidity,
                amount1Min,
                amount2Min,
                signer.getAddress(),
                expirationTimestamp
            );
        }

        return await tx.wait();
    } catch (error) {
        console.error("Error in removeLiquidity:", error);
        throw error;
    }
}

export const v2RouterTokenApproval = async(
    token: string,
    amount: bigint,
    signer: ethers.Signer
) => {
    const router = new ethers.Contract(v2RouterAddress, v2_router_abi, signer);
    const tx = await router.approve(token as `0x${string}`, amount);
    return await tx.wait();
}
