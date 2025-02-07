import { get } from 'lodash';
import { SITE_FRONT_PAGE_UPDATE } from 'calypso/state/action-types';
import { registerHandlers } from 'calypso/state/data-layer/handler-registry';
import { bypassDataLayer } from 'calypso/state/data-layer/utils';
import { http } from 'calypso/state/data-layer/wpcom-http/actions';
import { dispatchRequest } from 'calypso/state/data-layer/wpcom-http/utils';
import { updateSiteFrontPage } from 'calypso/state/sites/actions';

const noop = () => {};
const getIsPageOnFront = ( show_on_front ) => {
	if ( 'page' === show_on_front ) {
		return true;
	}
	if ( 'posts' === show_on_front ) {
		return false;
	}
	return undefined;
};

const updateSiteFrontPageRequest = ( action ) =>
	http(
		{
			path: `/sites/${ action.siteId }/homepage`,
			method: 'POST',
			apiVersion: '1.1',
			body: {
				is_page_on_front: getIsPageOnFront( get( action.frontPageOptions, 'show_on_front' ) ),
				page_on_front_id: get( action.frontPageOptions, 'page_on_front' ),
				page_for_posts_id: get( action.frontPageOptions, 'page_for_posts' ),
			},
		},
		action
	);

const setSiteFrontPage = (
	{ siteId },
	{ is_page_on_front, page_on_front_id, page_for_posts_id }
) => ( dispatch ) => {
	dispatch(
		bypassDataLayer(
			updateSiteFrontPage( siteId, {
				show_on_front: is_page_on_front ? 'page' : 'posts',
				page_on_front: parseInt( page_on_front_id, 10 ),
				page_for_posts: parseInt( page_for_posts_id, 10 ),
			} )
		)
	);
};

registerHandlers( 'state/data-layer/wpcom/sites/homepage/index.js', {
	[ SITE_FRONT_PAGE_UPDATE ]: [
		dispatchRequest( {
			fetch: updateSiteFrontPageRequest,
			onSuccess: setSiteFrontPage,
			onError: noop,
		} ),
	],
} );
