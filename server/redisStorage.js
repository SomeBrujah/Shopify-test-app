import { createClient } from 'redis';
import {Shopify} from '@shopify/shopify-api';

class RedisStore {
    constructor() {
        this.client = createClient({
            url: 'redis://localhost:6379',
        });
        this.client.on('error', (err) => console.log('Redis Client Error', err));
        this.client.connect();
    }

    async storeCallback(session) {
        try {
            return await this.client.set(session.id, JSON.stringify(session));
        } catch (err) {
            throw new Error(err);
        }
    }

    async loadCallback(id) {
        try {
            let reply = await this.client.get(id);
            if (reply) {
                var session = JSON.parse(reply);
                session.expires = new Date(session.expires);

                session.isActive = function () {
                    const scopesUnchanged = Shopify.Context.SCOPES.equals(session.scope);

                    if (
                        scopesUnchanged &&
                        session.accessToken &&
                        (!session.expires || session.expires >= new Date())) {
                        return true;
                    }
                    return false;
                }
                return session;
            } else {
                return undefined;
            }
        } catch (err) {
            throw new Error(err);
        }
    }

    async deleteCallback(id) {
        try {
            return await this.client.del(id);
        } catch (err) {
            throw new Error(err);
        }
    }
}

export default RedisStore;