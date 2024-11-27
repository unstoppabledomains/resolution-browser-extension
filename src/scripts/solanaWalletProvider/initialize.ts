import {SolanaProvider} from "../../types/solana/provider";
import {registerWallet} from "./register";
import {SolanaWallet} from "./wallet";

export function initialize(provider: SolanaProvider): void {
  registerWallet(new SolanaWallet(provider));
}
