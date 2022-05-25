import { Session } from '@shopify/shopify-api/dist/auth/session/index.js';
import mongoose from 'mongoose';



const uri = 'mongodb+srv://MaxK:RAznbbCklADkifsd@cluster0.ko1mi.mongodb.net/shopify_sessions?retryWrites=true&w=majority';

const sessionSchema = new mongoose.Schema({
    id: Number,
    shop_url: String,
    session_id: String,
    domain_id: String,
    access_token: String,
    state: String,
    isOnline: String,
    onlineAccessInfo: String,
    scope: String
});

const SessionModel = mongoose.model('SessionModel', sessionSchema);

mongoose.connect(uri, (err, db) => {
    if (!err) {
        console.log('MongoDB is connected.');
    }
});

let domain_id = '';

export async function storeCallback(session) {
    try {
        let data = session;
        data.onlineAccessInfo = JSON.stringify(session.onlineAccessInfo);
        if (data.id.indexOf(`${data.shop}`) > -1) {
            domain_id = data.id;
        }

        await SessionModel.updateOne({ session_id: session.id }, {
            shop_url: data.shop,
            session_id: data.id,
            domain_id: domain_id,
            access_token: data.accessToken,
            state: data.state,
            isOnline: data.isOnline,
            onlineAccessInfo: data.onlineAccessInfo,
            scope: data.scope
        }, {
            upsert: true,
            setDefaultsOnInsert: true
        });
        return true;

    } catch (error) {
        throw new Error(error)
    }
}
export async function loadCallback(id) {
    try {
        let session = new Session(id)

        let query = await SessionModel.findOne({ session_id: id }).then((res) => {
            session.shop = res.shop_url;
            session.state = res.state;
            session.scope = res.scope;
            session.isOnline = res.isOnline == 'true' ? true : false;
            session.onlineAccessInfo = res.onlineAccessInfo;
            session.accessToken = res.accessToken;

            const date = new Date();
            date.setDate(date.getDate() + 1);
            session.expires = date;

            if (session.expires && typeof session.expires === 'string') {
                session.expires = new Date(session.expires);
            }

        }).then(() => { console.log('Session loaded'); })

        return session;
    } catch (error) {
        throw new Error(error);
    }
}
export async function deleteCallback(id) {
    try {
        return true;
    } catch (error) {
        throw new Error(error);
    }
}