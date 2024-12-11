// import { readContract, getBalance, getBlock, writeContract, multicall } from '@wagmi/core'
import { v2_factory_abi, v2_router_abi, piperv3Quoter_abi, multicall_abi} from './abi';
import { provider, v2RouterAddress, v2FactoryAddress, defaultTokens, piperv3QuoterAddress, multicallAddress } from './constant';
import { getCreate2Address } from '@ethersproject/address';
import { keccak256, pack } from '@ethersproject/solidity';
import { BigNumber, ethers} from 'ethers';

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

export const v3RoutingExactOutputSingle = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenOutAmount: bigint,
    signer: ethers.Signer 
) => {
    const piperv3QuoterContract = new ethers.Contract(
        piperv3QuoterAddress, 
        piperv3Quoter_abi, 
        signer
    );
    
    const quoteExactOutputSingleParams = {
        tokenIn,
        tokenOut,
        amount: tokenOutAmount,
        fee: 500,
        sqrtPriceLimitX96: BigInt(0)
      }
    let result = await piperv3QuoterContract.callStatic.quoteExactOutputSingle(
        quoteExactOutputSingleParams,
        {gasLimit: 5000000}
    );
    console.log("result: ", result.amountIn.toString());
    return result.amountIn.toString()
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
    let minAmountIn = ethers.constants.MaxUint256 // Max uint256 value

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
                    const amountIn = BigNumber.from(result[0]);
                    if (amountIn.lt(minAmountIn)) {
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
    return { bestRoute, maxAmountOut }
}

export const routingExactOutput = async(
    tokenIn: string, 
    tokenOut: string, 
    tokenOutAmount: bigint
) => {
    const { bestRoute, minAmountIn } = await v2RoutingExactOutput(tokenIn, tokenOut, tokenOutAmount);
    return { bestRoute, minAmountIn }
}