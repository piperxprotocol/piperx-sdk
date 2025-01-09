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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routingExactOutput = exports.routingExactInput = exports.v2RoutingExactOutput = exports.v2RoutingExactInput = exports.v3RoutingExactInput = exports.v3RoutingExactOutput = void 0;
// import { readContract, getBalance, getBlock, writeContract, multicall } from '@wagmi/core'
var abi_1 = require("./abi");
var constant_1 = require("./constant");
var ethers_1 = require("ethers");
var multicallContract = new ethers_1.ethers.Contract(constant_1.multicallAddress, abi_1.multicall_abi, constant_1.provider);
var v2RouterContract = new ethers_1.ethers.Contract(constant_1.v2RouterAddress, abi_1.v2_router_abi, constant_1.provider);
var v3RoutingExactOutput = function (tokenIn, tokenOut, tokenOutAmount, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var quoterContract, bestRoute, minAmountIn, calls, feeTiers, _i, feeTiers_1, feeTier, callData, aggregateResult, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                quoterContract = new ethers_1.ethers.Contract(constant_1.piperv3QuoterAddress, abi_1.piperv3Quoter_abi, signer);
                bestRoute = [];
                minAmountIn = ethers_1.ethers.constants.MaxUint256.toBigInt() // Max uint256 value
                ;
                calls = [];
                feeTiers = Object.keys(constant_1.fee2TickSpace);
                for (_i = 0, feeTiers_1 = feeTiers; _i < feeTiers_1.length; _i++) {
                    feeTier = feeTiers_1[_i];
                    callData = quoterContract.interface.encodeFunctionData('quoteExactOutputSingle', [{
                            tokenIn: tokenIn,
                            tokenOut: tokenOut,
                            amount: tokenOutAmount,
                            fee: feeTier,
                            sqrtPriceLimitX96: BigInt(0)
                        }]);
                    calls.push({
                        target: constant_1.piperv3QuoterAddress,
                        callData: callData
                    });
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, multicallContract.callStatic.tryAggregate(false, // Don't require all calls to succeed
                    calls, { gasLimit: calls.length * 30000000 })];
            case 2:
                aggregateResult = _a.sent();
                // Process results
                aggregateResult.forEach(function (_a, index) {
                    var success = _a[0], returnData = _a[1];
                    if (success) {
                        try {
                            var result = quoterContract.interface.decodeFunctionResult('quoteExactOutputSingle', returnData);
                            var amountIn = BigInt(result.amountIn.toString());
                            if (amountIn < minAmountIn) {
                                minAmountIn = amountIn;
                                bestRoute = [tokenIn, feeTiers[index], tokenOut];
                            }
                        }
                        catch (error) {
                            console.log("Error decoding result for fee tier ".concat(feeTiers[index], ":"), error);
                        }
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.error("Multicall tryAggregate failed:", error_1);
                return [2 /*return*/, { bestRoute: bestRoute, minAmountIn: minAmountIn }];
            case 4: return [2 /*return*/, { bestRoute: bestRoute, minAmountIn: minAmountIn }];
        }
    });
}); };
exports.v3RoutingExactOutput = v3RoutingExactOutput;
var v3RoutingExactInput = function (tokenIn, tokenOut, tokenInAmount, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var quoterContract, bestRoute, maxAmountOut, calls, feeTiers, _i, feeTiers_2, feeTier, callData, aggregateResult, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                quoterContract = new ethers_1.ethers.Contract(constant_1.piperv3QuoterAddress, abi_1.piperv3Quoter_abi, signer);
                bestRoute = [];
                maxAmountOut = BigInt(0);
                calls = [];
                feeTiers = Object.keys(constant_1.fee2TickSpace);
                for (_i = 0, feeTiers_2 = feeTiers; _i < feeTiers_2.length; _i++) {
                    feeTier = feeTiers_2[_i];
                    callData = quoterContract.interface.encodeFunctionData('quoteExactInputSingle', [{
                            tokenIn: tokenIn,
                            tokenOut: tokenOut,
                            amountIn: tokenInAmount,
                            fee: feeTier,
                            sqrtPriceLimitX96: BigInt(0)
                        }]);
                    calls.push({
                        target: constant_1.piperv3QuoterAddress,
                        callData: callData
                    });
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, multicallContract.callStatic.tryAggregate(false, // Don't require all calls to succeed
                    calls, { gasLimit: calls.length * 30000000 })];
            case 2:
                aggregateResult = _a.sent();
                // Process results
                aggregateResult.forEach(function (_a, index) {
                    var success = _a[0], returnData = _a[1];
                    if (success) {
                        try {
                            var result = quoterContract.interface.decodeFunctionResult('quoteExactInputSingle', returnData);
                            var amountOut = BigInt(result.amountOut.toString());
                            if (amountOut > maxAmountOut) {
                                maxAmountOut = amountOut;
                                bestRoute = [tokenIn, feeTiers[index], tokenOut];
                            }
                        }
                        catch (error) {
                            console.log("Error decoding result for fee tier ".concat(feeTiers[index], ":"), error);
                        }
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error("Multicall tryAggregate failed:", error_2);
                return [2 /*return*/, { bestRoute: bestRoute, maxAmountOut: maxAmountOut }];
            case 4: return [2 /*return*/, { bestRoute: bestRoute, maxAmountOut: maxAmountOut }];
        }
    });
}); };
exports.v3RoutingExactInput = v3RoutingExactInput;
var v2RoutingExactInput = function (tokenIn, tokenOut, tokenInAmount) { return __awaiter(void 0, void 0, void 0, function () {
    var bestRoute, maxAmountOut, directResult, error_3, calls, intermediateTokens, _i, defaultTokens_1, intermediateToken, callData, aggregateResult, results, i, amountOut, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                bestRoute = [];
                maxAmountOut = BigInt(0);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, v2RouterContract.getAmountsOut(tokenInAmount, [tokenIn, tokenOut])];
            case 2:
                directResult = _a.sent();
                maxAmountOut = directResult[1];
                bestRoute = [tokenIn, tokenOut];
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.log("Error in direct route calculation:", error_3);
                return [3 /*break*/, 4];
            case 4:
                calls = [];
                intermediateTokens = [];
                for (_i = 0, defaultTokens_1 = constant_1.defaultTokens; _i < defaultTokens_1.length; _i++) {
                    intermediateToken = defaultTokens_1[_i];
                    if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
                        callData = v2RouterContract.interface.encodeFunctionData('getAmountsOut', [tokenInAmount, [tokenIn, intermediateToken, tokenOut]]);
                        calls.push({
                            target: constant_1.v2RouterAddress,
                            callData: callData
                        });
                        intermediateTokens.push(intermediateToken);
                    }
                }
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, multicallContract.callStatic.tryAggregate(false, // Don't require all calls to succeed
                    calls, { gasLimit: calls.length * 500000 })];
            case 6:
                aggregateResult = _a.sent();
                results = aggregateResult.map(function (_a, index) {
                    var success = _a[0], returnData = _a[1];
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
                for (i = 0; i < results.length; i++) {
                    if (results[i].status === "success" && results[i].result) {
                        amountOut = results[i].result;
                        if (amountOut[amountOut.length - 1] > maxAmountOut) {
                            maxAmountOut = amountOut[amountOut.length - 1];
                            bestRoute = [tokenIn, intermediateTokens[i], tokenOut];
                        }
                    }
                }
                return [3 /*break*/, 8];
            case 7:
                error_4 = _a.sent();
                // console.error("Multicall tryAggregate failed:", error);
                return [2 /*return*/, { bestRoute: bestRoute, maxAmountOut: maxAmountOut }];
            case 8: return [2 /*return*/, { bestRoute: bestRoute, maxAmountOut: maxAmountOut }];
        }
    });
}); };
exports.v2RoutingExactInput = v2RoutingExactInput;
var v2RoutingExactOutput = function (tokenIn, tokenOut, tokenOutAmount) { return __awaiter(void 0, void 0, void 0, function () {
    var bestRoute, minAmountIn, directResult, error_5, calls, intermediateTokens, _i, defaultTokens_2, intermediateToken, callData, aggregateResult, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                bestRoute = [];
                minAmountIn = ethers_1.ethers.constants.MaxUint256 // Max uint256 value
                ;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, v2RouterContract.getAmountsIn(tokenOutAmount, [tokenIn, tokenOut])];
            case 2:
                directResult = _a.sent();
                minAmountIn = directResult[0];
                bestRoute = [tokenIn, tokenOut];
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                console.log("Error in direct route calculation:", error_5);
                return [3 /*break*/, 4];
            case 4:
                calls = [];
                intermediateTokens = [];
                for (_i = 0, defaultTokens_2 = constant_1.defaultTokens; _i < defaultTokens_2.length; _i++) {
                    intermediateToken = defaultTokens_2[_i];
                    if (intermediateToken !== tokenIn && intermediateToken !== tokenOut) {
                        callData = v2RouterContract.interface.encodeFunctionData('getAmountsIn', [tokenOutAmount, [tokenIn, intermediateToken, tokenOut]]);
                        calls.push({
                            target: constant_1.v2RouterAddress,
                            callData: callData
                        });
                        intermediateTokens.push(intermediateToken);
                    }
                }
                _a.label = 5;
            case 5:
                _a.trys.push([5, 7, , 8]);
                return [4 /*yield*/, multicallContract.callStatic.tryAggregate(false, calls, { gasLimit: calls.length * 500000 })];
            case 6:
                aggregateResult = _a.sent();
                // Process results
                aggregateResult.forEach(function (_a, index) {
                    var success = _a[0], returnData = _a[1];
                    if (success) {
                        try {
                            var result = v2RouterContract.interface.decodeFunctionResult('getAmountsIn', returnData);
                            var amountIn = ethers_1.BigNumber.from(result[0]);
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
                return [3 /*break*/, 8];
            case 7:
                error_6 = _a.sent();
                // console.error("Multicall tryAggregate failed:", error);
                return [2 /*return*/, { bestRoute: bestRoute, minAmountIn: minAmountIn }];
            case 8: return [2 /*return*/, { bestRoute: bestRoute, minAmountIn: minAmountIn }];
        }
    });
}); };
exports.v2RoutingExactOutput = v2RoutingExactOutput;
//TODO: add v3 routing exact input and output
var routingExactInput = function (tokenIn, tokenOut, tokenInAmount) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, bestRoute, maxAmountOut;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, exports.v2RoutingExactInput)(tokenIn, tokenOut, tokenInAmount)];
            case 1:
                _a = _b.sent(), bestRoute = _a.bestRoute, maxAmountOut = _a.maxAmountOut;
                return [2 /*return*/, { bestRoute: bestRoute, maxAmountOut: maxAmountOut }];
        }
    });
}); };
exports.routingExactInput = routingExactInput;
var routingExactOutput = function (tokenIn, tokenOut, tokenOutAmount) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, bestRoute, minAmountIn;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, exports.v2RoutingExactOutput)(tokenIn, tokenOut, tokenOutAmount)];
            case 1:
                _a = _b.sent(), bestRoute = _a.bestRoute, minAmountIn = _a.minAmountIn;
                return [2 /*return*/, { bestRoute: bestRoute, minAmountIn: minAmountIn }];
        }
    });
}); };
exports.routingExactOutput = routingExactOutput;
