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
exports.v3ComputeAddress = exports.v2ComputeAddress = exports.multicallAddress = exports.piperv3NFTPositionManagerAddress = exports.piperv3FactoryAddress = exports.piperv3SwapRouterAddress = exports.piperv3QuoterAddress = exports.v2RouterAddress = exports.v2FactoryAddress = exports.WIP_ADDRESS = exports.fee2TickSpace = exports.defaultTokens = exports.signer = exports.provider = void 0;
var ethers_1 = require("ethers");
var utils_1 = require("ethers/lib/utils");
var utils_2 = require("ethers/lib/utils");
var utils_3 = require("ethers/lib/utils");
var abi_1 = require("./abi");
var privateKey = "52d045318ba4d29e39918d8c14b7f734f20da97b293f34317fd0ed8c2b180c2f";
var URL = 'https://odyssey.storyrpc.io/';
exports.provider = new ethers_1.ethers.providers.JsonRpcProvider(URL);
// export const walletAddress = accounts[0]    // first account in MetaMask
exports.signer = new ethers_1.ethers.Wallet(privateKey, exports.provider);
exports.defaultTokens = [
    '0x40fCa9cB1AB15eD9B5bDA19A52ac00A78AE08e1D',
    '0x02F75bdBb4732cc6419aC15EeBeE6BCee66e826f',
    '0x6D46EF45795B1c3e2a5f2A3F7aba5ea551be966f'
];
exports.fee2TickSpace = { "500": 10, "3000": 60, "10000": 200 };
// export const fee2TickSpace = {"500": 10}
exports.WIP_ADDRESS = "0xe8CabF9d1FFB6CE23cF0a86641849543ec7BD7d5";
exports.v2FactoryAddress = "0x700722D24f9256Be288f56449E8AB1D27C4a70ca";
exports.v2RouterAddress = "0x8812d810EA7CC4e1c3FB45cef19D6a7ECBf2D85D";
exports.piperv3QuoterAddress = "0x82C210d4aA5948f68E46Af355C0399c2E921e8e4";
exports.piperv3SwapRouterAddress = "0xbBb8B63596d5447a12Ddee557ac9fA326f42B57D";
exports.piperv3FactoryAddress = "0xf3d448d7A83F749695c49d8411247fC3868fB633"; // "0xDbc2D2C9514A50E905355388b8474fF3E7c59065" // "0x29330ED17323ecF354cE4AE871b2051cAF73E36D"
exports.piperv3NFTPositionManagerAddress = "0xf03c65d9be145746f800E2781eD140F6dd238F38"; //"0xBbd6437059feFa1E525645206eBc4cE942996f06" //"0xC938d8751164699c849716Ae504035601D485104"
exports.multicallAddress = "0xcA11bde05977b3631167028862bE2a173976CA11";
var v2ComputeAddress = function (token0, token1) {
    var _a = token0.toLowerCase() < token1.toLowerCase()
        ? [token0, token1]
        : [token1, token0], token0Sorted = _a[0], token1Sorted = _a[1];
    var salt = (0, utils_1.keccak256)((0, utils_3.solidityPack)(['address', 'address'], [token0Sorted, token1Sorted]));
    var initCodeHash = "0x754f724019203c806610a02ada224eb21dbe068a93d50486e52cf0ae30de457a";
    return (0, utils_2.getCreate2Address)(exports.v2FactoryAddress, salt, initCodeHash);
};
exports.v2ComputeAddress = v2ComputeAddress;
var v3ComputeAddress = function (token0, token1, fee) { return __awaiter(void 0, void 0, void 0, function () {
    var contract, poolAddress;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                contract = new ethers_1.ethers.Contract(exports.piperv3FactoryAddress, abi_1.piperv3_factory_abi, exports.provider);
                return [4 /*yield*/, contract.getPool(token0, token1, fee)];
            case 1:
                poolAddress = _a.sent();
                return [2 /*return*/, poolAddress];
        }
    });
}); };
exports.v3ComputeAddress = v3ComputeAddress;
