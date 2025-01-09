import { ethers } from 'ethers';
import { v2RoutingExactInput, v2RoutingExactOutput, v3RoutingExactInput, v3RoutingExactOutput } from './routing'
import { v2AddLiquidity, v2GetPrice, v2GetPriceWithDecimals, v2Swap, v3Swap, encodeV3Path } from './core'
import {piperv3SwapRouterAddress, signer, WIP_ADDRESS} from './constant'
import { erc20_abi } from './abi';

async function main() {

    const PIPAddr = "0x6e990040Fd9b06F98eFb62A147201696941680b5";
    const wipAddr = '0xe8CabF9d1FFB6CE23cF0a86641849543ec7BD7d5';

    const { bestRoute: bestRouteInput, maxAmountOut } = await v2RoutingExactInput(wipAddr, PIPAddr, ethers.utils.parseUnits("1", 18).toBigInt());
    console.log("bestRoute: ", bestRouteInput);
    console.log("maxAmountOut: ", Number(maxAmountOut));

    const { bestRoute: bestRouteOutput, minAmountIn } = await v2RoutingExactOutput(wipAddr, PIPAddr, ethers.utils.parseUnits("1", 8).toBigInt());
    console.log("bestRoute: ", bestRouteOutput);
    console.log("minAmountIn: ", ethers.utils.formatUnits(minAmountIn, 18));

    // await v2Swap(
    //     ethers.utils.parseUnits("1", 14).toBigInt(),
    //     (BigInt(maxAmountOut) * BigInt(95)) / BigInt(100),
    //     bestRouteInput,
    //     BigInt(Math.floor(Date.now() / 1000) + 120),
    //     signer
    // )

    const price = await v2GetPriceWithDecimals(wipAddr, PIPAddr, 18, 6);
    console.log("price: ", price);

    const { bestRoute: bestRouteOutputV3, minAmountIn: minAmountInV3 } = await v3RoutingExactOutput(wipAddr, PIPAddr, ethers.utils.parseUnits("1", 8).toBigInt(), signer);
    console.log("bestRoute: ", bestRouteOutputV3);
    console.log("minAmountIn: ", ethers.utils.formatUnits(minAmountInV3, 18));

    const { bestRoute: bestRouteInputV3, maxAmountOut: maxAmountOutV3 } = await v3RoutingExactInput(wipAddr, PIPAddr, ethers.utils.parseUnits("1", 18).toBigInt(), signer);
    console.log("bestRoute: ", bestRouteInputV3);
    console.log("maxAmountOut: ", ethers.utils.formatUnits(maxAmountOutV3, 6));

    // const path = [
    //     WIP_ADDRESS,
    //     "3000",
    //     PIPAddr
    // ]

    console.log("timestamp: ", Math.floor(Date.now() / 1000));
    const tx = await v3Swap(
        ethers.utils.parseUnits("0.1", 18).toBigInt(),
        BigInt(0),
        bestRouteInputV3,
        BigInt(Math.floor(Date.now() / 1000) + 120),
        signer
    );
    console.log("v3 swap tx: ", tx);

    // console.log("timestamp: ", Math.floor(Date.now() / 1000));

    // const encodedPath = encodeV3Path(path);
    // console.log("encodedPath: ", encodedPath);
}

if (require.main === module) {
    main().then((resp) => console.log(resp));
}
