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
exports.v2RouterTokenApproval = exports.v2RemoveLiquidity = exports.v2AddLiquidity = exports.v2Swap = exports.v2GetPriceWithDecimals = exports.fetchDailyData = exports.v2GetPrice = void 0;
var abi_js_1 = require("./abi.js");
var constant_js_1 = require("./constant.js");
var ethers_1 = require("ethers");
var axios_1 = require("axios");
var v2GetPrice = function (token1, token2) { return __awaiter(void 0, void 0, void 0, function () {
    var pairAddress, pairContract, _a, reserve1, reserve2, token1_, price, error_1;
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
                error_1 = _b.sent();
                console.error("Error fetching reserves:", error_1);
                throw error_1;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.v2GetPrice = v2GetPrice;
var fetchDailyData = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.get('https://piperxdb.piperxprotocol.workers.dev/api/graphdata')];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
            case 2:
                error_2 = _a.sent();
                console.error('Error fetching daily data:', error_2);
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.fetchDailyData = fetchDailyData;
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
    var router, tx, error_3;
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
                error_3 = _a.sent();
                console.error("Error in swap:", error_3);
                throw error_3;
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.v2Swap = v2Swap;
var v2AddLiquidity = function (token1, token2, amount1, amount2, amount1Min, amount2Min, expirationTimestamp, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var router, tx, error_4;
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
                error_4 = _a.sent();
                console.error("Error in addLiquidity:", error_4);
                throw error_4;
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.v2AddLiquidity = v2AddLiquidity;
var v2RemoveLiquidity = function (token1, token2, liquidity, amount1Min, amount2Min, expirationTimestamp, signer) { return __awaiter(void 0, void 0, void 0, function () {
    var router, tx, error_5;
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
                error_5 = _a.sent();
                console.error("Error in removeLiquidity:", error_5);
                throw error_5;
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
