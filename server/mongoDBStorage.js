import { Session } from '@shopify/shopify-api/dist/auth/session/index.js';
import mongoose from 'mongoose';

import { ActiveSessionModel } from './mongoModels/activSession.js';

mongoose.connect(`mongodb+srv://MaxK:RAznbbCklADkifsd@cluster0.ko1mi.mongodb.net/shopify_sessions?retryWrites=true&w=majority`,
    (error, result) => {
        if (error) {
            throw new Error(error)
        }
        if (result) {
            console.log('MongoDB is connected');
        }
    })

let domainId = '';

class MongoStore {
    async storeCallback(session) {
        try {
            let data = session;
            data.onlineAccessInfo = JSON.stringify(session.onlineAccessInfo);

            if (data.id.indexOf(`${data.shop}`) > -1) {
                domainId = data.id;
            }

            await ActiveSessionModel.findOneAndUpdate({sessionId: session.id}, {
                shopUrl: data.shop,
                sessionId: data.id,
                domainId: domainId,
                accessToken: data.accessToken,
                state: data.state,
                isOnline: data.isOnline,
                onlineAccessInfo: data.onlineAccessInfo,
                scope: data.scope,
            }, {
                upsert: true,
                setDefaultsOnInsert: true
            });

            return true;
        } catch (error) {
            console.log(error.message);
            throw new Error(error)
        }
    }

    async loadCallback(id) {
        try {
            const session = new Session(id);

            const data = await ActiveSessionModel.findOne({sessionId: id}).then((result)=>{
                session.shop = result.shopUrl;
                session.state = result.state;
                session.scope = result.scope;
                session.isOnline = result.isOnline == 'true' ? true : false;
                session.onlineAccessInfo = result.onlineAccessInfo;
                session.accessToken = result.accessToken;

                const date = new Date();
                date.setDate(date.getDate() + 1);
                session.expires = date;

                if(session.expires && typeof session.expires === 'string') {
                    session.expires = new Date(session.expires);
                }
            }).catch((error)=>{
                throw new Error(error);
            });

            return session;
        } catch (error) {
            throw new Error(error)
        }
    }

    async deleteCallback(id) {
        try {
            return await ActiveSessionModel.deleteOne({sessionId: id});
        } catch (error) {
            throw new Error(error)
        }
    }
}

export default MongoStore;