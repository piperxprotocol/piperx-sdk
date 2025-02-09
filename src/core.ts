import { abi, IPeripheryPaymentsWithFee_abi, nft_position_manager_abi, piperv3_factory_abi, piperv3_pool_abi, piperv3SwapRouter_abi, v2_factory_abi, v2_pool_abi, v2_router_abi} from './abi'
import { ADDRESS_ZERO, WIP_ADDRESS, piperv3FactoryAddress, piperv3NFTPositionManagerAddress, piperv3SwapRouterAddress, provider, v2ComputeAddress, v2RouterAddress } from './constant'
import { ethers } from 'ethers'
import { routingExactInput } from './routing'
import { Interface, keccak256 } from 'ethers/lib/utils'
import axios from 'axios';

export const v3ClaimFee = async(
    tokenId: number,
    recipient: string,
    amount0Max: bigint,
    amount1Max: bigint,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    try {
        const positionManager = new ethers.Contract(
            piperv3NFTPositionManagerAddress, 
            nft_position_manager_abi, 
            signer
        );

        const params = {
            tokenId: tokenId,
            recipient: recipient,
            amount0Max: amount0Max,
            amount1Max: amount1Max
        };

        const options = customGasLimit ? { gasLimit: customGasLimit } : {};
        const tx = await positionManager.collect(params, options);
        return await tx.wait();
    } catch (error) {
        console.error("Error in v3claimFee:", error);
        throw error;
    }
}

export const v3RemoveLiquidity = async(
    token1: string,
    token2: string,
    tokenId: number,
    liquidity: bigint,
    amount1Min: bigint,
    amount2Min: bigint,
    expirationTimestamp: bigint,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    try {
        const positionManager = new ethers.Contract(piperv3NFTPositionManagerAddress, nft_position_manager_abi, signer);
        let tx;
        // Ensure token order is correct (token0 < token1)

        const params = {
            tokenId: tokenId,
            liquidity: liquidity,
            amount0Min: token1.toLowerCase() < token2.toLowerCase() ? amount1Min : amount2Min,
            amount1Min: token1.toLowerCase() < token2.toLowerCase() ? amount2Min : amount1Min,
            deadline: expirationTimestamp
        };

        tx = await positionManager.decreaseLiquidity(params, customGasLimit ? { gasLimit: customGasLimit } : {});
        let receipt = await tx.wait();
        return receipt;
    } catch (error) {
        console.error("Error in v3RemoveLiquidity:", error);
        throw error;
    }
}

export const v3CreatePool = async(
    token0: string,
    token1: string,
    fee: number = 3000,
    initialPrice: number,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    const factory = new ethers.Contract(piperv3NFTPositionManagerAddress, nft_position_manager_abi, signer);
    const tx = await factory.createAndInitializePoolIfNecessary(
        token0, 
        token1, 
        fee, 
        initialPrice, 
        customGasLimit ? { gasLimit: customGasLimit } : {}
    );
    return await tx.wait();
}

export const v3AddLiquidity = async(
    token1: string,
    token2: string,
    amount1: bigint,
    amount2: bigint,
    amount1Min: bigint,
    amount2Min: bigint,
    tickLower: number,
    tickUpper: number,
    fee: number = 3000, // Default to 0.3% fee tier
    expirationTimestamp: bigint,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    try {
        const positionManager = new ethers.Contract(piperv3NFTPositionManagerAddress, nft_position_manager_abi, signer);
        let tx;
        
        // Ensure token order is correct (token0 < token1)
        const [token0, token1_, amount0Sorted, amount1Sorted, amount0MinSorted, amount1MinSorted] = token1.toLowerCase() < token2.toLowerCase()
            ? [token1, token2, amount1, amount2, amount1Min, amount2Min]
            : [token2, token1, amount2, amount1, amount2Min, amount1Min];

        const params = {
            token0: token0,
            token1: token1_,
            fee: fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Sorted,
            amount1Desired: amount1Sorted,
            amount0Min: amount0MinSorted,
            amount1Min: amount1MinSorted,
            recipient: await signer.getAddress(),
            deadline: expirationTimestamp
        };

        if (token0 === WIP_ADDRESS || token1_ === WIP_ADDRESS) {
            const value = token0 === WIP_ADDRESS ? amount0Sorted : amount1Sorted;
            tx = await positionManager.mint(params, { 
                value, 
                ...(customGasLimit ? { gasLimit: customGasLimit } : {})
            });
        } else {
            tx = await positionManager.mint(params, customGasLimit ? { gasLimit: customGasLimit } : {});
        }

        return await tx.wait();
    } catch (error) {
        console.error("Error in v3AddLiquidity:", error);
        throw error;
    }
}

// token0 fee token1 fee token2 fee token3 fee token4
export function encodeV3Path(path: string[]): string {
    if (path.length < 2 || path.length % 2 !== 1) {
        throw new Error('Path must contain odd number of elements (address + fee + address + fee + ... + address)');
    }

    const types: string[] = ['address'];
    const values: (string | number)[] = [path[0]];

    // For each pair of addresses, we need a fee in between
    for (let i = 1; i < path.length; i += 2) {
        types.push('uint24', 'address');
        values.push(Number(path[i]), path[i + 1]);
    }
    return ethers.utils.solidityPack(types, values);
}

export const v3Swap = async(
    amount1: bigint,
    amount2Min: bigint,
    path: string[], 
    expirationTimestamp: bigint,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    if (path.length != 3) {
        throw new Error("path must contain 3 elements");
    }

    const address = signer.getAddress();
    try {
        const router = new ethers.Contract(piperv3SwapRouterAddress, piperv3SwapRouter_abi, signer);

        // Get current gas price and add 20% to ensure faster processing
        const gasPrice = await provider.getGasPrice();
        const adjustedGasPrice = (gasPrice.toBigInt() * BigInt(120)) / BigInt(100);
        
        const txOptions = {
            gasPrice: adjustedGasPrice,
            ...(customGasLimit ? { gasLimit: customGasLimit } : {})
        };

        console.log("Preparing V3 swap with options:", {
            gasPrice: ethers.utils.formatUnits(adjustedGasPrice, "gwei"),
        });

        let tx;
        const exactInputSingleParams = {
            tokenIn: path[0],
            tokenOut: path[1],
            fee: path[2],
            recipient: path[1] === WIP_ADDRESS ? ethers.constants.AddressZero : address,
            deadline: expirationTimestamp,
            amountIn: amount1,
            amountOutMinimum: amount2Min,
            sqrtPriceLimitX96: BigInt(0)
        };

        if (path[0] === WIP_ADDRESS) { 
            // Case 1: IP to Token (Native IP to ERC-20)
            tx = await router.exactInputSingle(
                exactInputSingleParams,
                { 
                    ...txOptions,
                    value: amount1
                }
            );
        } else if (path[1] === WIP_ADDRESS) { 
            // Case 2: Token to IP (ERC-20 to Native IP)
            const swapRouterInterface = new ethers.utils.Interface(piperv3SwapRouter_abi);
            const peripheryPaymentsInterface = new ethers.utils.Interface([
                "function unwrapWETH9(uint256 amountMinimum, address recipient) external payable"
            ]);

            const multicallData = [
                swapRouterInterface.encodeFunctionData('exactInputSingle', [exactInputSingleParams]),
                peripheryPaymentsInterface.encodeFunctionData('unwrapWETH9', [amount2Min, address])
            ];

            tx = await router.multicall(
                multicallData,
                txOptions
            );
        } else { 
            // Case 3: Token to Token
            tx = await router.exactInputSingle(
                exactInputSingleParams,
                txOptions
            );
        }

        console.log("V3 Transaction submitted:", tx.hash);
        return await tx.wait();

        // try {
        //     const receipt = await Promise.race([
        //         (async () => {
        //             const receipt = await tx.wait(1);
        //             console.log("Transaction mined in block:", receipt.blockNumber);
        //             return receipt;
        //         })(),
        //         new Promise((_, reject) => 
        //             setTimeout(() => reject(new Error('Transaction timeout after 60 seconds')), 60000)
        //         )
        //     ]);
            
        //     console.log("Transaction confirmed:", receipt.hash);
        //     return receipt;
        // } catch (waitError) {
        //     // Check if transaction is still pending
        //     const txResponse = await provider.getTransaction(tx.hash);
        //     if (txResponse) {
        //         console.log("Transaction is still pending. Hash:", tx.hash);
        //         throw new Error(`Transaction pending: ${tx.hash}`);
        //     }
        //     throw waitError;
        // }
    } catch (error) {
        console.error("Error in v3 swap:", error);
        throw error;
    }
}

export const swap = async(
    amount1: bigint,
    amount2Min: bigint,
    path: string[], 
    expirationTimestamp: bigint,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    if (path[1].length < 10) { // v3 swap
        return await v3Swap(amount1, amount2Min, path, expirationTimestamp, signer, customGasLimit);
    } else { // v2 swap
        return await v2Swap(amount1, amount2Min, path, expirationTimestamp, signer, customGasLimit);
    }
}

export const v3GetPrice = async(
    token1: string,
    token2: string,
    fee: number = 3000  // Default to 0.3% fee tier
): Promise<number> => {
    // Compute pool address using V3 factory
    const factory = new ethers.Contract(piperv3FactoryAddress, piperv3_factory_abi, provider);
    const poolAddress = await factory.getPool(token1, token2, fee);
    
    if (poolAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Pool does not exist');
    }
    
    const poolContract = new ethers.Contract(poolAddress, piperv3_pool_abi, provider);
    try {
        const slot0 = await poolContract.slot0();
        const sqrtPriceX96 = slot0.sqrtPriceX96;
        
        // Convert sqrtPriceX96 to regular price
        const price = (Number(sqrtPriceX96) / 2**96) ** 2;
        
        // Determine if price needs to be inverted based on token order
        const token0 = await poolContract.token0();
        return token0.toLowerCase() === token1.toLowerCase() ? price : 1 / price;
        
    } catch (error) {
        console.error("Error fetching V3 price:", error);
        throw error;
    }
}

export const v3GetPriceWithDecimals = async(
    token1: string,
    token2: string,
    decimal1: number,
    decimal2: number,
    fee: number = 3000  // Default to 0.3% fee tier
) => {
    const price = await v3GetPrice(token1, token2, fee);
    return price * 10 ** (decimal1 - decimal2);
}

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
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    try {
        const router = new ethers.Contract(v2RouterAddress, v2_router_abi, signer);
        
        // Get current gas price and add 20% to ensure faster processing
        const gasPrice = await provider.getGasPrice();
        const adjustedGasPrice = (gasPrice.toBigInt() * BigInt(120)) / BigInt(100);
        
        const txOptions = {
            gasPrice: adjustedGasPrice,
            ...(customGasLimit ? { gasLimit: customGasLimit } : {}), // Only include gasLimit if custom value provided
        };

        let tx;
        if (path[0] == WIP_ADDRESS) {
            tx = await router.swapExactETHForTokens(
                amount2Min,
                path,
                await signer.getAddress(),  // Make sure we await this
                expirationTimestamp,
                { 
                    ...txOptions,
                    value: amount1
                }
            );
        } else if (path[path.length - 1] == WIP_ADDRESS) {
            tx = await router.swapExactTokensForETH(
                amount1,
                amount2Min,
                path,
                await signer.getAddress(),  // Make sure we await this
                expirationTimestamp,
                txOptions
            );
        } else {
            tx = await router.swapExactTokensForTokens(
                amount1,
                amount2Min,
                path,
                await signer.getAddress(),  // Make sure we await this
                expirationTimestamp,
                txOptions
            );
        }

        console.log("Transaction submitted:", tx.hash);
        
        return tx.wait()
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
    signer: ethers.Signer,
    customGasLimit?: number
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
                { 
                    value: amount1, 
                    ...(customGasLimit ? { gasLimit: customGasLimit } : {})
                }
            );
        } else if (token2 == WIP_ADDRESS) {
            tx = await router.addLiquidityETH(
                token1,
                amount1,
                amount1Min,
                amount2Min,
                signer.getAddress(),
                expirationTimestamp,
                { 
                    value: amount2, 
                    ...(customGasLimit ? { gasLimit: customGasLimit } : {})
                }
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
                expirationTimestamp,
                customGasLimit ? { gasLimit: customGasLimit } : {}
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
    signer: ethers.Signer,
    customGasLimit?: number
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
                expirationTimestamp,
                customGasLimit ? { gasLimit: customGasLimit } : {}
            );
        } else if (token2 == WIP_ADDRESS) {
            tx = await router.removeLiquidityETH(
                token1,
                liquidity,
                amount1Min,
                amount2Min,
                signer.getAddress(),
                expirationTimestamp,
                customGasLimit ? { gasLimit: customGasLimit } : {}
            );
        } else {
            tx = await router.removeLiquidity(
                token1,
                token2,
                liquidity,
                amount1Min,
                amount2Min,
                signer.getAddress(),
                expirationTimestamp,
                customGasLimit ? { gasLimit: customGasLimit } : {}
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
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    try {
        const tokenContract = new ethers.Contract(token, abi, signer);
        
        // Get current gas price and add 50% to ensure faster processing
        const gasPrice = await provider.getGasPrice();
        const adjustedGasPrice = (gasPrice.toBigInt() * BigInt(150)) / BigInt(100);
        
        const tx = await tokenContract.approve(
            v2RouterAddress, 
            amount, 
            {
                gasPrice: adjustedGasPrice,
                ...(customGasLimit ? { gasLimit: customGasLimit } : {})
            }
        );

        // Wait for transaction with timeout
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Approval timeout after 60 seconds')), 60000)
            )
        ]);

        return receipt;
    } catch (error) {
        console.error("Error in v2RouterTokenApproval:", error);
        throw error;
    }
}

export const v3RouterTokenApproval = async(
    token: string,
    amount: bigint,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    try {
        const tokenContract = new ethers.Contract(token, abi, signer);
        
        // Get current gas price and add 200% to ensure much faster processing
        const gasPrice = await provider.getGasPrice();
        const adjustedGasPrice = (gasPrice.toBigInt() * BigInt(300)) / BigInt(100);
        
        const tx = await tokenContract.approve(
            piperv3SwapRouterAddress, 
            amount, 
            {
                gasPrice: adjustedGasPrice,
                ...(customGasLimit ? { gasLimit: customGasLimit } : {}),
                type: 0  // Legacy transaction type to ensure compatibility
            }
        );

        return await tx.wait();
    } catch (error) {
        console.error("Error in v3RouterTokenApproval:", error);
        throw error;
    }
}

export const routerTokenApproval = async(
    token: string,
    amount: bigint,
    path: string[],
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    if (path[1].length < 10) { // v3 swap
        return await v3RouterTokenApproval(token, amount, signer, customGasLimit);
    } else { // v2 swap
        return await v2RouterTokenApproval(token, amount, signer, customGasLimit);
    }
}

export const v3PositionManagerTokenApproval = async(
    token: string,
    amount: bigint,
    signer: ethers.Signer,
    customGasLimit?: number
) => {
    const tokenContract = new ethers.Contract(token, abi, signer);
    const tx = await tokenContract.approve(
        piperv3NFTPositionManagerAddress, 
        amount, 
        customGasLimit ? { gasLimit: customGasLimit } : {}
    );
    return await tx.wait();
}