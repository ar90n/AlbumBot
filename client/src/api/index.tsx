import * as url from 'locutus/php/url';
import 'whatwg-fetch';

declare var process: any;

const API_HOST = process.env.API_HOST;
const PICTURES_PER_PAGE = 12;

export function login( talkId: string, passPhrase: string ) {
    const body = url.http_build_query( { passPhrase });
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const resourceUrl = `https://${API_HOST}/api/v1/login/${talkId}`;
    return fetch( resourceUrl, {
        method: 'POST',
        body,
        headers,
        mode: 'cors',
        credentials: 'include'
    });
}

export function logout( talkId: string ) {
    const body = '';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const resourceUrl = `https://${API_HOST}/api/v1/logout/${talkId}`;
    return fetch( resourceUrl, {
        method: 'POST',
        body,
        headers,
        mode: 'cors',
        credentials: 'include'
    });
}

export function albums( talkId: string, lastEvaluatedCreatedAt: number ) {
    let resourceUrl = `https://${API_HOST}/api/v1/albums/${talkId}/limit/${PICTURES_PER_PAGE}`;
    if( !!lastEvaluatedCreatedAt ) {
        resourceUrl = `${resourceUrl}/lastEvaluatedCreatedAt/${lastEvaluatedCreatedAt}`;
    }

    return fetch( resourceUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
    });
}
