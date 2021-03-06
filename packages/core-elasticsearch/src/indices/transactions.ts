import { Transaction } from "@arkecosystem/crypto";
import { storage } from "../storage";
import { first, last } from "../utils";
import { Index } from "./base";

export class Transactions extends Index {
    public async index() {
        const iterations = await this.getIterations();

        for (let i = 0; i < iterations; i++) {
            const modelQuery = this.createQuery();

            const query = modelQuery
                .select(modelQuery.id, modelQuery.block_id, modelQuery.serialized)
                .from(modelQuery)
                .where(modelQuery.timestamp.gte(storage.get("lastTransaction")))
                .order(modelQuery.timestamp.asc)
                .limit(this.chunkSize);

            let rows = await (this.database.connection as any).query.manyOrNone(query.toQuery());

            if (rows.length) {
                rows = rows.map(row => {
                    const { data } = Transaction.fromBytesUnsafe(row.serialized, row.id);
                    data.blockId = row.blockId;

                    return data;
                });

                const timestamps = rows.map(row => row.data.timestamp);
                this.logger.info(
                    `[ES] Indexing ${rows.length} transactions [${first(timestamps)} to ${last(timestamps)}]`,
                );

                try {
                    await this.bulkUpsert(rows);

                    storage.update({
                        lastTransaction: +last(timestamps),
                    });
                } catch (error) {
                    this.logger.error(`[ES] ${error.message}`);
                }
            }
        }
    }

    public listen() {
        this.registerListener("create", "transaction.applied");

        this.registerListener("delete", "transaction.expired");
        this.registerListener("delete", "transaction.reverted");
    }
}
