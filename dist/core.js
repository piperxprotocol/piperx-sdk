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
exports.v3PositionManagerTokenApproval = exports.routerTokenApproval = exports.v3RouterTokenApproval = exports.v2RouterTokenApproval = exports.v2RemoveLiquidity = exports.v2AddLiquidity = exports.v2Swap = exports.v2GetPriceWithDecimals = exports.v2GetPrice = exports.v3GetPriceWithDecimals = exports.v3GetPrice = exports.swap = exports.v3Swap = exports.encodeV3Path = exports.v3AddLiquidity = exports.v3CreatePool = exports.v3RemoveLiquidity = exports.v3ClaimFee = void 0;
const abi_js_1 = require("./abi.js");
const constant_js_1 = require("./constant.js");
const ethers_1 = require("ethers");
const v3ClaimFee = (tokenId, recipient, amount0Max, amount1Max, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const positionManager = new ethers_1.ethers.Contract(constant_js_1.piperv3NFTPositionManagerAddress, abi_js_1.nft_position_manager_abi, signer);
        const params = {
            tokenId: tokenId,
            recipient: recipient,
            amount0Max: amount0Max,
            amount1Max: amount1Max
        };
        const tx = yield positionManager.collect(params);
        return yield tx.wait();
    }
    catch (error) {
        console.error("Error in v3claimFee:", error);
        throw error;
    }
});
exports.v3ClaimFee = v3ClaimFee;
const v3RemoveLiquidity = (token1, token2, tokenId, liquidity, amount1Min, amount2Min, expirationTimestamp, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const positionManager = new ethers_1.ethers.Contract(constant_js_1.piperv3NFTPositionManagerAddress, abi_js_1.nft_position_manager_abi, signer);
        let tx;
        // Ensure token order is correct (token0 < token1)
        const params = {
            tokenId: tokenId,
            liquidity: liquidity,
            amount0Min: token1.toLowerCase() < token2.toLowerCase() ? amount1Min : amount2Min,
            amount1Min: token1.toLowerCase() < token2.toLowerCase() ? amount2Min : amount1Min,
            deadline: expirationTimestamp
        };
        tx = yield positionManager.decreaseLiquidity(params);
        let receipt = yield tx.wait();
        return receipt;
    }
    catch (error) {
        console.error("Error in v3RemoveLiquidity:", error);
        throw error;
    }
});
exports.v3RemoveLiquidity = v3RemoveLiquidity;
const v3CreatePool = (token0, token1, fee = 3000, initialPrice, signer) => __awaiter(void 0, void 0, void 0, function* () {
    const factory = new ethers_1.ethers.Contract(constant_js_1.piperv3NFTPositionManagerAddress, abi_js_1.nft_position_manager_abi, signer);
    const tx = yield factory.createAndInitializePoolIfNecessary(token0, token1, fee, initialPrice);
    return yield tx.wait();
});
exports.v3CreatePool = v3CreatePool;
const v3AddLiquidity = (token1, token2, amount1, amount2, amount1Min, amount2Min, tickLower, tickUpper, fee = 3000, // Default to 0.3% fee tier
expirationTimestamp, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const positionManager = new ethers_1.ethers.Contract(constant_js_1.piperv3NFTPositionManagerAddress, abi_js_1.nft_position_manager_abi, signer);
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
            recipient: yield signer.getAddress(),
            deadline: expirationTimestamp
        };
        if (token0 === constant_js_1.WIP_ADDRESS || token1_ === constant_js_1.WIP_ADDRESS) {
            const value = token0 === constant_js_1.WIP_ADDRESS ? amount0Sorted : amount1Sorted;
            tx = yield positionManager.mint(params, { value });
        }
        else {
            tx = yield positionManager.mint(params);
        }
        return yield tx.wait();
    }
    catch (error) {
        console.error("Error in v3AddLiquidity:", error);
        throw error;
    }
});
exports.v3AddLiquidity = v3AddLiquidity;
// token0 fee token1 fee token2 fee token3 fee token4
function encodeV3Path(path) {
    if (path.length < 2 || path.length % 2 !== 1) {
        throw new Error('Path must contain odd number of elements (address + fee + address + fee + ... + address)');
    }
    const types = ['address'];
    const values = [path[0]];
    // For each pair of addresses, we need a fee in between
    for (let i = 1; i < path.length; i += 2) {
        types.push('uint24', 'address');
        values.push(Number(path[i]), path[i + 1]);
    }
    return ethers_1.ethers.utils.solidityPack(types, values);
}
exports.encodeV3Path = encodeV3Path;
const v3Swap = (amount1, amount2Min, path, expirationTimestamp, signer) => __awaiter(void 0, void 0, void 0, function* () {
    if (path.length != 3) {
        throw new Error("path must contain 3 elements");
    }
    try {
        const router = new ethers_1.ethers.Contract(constant_js_1.piperv3SwapRouterAddress, abi_js_1.piperv3SwapRouter_abi, signer);
        //const wip = new ethers.Contract(WIP_ADDRESS, piperv3_pool_abi, signer);
        let tx;
        const encodedPath = encodeV3Path(path);
        if (path[0] == constant_js_1.WIP_ADDRESS) { // swap Exact IP for tokens
            tx = yield router.exactInput({
                path: encodedPath,
                recipient: yield signer.getAddress(),
                deadline: expirationTimestamp,
                amountIn: amount1,
                amountOutMinimum: amount2Min
            }, { value: amount1, gasLimit: 30000000 });
        }
        else { // swap Exact tokens for IP or tokens
            tx = yield router.exactInput({
                path: encodeV3Path,
                recipient: yield signer.getAddress(),
                deadline: expirationTimestamp,
                amountIn: amount1,
                amountOutMinimum: amount2Min
            }, { gasLimit: 30000000 });
        }
        // if (path[0] == WIP_ADDRESS) { // swap Exact IP for tokens
        // tx = await router.exactInputSingle(
        //     {tokenIn: path[0],
        //     tokenOut: path[2],
        //     fee: path[1],
        //     recipient: await signer.getAddress(),
        //     deadline: expirationTimestamp,
        //     amountIn: amount1,
        //     amountOutMinimum: amount2Min,
        //     sqrtPriceLimitX96: BigInt(0)}, { value: amount1, gasLimit: 3000000 });
        //     return await tx.wait();
        // } else { // swap Exact tokens for IP or tokens
        //     tx = await router.exactInputSingle(
        //         {tokenIn: path[0],
        //         tokenOut: path[2],
        //         fee: path[1],
        //         recipient: await signer.getAddress(),
        //         deadline: expirationTimestamp,
        //         amountIn: amount1,
        //         amountOutMinimum: amount2Min,
        //         sqrtPriceLimitX96: BigInt(0)}, { gasLimit: 3000000 });
        //     return await tx.wait();
        // }
    }
    catch (error) {
        console.error("Error in v3 swap:", error);
        throw error;
    }
});
exports.v3Swap = v3Swap;
const swap = (amount1, amount2Min, path, expirationTimestamp, signer) => __awaiter(void 0, void 0, void 0, function* () {
    if (path[1].length < 10) { // v3 swap
        return yield (0, exports.v3Swap)(amount1, amount2Min, path, expirationTimestamp, signer);
    }
    else { // v2 swap
        return yield (0, exports.v2Swap)(amount1, amount2Min, path, expirationTimestamp, signer);
    }
});
exports.swap = swap;
const v3GetPrice = (token1, token2, fee = 3000 // Default to 0.3% fee tier
) => __awaiter(void 0, void 0, void 0, function* () {
    // Compute pool address using V3 factory
    const factory = new ethers_1.ethers.Contract(constant_js_1.piperv3FactoryAddress, abi_js_1.piperv3_factory_abi, constant_js_1.provider);
    const poolAddress = yield factory.getPool(token1, token2, fee);
    if (poolAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Pool does not exist');
    }
    const poolContract = new ethers_1.ethers.Contract(poolAddress, abi_js_1.piperv3_pool_abi, constant_js_1.provider);
    try {
        const slot0 = yield poolContract.slot0();
        const sqrtPriceX96 = slot0.sqrtPriceX96;
        // Convert sqrtPriceX96 to regular price
        const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2;
        // Determine if price needs to be inverted based on token order
        const token0 = yield poolContract.token0();
        return token0.toLowerCase() === token1.toLowerCase() ? price : 1 / price;
    }
    catch (error) {
        console.error("Error fetching V3 price:", error);
        throw error;
    }
});
exports.v3GetPrice = v3GetPrice;
const v3GetPriceWithDecimals = (token1, token2, decimal1, decimal2, fee = 3000 // Default to 0.3% fee tier
) => __awaiter(void 0, void 0, void 0, function* () {
    const price = yield (0, exports.v3GetPrice)(token1, token2, fee);
    return price * 10 ** (decimal1 - decimal2);
});
exports.v3GetPriceWithDecimals = v3GetPriceWithDecimals;
const v2GetPrice = (token1, token2) => __awaiter(void 0, void 0, void 0, function* () {
    const pairAddress = yield (0, constant_js_1.v2ComputeAddress)(token1, token2);
    const pairContract = new ethers_1.ethers.Contract(pairAddress, abi_js_1.v2_pool_abi, constant_js_1.provider);
    try {
        const [reserve1, reserve2] = yield pairContract.getReserves();
        // Determine token order (tokens are stored in ascending order by address in Uniswap V2)
        const token1_ = token1.toLowerCase() < token2.toLowerCase() ? token1 : token2;
        // Calculate price based on reserves
        const price = token1_ === token1
            ? reserve2.toString() / reserve1.toString()
            : reserve1.toString() / reserve2.toString();
        return price;
    }
    catch (error) {
        console.error("Error fetching reserves:", error);
        throw error;
    }
});
exports.v2GetPrice = v2GetPrice;
const v2GetPriceWithDecimals = (token1, token2, decimal1, decimal2) => __awaiter(void 0, void 0, void 0, function* () {
    const price = yield (0, exports.v2GetPrice)(token1, token2);
    return price * 10 ** (decimal1 - decimal2);
});
exports.v2GetPriceWithDecimals = v2GetPriceWithDecimals;
const v2Swap = (amount1, amount2Min, path, expirationTimestamp, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const router = new ethers_1.ethers.Contract(constant_js_1.v2RouterAddress, abi_js_1.v2_router_abi, signer);
        let tx;
        if (path[0] == constant_js_1.WIP_ADDRESS) { // swap Exact ETH for tokens
            tx = yield router.swapExactETHForTokens(amount2Min, path, signer.getAddress(), expirationTimestamp, { value: amount1 });
        }
        else if (path[path.length - 1] == constant_js_1.WIP_ADDRESS) { // swap Exact tokens for ETH
            tx = yield router.swapExactTokensForETH(amount1, amount2Min, path, signer.getAddress(), expirationTimestamp);
        }
        else {
            tx = yield router.swapExactTokensForTokens(amount1, amount2Min, path, signer.getAddress(), expirationTimestamp);
        }
        return yield tx.wait();
    }
    catch (error) {
        console.error("Error in swap:", error);
        throw error;
    }
});
exports.v2Swap = v2Swap;
const v2AddLiquidity = (token1, token2, amount1, amount2, amount1Min, amount2Min, expirationTimestamp, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const router = new ethers_1.ethers.Contract(constant_js_1.v2RouterAddress, abi_js_1.v2_router_abi, signer);
        let tx;
        if (token1 == constant_js_1.WIP_ADDRESS) {
            tx = yield router.addLiquidityETH(token2, amount2, amount2Min, amount1Min, signer.getAddress(), expirationTimestamp, { value: amount1 });
        }
        else if (token2 == constant_js_1.WIP_ADDRESS) {
            tx = yield router.addLiquidityETH(token1, amount1, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp, { value: amount2 });
        }
        else {
            tx = yield router.addLiquidity(token1, token2, amount1, amount2, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp);
        }
        return yield tx.wait();
    }
    catch (error) {
        console.error("Error in addLiquidity:", error);
        throw error;
    }
});
exports.v2AddLiquidity = v2AddLiquidity;
const v2RemoveLiquidity = (token1, token2, liquidity, amount1Min, amount2Min, expirationTimestamp, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const router = new ethers_1.ethers.Contract(constant_js_1.v2RouterAddress, abi_js_1.v2_router_abi, signer);
        let tx;
        if (token1 == constant_js_1.WIP_ADDRESS) {
            tx = yield router.removeLiquidityETH(token2, liquidity, amount2Min, amount1Min, signer.getAddress(), expirationTimestamp);
        }
        else if (token2 == constant_js_1.WIP_ADDRESS) {
            tx = yield router.removeLiquidityETH(token1, liquidity, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp);
        }
        else {
            tx = yield router.removeLiquidity(token1, token2, liquidity, amount1Min, amount2Min, signer.getAddress(), expirationTimestamp);
        }
        return yield tx.wait();
    }
    catch (error) {
        console.error("Error in removeLiquidity:", error);
        throw error;
    }
});
exports.v2RemoveLiquidity = v2RemoveLiquidity;
const v2RouterTokenApproval = (token, amount, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create contract instance for the token
        const tokenContract = new ethers_1.ethers.Contract(token, abi_js_1.abi, signer);
        // Approve router to spend tokens
        const tx = yield tokenContract.approve(constant_js_1.v2RouterAddress, amount);
        return yield tx.wait();
    }
    catch (error) {
        console.error("Error in v2RouterTokenApproval:", error);
        throw error;
    }
});
exports.v2RouterTokenApproval = v2RouterTokenApproval;
const v3RouterTokenApproval = (token, amount, signer) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create contract instance for the token
        const tokenContract = new ethers_1.ethers.Contract(token, abi_js_1.abi, signer);
        // Approve router to spend tokens
        const tx = yield tokenContract.approve(constant_js_1.piperv3SwapRouterAddress, amount);
        return yield tx.wait();
    }
    catch (error) {
        console.error("Error in v3RouterTokenApproval:", error);
        throw error;
    }
});
exports.v3RouterTokenApproval = v3RouterTokenApproval;
const routerTokenApproval = (token, amount, path, signer) => __awaiter(void 0, void 0, void 0, function* () {
    if (path[1].length < 10) { // v3 swap
        return yield (0, exports.v3RouterTokenApproval)(token, amount, signer);
    }
    else { // v2 swap
        return yield (0, exports.v2RouterTokenApproval)(token, amount, signer);
    }
});
exports.routerTokenApproval = routerTokenApproval;
const v3PositionManagerTokenApproval = (token, amount, signer) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenContract = new ethers_1.ethers.Contract(token, abi_js_1.abi, signer);
    // Approve router to spend tokens
    const tx = yield tokenContract.approve(constant_js_1.piperv3NFTPositionManagerAddress, amount);
    return yield tx.wait();
});
exports.v3PositionManagerTokenApproval = v3PositionManagerTokenApproval;
