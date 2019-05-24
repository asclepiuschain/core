import { State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";

export const transformWallet = (wallet: State.IWallet) => {
    const username: string = wallet.getExtraAttribute("delegate.username");

    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        username,
        secondPublicKey: wallet.getExtraAttribute("secondPublicKey"),
        balance: +Utils.BigNumber.make(wallet.balance).toFixed(),
        isDelegate: !!username,
        vote: wallet.getExtraAttribute("vote"),
    };
};
