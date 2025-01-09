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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v2RouterTokenApproval = exports.v2RemoveLiquidity = exports.v2AddLiquidity = exports.v2Swap = exports.v2GetPriceWithDecimals = exports.v2GetPrice = exports.v3GetPriceWithDecimals = exports.v3GetPrice = exports.v3Swap = exports.v3AddLiquidity = exports.v3RemoveLiquidity = void 0;
exports.encodeV3Path = encodeV3Path;
var abi_js_1 = require("./abi.js");
var constant_js_1 = require("./constant.js");
var ethers_1 = require("ethers");
var v3RemoveLiquidity = function (token1, token2, tokenId, liquidity, amount1Min, amount2Min, expirationTimestamp, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var positionManager, tx, _a, token0, token1_, params, receipt, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                positionManager = new ethers_1.ethers.Contract(constant_js_1.piperv3NFTPositionManagerAddress, abi_js_1.nft_position_manager_abi, signer);
                tx = void 0;
                _a = token1.toLowerCase() < token2.toLowerCase()
                    ? [token1, token2]
                    : [token2, token1], token0 = _a[0], token1_ = _a[1];
                params = {
                    tokenId: tokenId,
                    liquidity: liquidity,
                    amount0Min: token1.toLowerCase() < token2.toLowerCase() ? amount1Min : amount2Min,
                    amount1Min: token1.toLowerCase() < token2.toLowerCase() ? amount2Min : amount1Min,
                    deadline: expirationTimestamp
                };
                return [4 /*yield*/, positionManager.decreaseLiquidity(params)];
            case 1:
                tx = _b.sent();
                return [4 /*yield*/, tx.wait()];
            case 2:
                receipt = _b.sent();
                return [2 /*return*/, receipt];
            case 3:
                error_1 = _b.sent();
                console.error("Error in v3RemoveLiquidity:", error_1);
                throw error_1;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.v3RemoveLiquidity = v3RemoveLiquidity;
var v3AddLiquidity = function (token1_1, token2_1, amount1_1, amount2_1, tickLower_1, tickUpper_1) {
    var args_1 = [];
    for (var _i = 6; _i < arguments.length; _i++) {
        args_1[_i - 6] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([token1_1, token2_1, amount1_1, amount2_1, tickLower_1, tickUpper_1], args_1, true), void 0, function (token1, token2, amount1, amount2, tickLower, tickUpper, fee, // Default to 0.3% fee tier
    expirationTimestamp, signer) {
        var positionManager, tx, _a, token0, token1_, amount0Sorted, amount1Sorted, params, value, error_2;
        var _b;
        if (fee === void 0) { fee = 3000; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
                    positionManager = new ethers_1.ethers.Contract(constant_js_1.piperv3NFTPositionManagerAddress, abi_js_1.nft_position_manager_abi, signer);
                    tx = void 0;
                    _a = token1.toLowerCase() < token2.toLowerCase()
                        ? [token1, token2, amount1, amount2]
                        : [token2, token1, amount2, amount1], token0 = _a[0], token1_ = _a[1], amount0Sorted = _a[2], amount1Sorted = _a[3];
                    _b = {
                        token0: token0,
                        token1: token1_,
                        fee: fee,
                        tickLower: tickLower,
                        tickUpper: tickUpper,
                        amount0Desired: amount0Sorted,
                        amount1Desired: amount1Sorted,
                        amount0Min: 0, // You might want to add these as parameters
                        amount1Min: 0
                    };
                    return [4 /*yield*/, signer.getAddress()];
                case 1:
                    params = (_b.recipient = _c.sent(),
                        _b.deadline = expirationTimestamp,
                        _b);
                    if (!(token0 === constant_js_1.WIP_ADDRESS || token1_ === constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 3];
                    value = token0 === constant_js_1.WIP_ADDRESS ? amount0Sorted : amount1Sorted;
                    return [4 /*yield*/, positionManager.mint(params, { value: value })];
                case 2:
                    tx = _c.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, positionManager.mint(params)];
                case 4:
                    tx = _c.sent();
                    _c.label = 5;
                case 5: return [4 /*yield*/, tx.wait()];
                case 6: return [2 /*return*/, _c.sent()];
                case 7:
                    error_2 = _c.sent();
                    console.error("Error in v3AddLiquidity:", error_2);
                    throw error_2;
                case 8: return [2 /*return*/];
            }
        });
    });
};
exports.v3AddLiquidity = v3AddLiquidity;
// token0 fee token1 fee token2 fee token3 fee token4
function encodeV3Path(path) {
    if (path.length < 2 || path.length % 2 !== 1) {
        throw new Error('Path must contain odd number of elements (address + fee + address + fee + ... + address)');
    }
    var types = ['address'];
    var values = [path[0]];
    // For each pair of addresses, we need a fee in between
    for (var i = 1; i < path.length; i += 2) {
        types.push('uint24', 'address');
        values.push(Number(path[i]), path[i + 1]);
    }
    return ethers_1.ethers.utils.solidityPack(types, values);
}
var v3Swap = function (amount1, amount2Min, path, expirationTimestamp, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var router, tx, _a, _b, _c, _d, error_3;
    var _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                if (path.length != 3) {
                    throw new Error("path must contain 3 elements");
                }
                _g.label = 1;
            case 1:
                _g.trys.push([1, 10, , 11]);
                router = new ethers_1.ethers.Contract(constant_js_1.piperv3SwapRouterAddress, abi_js_1.piperv3SwapRouter_abi, signer);
                tx = void 0;
                if (!(path[0] == constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 5];
                _b = (_a = router).exactInputSingle;
                _e = { tokenIn: path[0],
                    tokenOut: path[2],
                    fee: path[1] };
                return [4 /*yield*/, signer.getAddress()];
            case 2: return [4 /*yield*/, _b.apply(_a, [(_e.recipient = _g.sent(), _e.deadline = expirationTimestamp, _e.amountIn = amount1, _e.amountOutMinimum = amount2Min, _e.sqrtPriceLimitX96 = BigInt(0), _e), { value: amount1, gasLimit: 3000000 }])];
            case 3:
                tx = _g.sent();
                return [4 /*yield*/, tx.wait()];
            case 4: return [2 /*return*/, _g.sent()];
            case 5:
                _d = (_c = router).exactInputSingle;
                _f = { tokenIn: path[0],
                    tokenOut: path[2],
                    fee: path[1] };
                return [4 /*yield*/, signer.getAddress()];
            case 6: return [4 /*yield*/, _d.apply(_c, [(_f.recipient = _g.sent(), _f.deadline = expirationTimestamp, _f.amountIn = amount1, _f.amountOutMinimum = amount2Min, _f.sqrtPriceLimitX96 = BigInt(0), _f), { gasLimit: 3000000 }])];
            case 7:
                tx = _g.sent();
                return [4 /*yield*/, tx.wait()];
            case 8: return [2 /*return*/, _g.sent()];
            case 9: return [3 /*break*/, 11];
            case 10:
                error_3 = _g.sent();
                console.error("Error in v3 swap:", error_3);
                throw error_3;
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.v3Swap = v3Swap;
var v3GetPrice = function (token1_1, token2_1) {
    var args_1 = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args_1[_i - 2] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([token1_1, token2_1], args_1, true), void 0, function (token1, token2, fee // Default to 0.3% fee tier
    ) {
        var factory, poolAddress, poolContract, slot0, sqrtPriceX96, price, token0, error_4;
        if (fee === void 0) { fee = 3000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    factory = new ethers_1.ethers.Contract(constant_js_1.piperv3FactoryAddress, abi_js_1.piperv3_factory_abi, constant_js_1.provider);
                    return [4 /*yield*/, factory.getPool(token1, token2, fee)];
                case 1:
                    poolAddress = _a.sent();
                    if (poolAddress === '0x0000000000000000000000000000000000000000') {
                        throw new Error('Pool does not exist');
                    }
                    poolContract = new ethers_1.ethers.Contract(poolAddress, abi_js_1.piperv3_pool_abi, constant_js_1.provider);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 6]);
                    return [4 /*yield*/, poolContract.slot0()];
                case 3:
                    slot0 = _a.sent();
                    sqrtPriceX96 = slot0.sqrtPriceX96;
                    price = Math.pow((Number(sqrtPriceX96) / Math.pow(2, 96)), 2);
                    return [4 /*yield*/, poolContract.token0()];
                case 4:
                    token0 = _a.sent();
                    return [2 /*return*/, token0.toLowerCase() === token1.toLowerCase() ? price : 1 / price];
                case 5:
                    error_4 = _a.sent();
                    console.error("Error fetching V3 price:", error_4);
                    throw error_4;
                case 6: return [2 /*return*/];
            }
        });
    });
};
exports.v3GetPrice = v3GetPrice;
var v3GetPriceWithDecimals = function (token1_1, token2_1, decimal1_1, decimal2_1) {
    var args_1 = [];
    for (var _i = 4; _i < arguments.length; _i++) {
        args_1[_i - 4] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([token1_1, token2_1, decimal1_1, decimal2_1], args_1, true), void 0, function (token1, token2, decimal1, decimal2, fee // Default to 0.3% fee tier
    ) {
        var price;
        if (fee === void 0) { fee = 3000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, exports.v3GetPrice)(token1, token2, fee)];
                case 1:
                    price = _a.sent();
                    return [2 /*return*/, price * Math.pow(10, (decimal1 - decimal2))];
            }
        });
    });
};
exports.v3GetPriceWithDecimals = v3GetPriceWithDecimals;
var v2GetPrice = function (token1, token2) { return __awaiter(void 0, void 0, void 0, function () {
    var pairAddress, pairContract, _a, reserve1, reserve2, token1_, price, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, constant_js_1.v2ComputeAddress)(token1, token2)];
            case 1:
                pairAddress = _b.sent();
                pairContract = new ethers_1.ethers.Contract(pairAddress, abi_js_1.v2_pool_abi, constant_js_1.provider);
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 5]);
                return [4 /*yield*/, pairContract.getReserves()];
            case 3:
                _a = _b.sent(), reserve1 = _a[0], reserve2 = _a[1];
                token1_ = token1.toLowerCase() < token2.toLowerCase() ? token1 : token2;
                price = token1_ === token1
                    ? reserve2.toString() / reserve1.toString()
                    : reserve1.toString() / reserve2.toString();
                return [2 /*return*/, price];
            case 4:
                error_5 = _b.sent();
                console.error("Error fetching reserves:", error_5);
                throw error_5;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.v2GetPrice = v2GetPrice;
var v2GetPriceWithDecimals = function (token1, token2, decimal1, decimal2) { return __awaiter(void 0, void 0, void 0, function () {
    var price;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.v2GetPrice)(token1, token2)];
            case 1:
                price = _a.sent();
                return [2 /*return*/, price * Math.pow(10, (decimal1 - decimal2))];
        }
    });
}); };
exports.v2GetPriceWithDecimals = v2GetPriceWithDecimals;
var v2Swap = function (amount1, amount2Min, path, expirationTimestamp, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var router, tx, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                router = new ethers_1.ethers.Contract(constant_js_1.v2RouterAddress, abi_js_1.v2_router_abi, signer);
                tx = void 0;
                if (!(path[0] == constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 2];
                return [4 /*yield*/, router.swapExactETHForTokens(amount2Min, path, signer.getAddress(), expirationTimestamp, { value: amount1 })];
            case 1:
                tx = _a.sent();
                return [3 /*break*/, 6];
            case 2:
                if (!(path[path.length - 1] == constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 4];
                return [4 /*yield*/, router.swapExactTokensForETH(amount1, amount2Min, path, signer.getAddress(), expirationTimestamp)];
            case 3:
                tx = _a.sent();
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, router.swapExactTokensForTokens(amount1, amount2Min, path, signer.getAddress(), expirationTimestamp)];
            case 5:
                tx = _a.sent();
                _a.label = 6;
            case 6: return [4 /*yield*/, tx.wait()];
            case 7: return [2 /*return*/, _a.sent()];
            case 8:
                error_6 = _a.sent();
                console.error("Error in swap:", error_6);
                throw error_6;
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.v2Swap = v2Swap;
var v2AddLiquidity = function (token1, token2, amount1, amount2, amount1Min, amount2Min, expirationTimestamp, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var router, tx, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                router = new ethers_1.ethers.Contract(constant_js_1.v2RouterAddress, abi_js_1.v2_router_abi, signer);
                tx = void 0;
                if (!(token1 == constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 2];
                return [4 /*yield*/, router.addLiquidityETH(token2, amount2, amount2Min, amount1Min, signer.getAddress(), expirationTimestamp, { value: amount1 })];
            case 1:
                tx = _a.sent();
                return [3 /*break*/, 6];
            case 2:
                if (!(token2 == constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 4];
                return [4 /*yield*/, router.addLiquidityETH(token1, amount1, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp, { value: amount2 })];
            case 3:
                tx = _a.sent();
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, router.addLiquidity(token1, token2, amount1, amount2, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp)];
            case 5:
                tx = _a.sent();
                _a.label = 6;
            case 6: return [4 /*yield*/, tx.wait()];
            case 7: return [2 /*return*/, _a.sent()];
            case 8:
                error_7 = _a.sent();
                console.error("Error in addLiquidity:", error_7);
                throw error_7;
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.v2AddLiquidity = v2AddLiquidity;
var v2RemoveLiquidity = function (token1, token2, liquidity, amount1Min, amount2Min, expirationTimestamp, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var router, tx, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                router = new ethers_1.ethers.Contract(constant_js_1.v2RouterAddress, abi_js_1.v2_router_abi, signer);
                tx = void 0;
                if (!(token1 == constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 2];
                return [4 /*yield*/, router.removeLiquidityETH(token2, liquidity, amount2Min, amount1Min, signer.getAddress(), expirationTimestamp)];
            case 1:
                tx = _a.sent();
                return [3 /*break*/, 6];
            case 2:
                if (!(token2 == constant_js_1.WIP_ADDRESS)) return [3 /*break*/, 4];
                return [4 /*yield*/, router.removeLiquidityETH(token1, liquidity, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp)];
            case 3:
                tx = _a.sent();
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, router.removeLiquidity(token1, token2, liquidity, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp)];
            case 5:
                tx = _a.sent();
                _a.label = 6;
            case 6: return [4 /*yield*/, tx.wait()];
            case 7: return [2 /*return*/, _a.sent()];
            case 8:
                error_8 = _a.sent();
                console.error("Error in removeLiquidity:", error_8);
                throw error_8;
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.v2RemoveLiquidity = v2RemoveLiquidity;
var v2RouterTokenApproval = function (token, amount, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var router, tx;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                router = new ethers_1.ethers.Contract(constant_js_1.v2RouterAddress, abi_js_1.v2_router_abi, signer);
                return [4 /*yield*/, router.approve(token, amount)];
            case 1:
                tx = _a.sent();
                return [4 /*yield*/, tx.wait()];
            case 2: return [2 /*return*/, _a.sent()];
        }
    });
}); };
exports.v2RouterTokenApproval = v2RouterTokenApproval;
