import { ethers } from 'ethers';
import {v2RoutingExactInput, v2RoutingExactOutput, v3RoutingExactOutputSingle} from './routing'
import {fetchDailyData, v2AddLiquidity, v2GetPrice, v2GetPriceWithDecimals, v2Swap} from './core'
import {signer, WIP_ADDRESS} from './constant'

async function main() {

    const PIPAddr = "0x6e990040Fd9b06F98eFb62A147201696941680b5";
    const wipAddr = '0xe8CabF9d1FFB6CE23cF0a86641849543ec7BD7d5';

    const { bestRoute: bestRouteInput, maxAmountOut } = await v2RoutingExactInput(wipAddr, PIPAddr, ethers.utils.parseUnits("1", 14).toBigInt());
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

    const data = await fetchDailyData();
    console.log("data: ", data);
}

if (require.main === module) {
    main().then((resp) => console.log(resp));
}
