import * as url from 'locutus/php/url';
import 'whatwg-fetch';

const HOST_URL = 'https://keryptl3t1.execute-api.us-east-1.amazonaws.com/dev/api';

export function auth( talkId: string, passPhrase: string ) {
    const body = url.http_build_query( { talkId, passPhrase });
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    return fetch( `${HOST_URL}/v1/auth`, {
        method: 'POST',
        body,
        headers,
        mode: 'cors',
        credentials: 'include'
    });
}

export function albums( talkId: string ) {
    return fetch( `${HOST_URL}/v1/albums/${talkId}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
    });
}
