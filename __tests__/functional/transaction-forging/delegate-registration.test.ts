import { Address } from "@arkecosystem/crypto";
import { secrets } from "../../utils/config/testnet/delegates.json";
import * as support from "./__support__";

const { passphrase, secondPassphrase } = support.passphrases;

beforeAll(support.setUp);
afterAll(support.tearDown);

describe("Transaction Forging - Delegate Registration", () => {
    it("should broadcast, accept and forge it [Signed with 1 Passphase]", async () => {
        // Initial Funds
        const initialFunds = support.generateTransfer(secrets[0], Address.fromPassphrase(passphrase), 100);
        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

        // Register a delegate
        const transactions = support.generateDelegateRegistration(passphrase, "username");
        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transactions[0].id);
    });

    it("should broadcast, accept and forge it [Signed with 2 Passphases]", async () => {
        // Make a fresh wallet for the second signature tests
        const passphrase = secondPassphrase;

        // Initial Funds
        const initialFunds = support.generateTransfer(secrets[0], Address.fromPassphrase(passphrase), 100);
        await support.expectAcceptAndBroadcast(initialFunds, initialFunds[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(initialFunds[0].id);

        // Register a second passphrase
        const secondSignature = support.generateSecondSignature(passphrase, secondPassphrase);
        await support.expectAcceptAndBroadcast(secondSignature, secondSignature[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(secondSignature[0].id);

        // Register a delegate
        const transactions = support.generateDelegateRegistration(
            {
                passphrase,
                secondPassphrase,
            },
            "second_username",
        );
        await support.expectAcceptAndBroadcast(transactions, transactions[0].id);
        await support.snoozeForBlock(1);
        await support.expectTransactionForged(transactions[0].id);
    });
});