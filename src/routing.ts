// import { readContract, getBalance, getBlock, writeContract, multicall } from '@wagmi/core'
import { v2_factory_abi, v2_router_abi, piperv3Quoter_abi, multicall_abi, piperv3_pool_abi, piperv3SwapRouter_abi} from './abi';
import { provider, v2RouterAddress, v2FactoryAddress, defaultTokens, piperv3QuoterAddress, multicallAddress, piperv3SwapRouterAddress, WIP_ADDRESS, fee2TickSpace } from './constant';
import { getCreate2Address } from '@ethersproject/address';
import { keccak256, pack } from '@ethersproject/solidity';
import { BigNumber, ethers, logger} from 'ethers';

const multicallContract = new ethers.Contract(
    multicallAddress,
    multicall_abi,
    provider
);


const v2RouterContract = new ethers.Contract(
    v2RouterAddress,
    v2_router_abi,
    provider
);

export const encodeV3Path = (route: string[]): `0x${string}` => {
    if (route.length < 2 || route.length % 2 === 0) {
        throw new Error('Invalid route format: should be [token0, token1, fee1, token2, ...]');
    }
    
    let encoded = '0x';
    // First token
    encoded += route[0].slice(2); // Remove '0x' prefix
    
    // Process pairs of (token, fee)
    for (let i = 1; i < route.length; i += 2) {
        // If we have a fee after this token, add it
        if (i + 1 < route.length) {
            // Convert fee to a number, then to hex, and ensure it's 6 characters (3 bytes)
            const feeHex = Number(route[i + 1]).toString(16).padStart(6, '0');
            encoded += feeHex;
        }
        
        // Add the token
        encoded += route[i].slice(2); // Remove '0x' prefix
    }
    
    return encoded as `0x${string}`;
}

export const v3RoutingExactInput = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenInAmount: bigint
) => {
    // Create quoter contract instance
    const quoterContract = new ethers.Contract(
        piperv3QuoterAddress,
        piperv3Quoter_abi,
        provider
    );

    let bestRoute: any[] = [] // Changed to any[] to accommodate both tokens and fees
    let maxAmountOut = BigInt(0)
    let contracts = <any>[];
    let routeInfo = <any>[];

    // Direct routes with different fee tiers
    for (const feeTier of Object.keys(fee2TickSpace)) {
        const callData = quoterContract.interface.encodeFunctionData(
            'quoteExactInputSingle',
            [{
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amountIn: tokenInAmount,
                fee: feeTier,
                sqrtPriceLimitX96: BigInt(0)
            }]
        );
        contracts.push({
            target: piperv3QuoterAddress,
            callData
        });
        routeInfo.push({
            tokens: [tokenIn, tokenOut],
            fees: [feeTier]
        });
    }

    // Routes with one intermediate token
    for (const intermediateToken of defaultTokens) {
        if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
            // Try all fee tier combinations for the two hops
            for (const feeTier1 of Object.keys(fee2TickSpace)) {
                for (const feeTier2 of Object.keys(fee2TickSpace)) {
                    const callData = quoterContract.interface.encodeFunctionData(
                        'quoteExactInput',
                        [
                            encodeV3Path([tokenIn, intermediateToken, feeTier1, tokenOut, feeTier2]),
                            tokenInAmount
                        ]
                    );
                    contracts.push({
                        target: piperv3QuoterAddress,
                        callData
                    });
                    routeInfo.push({
                        tokens: [tokenIn, intermediateToken, tokenOut],
                        fees: [feeTier1, feeTier2]
                    });
                }
            }
        }
    }

    const results = await multicallContract.callStatic.tryAggregate(
        false,
        contracts,
        { gasLimit: contracts.length * 5000000 }
    );

    // Fix: results from tryAggregate are in the format [boolean, bytes]
    for (let i = 0; i < results.length; i++) {
        const [success, returnData] = results[i];
        if (success) {
            try {
                // Decode the return data based on the contract function
                let amountOut;
                const decoded = ethers.utils.defaultAbiCoder.decode(['uint256'], returnData);
                amountOut = BigInt(decoded[0].toString());
                   
                if (amountOut && amountOut > maxAmountOut) {
                    maxAmountOut = amountOut;
                    const currentRoute = routeInfo[i];
                    
                    // Format the route as [token0, fee0-1, token1, fee1-2, token2, ...]
                    bestRoute = [];
                    bestRoute.push(currentRoute.tokens[0]); // Add first token
                    for (let j = 0; j < currentRoute.fees.length; j++) {
                        bestRoute.push(currentRoute.tokens[j + 1]); // Add next token
                        bestRoute.push(currentRoute.fees[j]); // Add fee
                    }
                }
            } catch (error) {
                // logger.warn("Error decoding result:", error);
            }
        } else {
            //logger.warn("Call failed for route:", routeInfo[i]);
        }
    }
    return { bestRoute, maxAmountOut }
}

export const v3RoutingExactOutput = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenOutAmount: bigint
) => {
    // Create quoter contract instance
    const quoterContract = new ethers.Contract(
        piperv3QuoterAddress,
        piperv3Quoter_abi,
        provider
    );

    let bestRoute: any[] = [] // Changed to any[] to accommodate both tokens and fees
    let minAmountIn = BigInt(2) ** BigInt(256) - BigInt(1) // Max uint256 value
    let contracts = <any>[];
    let routeInfo = <any>[];

    // Direct routes with different fee tiers
    for (const feeTier of Object.keys(fee2TickSpace)) {
        const callData = quoterContract.interface.encodeFunctionData(
            'quoteExactOutputSingle',
            [{
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amount: tokenOutAmount,
                fee: feeTier,
                sqrtPriceLimitX96: BigInt(0)
            }]
        );
        contracts.push({
            target: piperv3QuoterAddress,
            callData
        });
        routeInfo.push({
            tokens: [tokenIn, tokenOut],
            fees: [feeTier]
        });
    }

    // Routes with one intermediate token
    for (const intermediateToken of defaultTokens) {
        if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
            // Try all fee tier combinations for the two hops
            for (const feeTier1 of Object.keys(fee2TickSpace)) {
                for (const feeTier2 of Object.keys(fee2TickSpace)) {
                    // For exact output, the path needs to be reversed compared to exact input
                    const callData = quoterContract.interface.encodeFunctionData(
                        'quoteExactOutput',
                        [
                            encodeV3Path([tokenOut, intermediateToken, feeTier2, tokenIn, feeTier1]),
                            tokenOutAmount
                        ]
                    );
                    contracts.push({
                        target: piperv3QuoterAddress,
                        callData
                    });
                    routeInfo.push({
                        tokens: [tokenIn, intermediateToken, tokenOut],
                        fees: [feeTier1, feeTier2]
                    });
                }
            }
        }
    }

    const results = await multicallContract.callStatic.tryAggregate(
        false,
        contracts,
        { gasLimit: contracts.length * 5000000 }
    );

    // Fix: results from tryAggregate are in the format [boolean, bytes]
    for (let i = 0; i < results.length; i++) {
        const [success, returnData] = results[i];
        if (success) {
            try {
                // Decode the return data based on the contract function
                let amountIn;
                const decoded = ethers.utils.defaultAbiCoder.decode(['uint256'], returnData);
                amountIn = BigInt(decoded[0].toString());
                   
                if (amountIn && amountIn < minAmountIn) {
                    minAmountIn = amountIn;
                    const currentRoute = routeInfo[i];
                    
                    // Format the route as [token0, fee0-1, token1, fee1-2, token2, ...]
                    bestRoute = [];
                    bestRoute.push(currentRoute.tokens[0]); // Add first token
                    for (let j = 0; j < currentRoute.fees.length; j++) {
                        bestRoute.push(currentRoute.tokens[j + 1]); // Add next token
                        bestRoute.push(currentRoute.fees[j]); // Add fee
                    }
                }
            } catch (error) {
                // logger.warn("Error decoding result:", error);
            }
        } else {
            //logger.warn("Call failed for route:", routeInfo[i]);
        }
    }
    return { bestRoute, minAmountIn }
}

export const v2RoutingExactInput = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenInAmount: bigint
) => {    
    let bestRoute: string[] = []
    let maxAmountOut = BigInt(0)

    // Direct route
    try {
        const directResult = await v2RouterContract.getAmountsOut(
            tokenInAmount, 
            [tokenIn, tokenOut]
        );
        maxAmountOut = directResult[1]
        bestRoute = [tokenIn, tokenOut]
    } catch (error) {
        console.log("Error in direct route calculation:", error);
    }   

    // Prepare multicall data
    const calls = []
    const intermediateTokens: string[] = []
    
    for (const intermediateToken of defaultTokens) {
        if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
            // Encode the function call
            const callData = v2RouterContract.interface.encodeFunctionData(
                'getAmountsOut',
                [tokenInAmount, [tokenIn, intermediateToken, tokenOut]]
            );
            
            calls.push({
                target: v2RouterAddress,
                callData
            });
            intermediateTokens.push(intermediateToken)
        }
    }

    try {
        // Use tryAggregate instead of aggregate
        // First boolean parameter (requireSuccess) is false to allow partial success
        const aggregateResult = await multicallContract.callStatic.tryAggregate(
            false,  // Don't require all calls to succeed
            calls,
            { gasLimit: calls.length * 500000 }
        );

        // aggregateResult will be an array of [success: boolean, returnData: string]
        const results = aggregateResult.map(([success, returnData]: [boolean, string], index: number) => {
            if (!success) {
                // console.log(`Call failed for token: ${intermediateTokens[index]}`);
                return { status: "failure", result: null };
            }
            
            try {
                return {
                    status: "success",
                    result: v2RouterContract.interface.decodeFunctionResult('getAmountsOut', returnData)
                }
            } catch (error) {
                // console.log(`Error decoding result for token ${intermediateTokens[index]}:`, error);
                return { status: "failure", result: null }
            }
        });

        // Process results
        for (let i = 0; i < results.length; i++) {
            if (results[i].status === "success" && results[i].result) {
                const amountOut = results[i].result
                if (amountOut[amountOut.length - 1] > maxAmountOut) {
                    maxAmountOut = amountOut[amountOut.length - 1]
                    bestRoute = [tokenIn, intermediateTokens[i], tokenOut]
                }
            }
        }
    } catch (error) {
        // console.error("Multicall tryAggregate failed:", error);
        return { bestRoute, maxAmountOut }
    }

    return { bestRoute, maxAmountOut }
}

export const v2RoutingExactOutput = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenOutAmount: bigint
) => {
    let bestRoute: string[] = []
    let minAmountIn = BigInt(ethers.constants.MaxUint256.toString()) // Changed to use BigInt consistently

    // Direct route
    try {
        const directResult = await v2RouterContract.getAmountsIn(
            tokenOutAmount,
            [tokenIn, tokenOut]
        );
        minAmountIn = directResult[0]
        bestRoute = [tokenIn, tokenOut]
    } catch (error) {
        console.log("Error in direct route calculation:", error);
    }

    // Prepare multicall data
    const calls = []
    const intermediateTokens: string[] = []
    
    for (const intermediateToken of defaultTokens) {
        if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
            // Encode the function call
            const callData = v2RouterContract.interface.encodeFunctionData(
                'getAmountsIn',
                [tokenOutAmount, [tokenIn, intermediateToken, tokenOut]]
            );
            
            calls.push({
                target: v2RouterAddress,
                callData
            });
            intermediateTokens.push(intermediateToken)
        }
    }

    try {
        const aggregateResult = await multicallContract.callStatic.tryAggregate(
            false,
            calls,
            { gasLimit: calls.length * 500000 }
        );

        // Process results
        aggregateResult.forEach(([success, returnData]: [boolean, string], index: number) => {
            if (success) {
                try {
                    const result = v2RouterContract.interface.decodeFunctionResult('getAmountsIn', returnData);
                    const amountIn = BigInt(result[0].toString());
                    if (amountIn < minAmountIn) {
                        minAmountIn = amountIn;
                        bestRoute = [tokenIn, intermediateTokens[index], tokenOut];
                    }
                } catch (error) {
                    // Skip failed decoding
                }
            }
        });
    } catch (error) {
        // console.error("Multicall tryAggregate failed:", error);
        return { bestRoute, minAmountIn }
    }

    return { bestRoute, minAmountIn }
}

//TODO: add v3 routing exact input and output

export const routingExactInput = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenInAmount: bigint
) => {
    const { bestRoute, maxAmountOut } = await v2RoutingExactInput(tokenIn, tokenOut, tokenInAmount);
    const { bestRoute: bestRouteV3, maxAmountOut: maxAmountOutV3 } = await v3RoutingExactInput(tokenIn, tokenOut, tokenInAmount);

    if (maxAmountOut > maxAmountOutV3) {
        return { bestRoute, maxAmountOut }
    } else {
        return { bestRoute: bestRouteV3, maxAmountOut: maxAmountOutV3 }
    }
}

export const routingExactOutput = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenOutAmount: bigint
) => {
    const { bestRoute, minAmountIn } = await v2RoutingExactOutput(tokenIn, tokenOut, tokenOutAmount);
    const { bestRoute: bestRouteV3, minAmountIn: minAmountInV3 } = await v3RoutingExactOutput(tokenIn, tokenOut, tokenOutAmount);

    if (minAmountIn < minAmountInV3) {
        return { bestRoute, minAmountIn }
    } else {
        return { bestRoute: bestRouteV3, minAmountIn: minAmountInV3 }
    }
}

// Add this function to check if an address is valid
export function isValidAddress(address: string | undefined): boolean {
  if (!address) return false;
  try {
    ethers.utils.getAddress(address); // This will throw if the address is invalid
    return true;
  } catch (e) {
    return false;
  }
}
