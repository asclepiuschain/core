import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Enums, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import {
    NotSupportedForMultiSignatureWalletError,
    WalletUsernameAlreadyRegisteredError,
    WalletUsernameEmptyError,
    WalletUsernameNotEmptyError,
} from "../errors";
import { TransactionHandler } from "./transaction";

const { TransactionTypes } = Enums;

export class DelegateRegistrationTransactionHandler extends TransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return Transactions.DelegateRegistrationTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
        const forgedBlocks = await connection.blocksRepository.getDelegatesForgedBlocks();
        const lastForgedBlocks = await connection.blocksRepository.getLastForgedBlocks();

        for (const transaction of transactions) {
            const wallet = walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.setExtraAttribute("delegate", {
                username: transaction.asset.delegate.username,
                forgedFees: Utils.BigNumber.ZERO,
                forgedRewards: Utils.BigNumber.ZERO,
                producedBlocks: 0,
            } as State.IWalletDelegateAttributes);

            walletManager.reindex(wallet);
        }

        for (const block of forgedBlocks) {
            const wallet = walletManager.findByPublicKey(block.generatorPublicKey);
            const delegate: State.IWalletDelegateAttributes = wallet.getExtraAttribute("delegate");

            delegate.forgedFees = delegate.forgedFees.plus(block.totalFees);
            delegate.forgedRewards = delegate.forgedRewards.plus(block.forgedRewards);
            delegate.producedBlocks += +block.totalProduced;
        }

        for (const block of lastForgedBlocks) {
            const wallet = walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.setExtraAttribute("delegate.lastBlock", block);
        }

        walletManager.buildDelegateRanking();
    }

    public throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): void {
        const { data }: Interfaces.ITransaction = transaction;

        const sender: State.IWallet = databaseWalletManager.findByPublicKey(data.senderPublicKey);
        if (sender.hasMultiSignature()) {
            throw new NotSupportedForMultiSignatureWalletError();
        }

        const { username }: { username: string } = data.asset.delegate;
        if (!username) {
            throw new WalletUsernameEmptyError();
        }

        if (wallet.isDelegate()) {
            throw new WalletUsernameNotEmptyError();
        }

        if (databaseWalletManager.findByUsername(username)) {
            throw new WalletUsernameAlreadyRegisteredError(username);
        }

        super.throwIfCannotBeApplied(transaction, wallet, databaseWalletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(ApplicationEvents.DelegateRegistered, transaction.data);
    }

    public canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): boolean {
        if (this.typeFromSenderAlreadyInPool(data, pool, processor)) {
            return false;
        }

        const { username }: { username: string } = data.asset.delegate;
        const delegateRegistrationsSameNameInPayload = processor
            .getTransactions()
            .filter(tx => tx.type === TransactionTypes.DelegateRegistration && tx.asset.delegate.username === username);

        if (delegateRegistrationsSameNameInPayload.length > 1) {
            processor.pushError(
                data,
                "ERR_CONFLICT",
                `Multiple delegate registrations for "${username}" in transaction payload`,
            );
            return false;
        }

        const delegateRegistrationsInPool: Interfaces.ITransactionData[] = Array.from(
            pool.getTransactionsByType(TransactionTypes.DelegateRegistration),
        ).map((memTx: Interfaces.ITransaction) => memTx.data);

        const containsDelegateRegistrationForSameNameInPool: boolean = delegateRegistrationsInPool.some(
            transaction => transaction.asset.delegate.username === username,
        );
        if (containsDelegateRegistrationForSameNameInPool) {
            processor.pushError(data, "ERR_PENDING", `Delegate registration for "${username}" already in the pool`);
            return false;
        }

        return true;
    }

    public applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.applyToSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        sender.setExtraAttribute("delegate.username", transaction.data.asset.delegate.username);

        walletManager.reindex(sender);
    }

    public revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        super.revertForSender(transaction, walletManager);

        const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const username: string = sender.getExtraAttribute("delegate.username");

        walletManager.forgetByUsername(username);
        sender.unsetExtraAttribute("delegate.username");
    }

    // tslint:disable-next-line:no-empty
    public applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}

    // tslint:disable-next-line:no-empty
    public revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {}
}
