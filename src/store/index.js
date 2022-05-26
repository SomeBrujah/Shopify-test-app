import { createStore, combineReducers, applyMiddleware } from 'redux';
import axios from 'axios';
import { getSessionToken } from '@shopify/app-bridge-utils';
import axiosMiddleware from 'redux-axios-middleware';
import rootReducer from './rootReducer/reducer';
import { Redirect } from "@shopify/app-bridge/actions";

const mainReducer = combineReducers({
    rootReducer
});

const client = axios.create();

client.interceptors.request.use(async function (config) {
    const token = await getSessionToken(window.app)
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
});

client.interceptors.response.use(function (response) {
    return response;
}, function (error) {
    if (
        error.response.headers["x-shopify-api-request-failure-reauthorize"] === "1"
    ) {
        const authUrlHeader = error.response.headers["x-shopify-api-request-failure-reauthorize-url"];
        
        const redirect = Redirect.create(window.app)
        redirect.dispatch(Redirect.Action.REMOTE, authUrlHeader || '/auth');
        return null;
    }
    return error;
});

export const store = createStore(mainReducer, applyMiddleware(axiosMiddleware(client)))