import { calculateCryptoTax, operationsFromCsv } from "../src/lib/crypto-tax.ts";

const csv = [
  "Fecha,Tipo,Activo entregado,Cantidad entregada,Activo recibido,Cantidad recibida,Valor EUR entregado,Valor EUR recibido,Comisiones EUR,Plataforma",
  "2025-01-01,Compra,BTC,1,,,10000,,10,Fuente A",
  "2025-02-01,Compra,BTC,1,,,12000,,10,Fuente A",
  "2025-03-01,Venta,BTC,1,,,15000,,10,Fuente A",
  "2025-04-01,Permuta,BTC,0.5,ETH,10,9000,9000,0,Fuente A",
  "2025-05-01,Venta,ETH,10,,,10000,,0,Fuente A",
  "2025-06-01,Venta,SOL,1,,,200,,0,Fuente A",
].join("\n");

const parsed = operationsFromCsv(csv);
const result = calculateCryptoTax(parsed.operations);
const [sale, swap, ethSale, incomplete] = result.lines;
if (parsed.warnings.length !== 0) throw new Error(`Encabezados inesperados: ${parsed.warnings.join("; ")}`);
if (!sale || Math.abs((sale.result ?? 0) - 4980) > 0.0001) throw new Error(`FIFO de venta incorrecto: ${sale?.result}`);
if (!swap || Math.abs((swap.result ?? 0) - 2995) > 0.0001) throw new Error(`FIFO de permuta incorrecto: ${swap?.result}`);
if (!ethSale || Math.abs((ethSale.result ?? 0) - 1000) > 0.0001) throw new Error(`Coste posterior de permuta incorrecto: ${ethSale?.result}`);
if (!incomplete?.warning || incomplete.result !== null) throw new Error("Una venta sin lotes debe requerir revisión.");

const insufficientSwapCsv = [
  "Fecha,Tipo,Activo entregado,Cantidad entregada,Activo recibido,Cantidad recibida,Valor EUR entregado,Valor EUR recibido,Comisiones EUR,Plataforma",
  "2025-01-01,Compra,BTC,0.25,,,5000,,0,Fuente B",
  "2025-02-01,Permuta,BTC,0.5,ETH,8,9000,9000,0,Fuente B",
].join("\n");
const insufficientSwap = calculateCryptoTax(operationsFromCsv(insufficientSwapCsv).operations);
const blockedSwap = insufficientSwap.lines[0];
const btcHolding = insufficientSwap.holdings.find((holding) => holding.asset === "BTC");
const ethHolding = insufficientSwap.holdings.find((holding) => holding.asset === "ETH");
if (!blockedSwap?.warning || blockedSwap.result !== null) throw new Error("Una permuta sin inventario suficiente debe requerir revisión.");
if (!btcHolding || Math.abs(btcHolding.quantity - 0.25) > 0.0000001 || Math.abs(btcHolding.cost - 5000) > 0.0001) throw new Error("Una permuta bloqueada no debe consumir el inventario BTC existente.");
if (ethHolding) throw new Error("Una permuta bloqueada no debe crear un lote del activo recibido.");

const chainedSwapCsv = [
  "Fecha,Tipo,Activo entregado,Cantidad entregada,Activo recibido,Cantidad recibida,Valor EUR entregado,Valor EUR recibido,Comisiones EUR,Plataforma",
  "2025-01-01,Compra,BTC,0.2,,,6000,,0,Fuente C",
  "2025-02-01,Permuta,BTC,0.2,ETH,3,7500,7500,0,Fuente C",
  "2025-03-01,Permuta,ETH,2,SOL,50,5400,5400,0,Fuente C",
  "2025-04-01,Venta,SOL,50,,,5900,,20,Fuente C",
].join("\n");
const chainedSwap = calculateCryptoTax(operationsFromCsv(chainedSwapCsv).operations);
const [btcToEth, ethToSol, solSale] = chainedSwap.lines;
const remainingEth = chainedSwap.holdings.find((holding) => holding.asset === "ETH");
if (Math.abs((btcToEth?.result ?? 0) - 1500) > 0.0001) throw new Error(`Resultado BTC→ETH incorrecto: ${btcToEth?.result}`);
if (Math.abs((ethToSol?.result ?? 0) - 400) > 0.0001) throw new Error(`Resultado ETH→SOL incorrecto: ${ethToSol?.result}`);
if (Math.abs((solSale?.result ?? 0) - 480) > 0.0001) throw new Error(`Resultado de venta SOL incorrecto: ${solSale?.result}`);
if (!remainingEth || Math.abs(remainingEth.quantity - 1) > 0.0000001 || Math.abs(remainingEth.cost - 2500) > 0.0001) throw new Error("El coste residual de ETH tras permutas encadenadas es incorrecto.");

console.log(JSON.stringify({ status: "ok", lines: result.lines.length, netConfirmed: result.summary.netResult, reviewLines: result.summary.reviewLines, blockedSwapPreservesInventory: true, chainedSwapsPreserveCost: true }));
