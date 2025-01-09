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
var ethers_1 = require("ethers");
var routing_1 = require("./routing");
var core_1 = require("./core");
var constant_1 = require("./constant");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var PIPAddr, wipAddr, _a, bestRouteInput, maxAmountOut, _b, bestRouteOutput, minAmountIn, price, _c, bestRouteOutputV3, minAmountInV3, _d, bestRouteInputV3, maxAmountOutV3, tx;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    PIPAddr = "0x6e990040Fd9b06F98eFb62A147201696941680b5";
                    wipAddr = '0xe8CabF9d1FFB6CE23cF0a86641849543ec7BD7d5';
                    return [4 /*yield*/, (0, routing_1.v2RoutingExactInput)(wipAddr, PIPAddr, ethers_1.ethers.utils.parseUnits("1", 18).toBigInt())];
                case 1:
                    _a = _e.sent(), bestRouteInput = _a.bestRoute, maxAmountOut = _a.maxAmountOut;
                    console.log("bestRoute: ", bestRouteInput);
                    console.log("maxAmountOut: ", Number(maxAmountOut));
                    return [4 /*yield*/, (0, routing_1.v2RoutingExactOutput)(wipAddr, PIPAddr, ethers_1.ethers.utils.parseUnits("1", 8).toBigInt())];
                case 2:
                    _b = _e.sent(), bestRouteOutput = _b.bestRoute, minAmountIn = _b.minAmountIn;
                    console.log("bestRoute: ", bestRouteOutput);
                    console.log("minAmountIn: ", ethers_1.ethers.utils.formatUnits(minAmountIn, 18));
                    return [4 /*yield*/, (0, core_1.v2GetPriceWithDecimals)(wipAddr, PIPAddr, 18, 6)];
                case 3:
                    price = _e.sent();
                    console.log("price: ", price);
                    return [4 /*yield*/, (0, routing_1.v3RoutingExactOutput)(wipAddr, PIPAddr, ethers_1.ethers.utils.parseUnits("1", 8).toBigInt(), constant_1.signer)];
                case 4:
                    _c = _e.sent(), bestRouteOutputV3 = _c.bestRoute, minAmountInV3 = _c.minAmountIn;
                    console.log("bestRoute: ", bestRouteOutputV3);
                    console.log("minAmountIn: ", ethers_1.ethers.utils.formatUnits(minAmountInV3, 18));
                    return [4 /*yield*/, (0, routing_1.v3RoutingExactInput)(wipAddr, PIPAddr, ethers_1.ethers.utils.parseUnits("1", 18).toBigInt(), constant_1.signer)];
                case 5:
                    _d = _e.sent(), bestRouteInputV3 = _d.bestRoute, maxAmountOutV3 = _d.maxAmountOut;
                    console.log("bestRoute: ", bestRouteInputV3);
                    console.log("maxAmountOut: ", ethers_1.ethers.utils.formatUnits(maxAmountOutV3, 8));
                    // const path = [
                    //     WIP_ADDRESS,
                    //     "3000",
                    //     PIPAddr
                    // ]
                    console.log("timestamp: ", Math.floor(Date.now() / 1000));
                    return [4 /*yield*/, (0, core_1.v3Swap)(ethers_1.ethers.utils.parseUnits("0.1", 18).toBigInt(), BigInt(0), bestRouteInputV3, BigInt(Math.floor(Date.now() / 1000) + 120), constant_1.signer)];
                case 6:
                    tx = _e.sent();
                    console.log("v3 swap tx: ", tx);
                    return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main().then(function (resp) { return console.log(resp); });
}
