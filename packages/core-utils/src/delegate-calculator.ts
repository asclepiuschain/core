import { app } from "@arkecosystem/core-container";
import { Blockchain, State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";

const BignumMod = Utils.BigNumber.clone({ DECIMAL_PLACES: 2 });

export const calculateApproval = (delegate: State.IWallet, height?: number): number => {
    const config = app.getConfig();

    if (!height) {
        height = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock().data.height;
    }

    const constants = config.getMilestone(height);
    const totalSupply = new BignumMod(config.get("genesisBlock.totalAmount")).plus(
        (height - constants.height) * constants.reward,
    );
    const voteBalance = new BignumMod(delegate.getExtraAttribute<Utils.BigNumber>("delegate.voteBalance"));

    return +voteBalance
        .times(100)
        .dividedBy(totalSupply)
        .toFixed(2);
};

export const calculateForgedTotal = (delegate: State.IWallet): number => {
    const forgedFees = Utils.BigNumber.make(delegate.getExtraAttribute("delegate.forgedFees"));
    const forgedRewards = Utils.BigNumber.make(delegate.getExtraAttribute("delegate.forgedRewards"));

    return +forgedFees.plus(forgedRewards).toFixed();
};
