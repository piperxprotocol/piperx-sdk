"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routingExactOutput = exports.routingExactInput = exports.v2RoutingExactOutput = exports.v2RoutingExactInput = exports.v3RoutingExactInput = exports.v3RoutingExactOutput = void 0;
// import { readContract, getBalance, getBlock, writeContract, multicall } from '@wagmi/core'
const abi_1 = require("./abi");
const constant_1 = require("./constant");
const ethers_1 = require("ethers");
const multicallContract = new ethers_1.ethers.Contract(constant_1.multicallAddress, abi_1.multicall_abi, constant_1.provider);
const v2RouterContract = new ethers_1.ethers.Contract(constant_1.v2RouterAddress, abi_1.v2_router_abi, constant_1.provider);
const v3RoutingExactOutput = (tokenIn, tokenOut, tokenOutAmount, signer) => __awaiter(void 0, void 0, void 0, function* () {
    // Create quoter contract instance
    const quoterContract = new ethers_1.ethers.Contract(constant_1.piperv3QuoterAddress, abi_1.piperv3Quoter_abi, signer);
    let bestRoute = [];
    let minAmountIn = ethers_1.ethers.constants.MaxUint256.toBigInt(); // Max uint256 value
    // Prepare multicall data
    const calls = [];
    const feeTiers = Object.keys(constant_1.fee2TickSpace);
    for (const feeTier of feeTiers) {
        // Encode the function call
        const callData = quoterContract.interface.encodeFunctionData('quoteExactOutputSingle', [{
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amount: tokenOutAmount,
                fee: feeTier,
                sqrtPriceLimitX96: BigInt(0)
            }]);
        calls.push({
            target: constant_1.piperv3QuoterAddress,
            callData
        });
    }
    try {
        // Use tryAggregate to allow partial success
        const aggregateResult = yield multicallContract.callStatic.tryAggregate(false, // Don't require all calls to succeed
        calls, { gasLimit: calls.length * 30000000 });
        // Process results
        aggregateResult.forEach(([success, returnData], index) => {
            if (success) {
                try {
                    const result = quoterContract.interface.decodeFunctionResult('quoteExactOutputSingle', returnData);
                    const amountIn = BigInt(result.amountIn.toString());
                    if (amountIn < minAmountIn) {
                        minAmountIn = amountIn;
                        bestRoute = [tokenIn, feeTiers[index], tokenOut];
                    }
                }
                catch (error) {
                    console.log(`Error decoding result for fee tier ${feeTiers[index]}:`, error);
                }
            }
        });
    }
    catch (error) {
        console.error("Multicall tryAggregate failed:", error);
        return { bestRoute, minAmountIn };
    }
    return { bestRoute, minAmountIn };
});
exports.v3RoutingExactOutput = v3RoutingExactOutput;
const v3RoutingExactInput = (tokenIn, tokenOut, tokenInAmount, signer) => __awaiter(void 0, void 0, void 0, function* () {
    // Create quoter contract instance
    const quoterContract = new ethers_1.ethers.Contract(constant_1.piperv3QuoterAddress, abi_1.piperv3Quoter_abi, signer);
    let bestRoute = [];
    let maxAmountOut = BigInt(0);
    // Prepare multicall data
    const calls = [];
    const feeTiers = Object.keys(constant_1.fee2TickSpace);
    for (const feeTier of feeTiers) {
        // Encode the function call
        const callData = quoterContract.interface.encodeFunctionData('quoteExactInputSingle', [{
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                amountIn: tokenInAmount,
                fee: feeTier,
                sqrtPriceLimitX96: BigInt(0)
            }]);
        calls.push({
            target: constant_1.piperv3QuoterAddress,
            callData
        });
    }
    try {
        // Use tryAggregate to allow partial success
        const aggregateResult = yield multicallContract.callStatic.tryAggregate(false, // Don't require all calls to succeed
        calls, { gasLimit: calls.length * 30000000 });
        // Process results
        aggregateResult.forEach(([success, returnData], index) => {
            if (success) {
                try {
                    const result = quoterContract.interface.decodeFunctionResult('quoteExactInputSingle', returnData);
                    const amountOut = BigInt(result.amountOut.toString());
                    if (amountOut > maxAmountOut) {
                        maxAmountOut = amountOut;
                        bestRoute = [tokenIn, feeTiers[index], tokenOut];
                    }
                }
                catch (error) {
                    console.log(`Error decoding result for fee tier ${feeTiers[index]}:`, error);
                }
            }
        });
    }
    catch (error) {
        console.error("Multicall tryAggregate failed:", error);
        return { bestRoute, maxAmountOut };
    }
    return { bestRoute, maxAmountOut };
});
exports.v3RoutingExactInput = v3RoutingExactInput;
const v2RoutingExactInput = (tokenIn, tokenOut, tokenInAmount) => __awaiter(void 0, void 0, void 0, function* () {
    let bestRoute = [];
    let maxAmountOut = BigInt(0);
    // Direct route
    try {
        const directResult = yield v2RouterContract.getAmountsOut(tokenInAmount, [tokenIn, tokenOut]);
        maxAmountOut = directResult[1];
        bestRoute = [tokenIn, tokenOut];
    }
    catch (error) {
        console.log("Error in direct route calculation:", error);
    }
    // Prepare multicall data
    const calls = [];
    const intermediateTokens = [];
    for (const intermediateToken of constant_1.defaultTokens) {
        if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
            // Encode the function call
            const callData = v2RouterContract.interface.encodeFunctionData('getAmountsOut', [tokenInAmount, [tokenIn, intermediateToken, tokenOut]]);
            calls.push({
                target: constant_1.v2RouterAddress,
                callData
            });
            intermediateTokens.push(intermediateToken);
        }
    }
    try {
        // Use tryAggregate instead of aggregate
        // First boolean parameter (requireSuccess) is false to allow partial success
        const aggregateResult = yield multicallContract.callStatic.tryAggregate(false, // Don't require all calls to succeed
        calls, { gasLimit: calls.length * 500000 });
        // aggregateResult will be an array of [success: boolean, returnData: string]
        const results = aggregateResult.map(([success, returnData], index) => {
            if (!success) {
                // console.log(`Call failed for token: ${intermediateTokens[index]}`);
                return { status: "failure", result: null };
            }
            try {
                return {
                    status: "success",
                    result: v2RouterContract.interface.decodeFunctionResult('getAmountsOut', returnData)
                };
            }
            catch (error) {
                // console.log(`Error decoding result for token ${intermediateTokens[index]}:`, error);
                return { status: "failure", result: null };
            }
        });
        // Process results
        for (let i = 0; i < results.length; i++) {
            if (results[i].status === "success" && results[i].result) {
                const amountOut = results[i].result;
                if (amountOut[amountOut.length - 1] > maxAmountOut) {
                    maxAmountOut = amountOut[amountOut.length - 1];
                    bestRoute = [tokenIn, intermediateTokens[i], tokenOut];
                }
            }
        }
    }
    catch (error) {
        // console.error("Multicall tryAggregate failed:", error);
        return { bestRoute, maxAmountOut };
    }
    return { bestRoute, maxAmountOut };
});
exports.v2RoutingExactInput = v2RoutingExactInput;
const v2RoutingExactOutput = (tokenIn, tokenOut, tokenOutAmount) => __awaiter(void 0, void 0, void 0, function* () {
    let bestRoute = [];
    let minAmountIn = ethers_1.ethers.constants.MaxUint256; // Max uint256 value
    // Direct route
    try {
        const directResult = yield v2RouterContract.getAmountsIn(tokenOutAmount, [tokenIn, tokenOut]);
        minAmountIn = directResult[0];
        bestRoute = [tokenIn, tokenOut];
    }
    catch (error) {
        console.log("Error in direct route calculation:", error);
    }
    // Prepare multicall data
    const calls = [];
    const intermediateTokens = [];
    for (const intermediateToken of constant_1.defaultTokens) {
        if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
            // Encode the function call
            const callData = v2RouterContract.interface.encodeFunctionData('getAmountsIn', [tokenOutAmount, [tokenIn, intermediateToken, tokenOut]]);
            calls.push({
                target: constant_1.v2RouterAddress,
                callData
            });
            intermediateTokens.push(intermediateToken);
        }
    }
    try {
        const aggregateResult = yield multicallContract.callStatic.tryAggregate(false, calls, { gasLimit: calls.length * 500000 });
        // Process results
        aggregateResult.forEach(([success, returnData], index) => {
            if (success) {
                try {
                    const result = v2RouterContract.interface.decodeFunctionResult('getAmountsIn', returnData);
                    const amountIn = ethers_1.BigNumber.from(result[0]);
                    if (amountIn.lt(minAmountIn)) {
                        minAmountIn = amountIn;
                        bestRoute = [tokenIn, intermediateTokens[index], tokenOut];
                    }
                }
                catch (error) {
                    // Skip failed decoding
                }
            }
        });
    }
    catch (error) {
        // console.error("Multicall tryAggregate failed:", error);
        return { bestRoute, minAmountIn };
    }
    return { bestRoute, minAmountIn };
});
exports.v2RoutingExactOutput = v2RoutingExactOutput;
//TODO: add v3 routing exact input and output
const routingExactInput = (tokenIn, tokenOut, tokenInAmount) => __awaiter(void 0, void 0, void 0, function* () {
    const { bestRoute, maxAmountOut } = yield (0, exports.v2RoutingExactInput)(tokenIn, tokenOut, tokenInAmount);
    return { bestRoute, maxAmountOut };
});
exports.routingExactInput = routingExactInput;
const routingExactOutput = (tokenIn, tokenOut, tokenOutAmount) => __awaiter(void 0, void 0, void 0, function* () {
    const { bestRoute, minAmountIn } = yield (0, exports.v2RoutingExactOutput)(tokenIn, tokenOut, tokenOutAmount);
    return { bestRoute, minAmountIn };
});
exports.routingExactOutput = routingExactOutput;
