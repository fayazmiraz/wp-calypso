import { useShoppingCart } from '@automattic/shopping-cart';
import debugFactory from 'debug';
import page from 'page';
import { useCallback, useState, useRef, useEffect } from 'react';
import useCartKey from 'calypso/my-sites/checkout/use-cart-key';
import { clearSignupDestinationCookie } from 'calypso/signup/storageUtils';
import useValidCheckoutBackUrl from './use-valid-checkout-back-url';
import type { RemoveProductFromCart, ResponseCart } from '@automattic/shopping-cart';

const debug = debugFactory( 'calypso:composite-checkout:use-redirect-if-cart-empty' );

export default function useRemoveFromCartAndRedirect(
	siteSlug: string | undefined,
	siteSlugLoggedOutCart: string | undefined,
	createUserAndSiteBeforeTransaction: boolean
): {
	isRemovingProductFromCart: boolean;
	removeProductFromCartAndMaybeRedirect: RemoveProductFromCart;
} {
	const cartKey = useCartKey();
	const { removeProductFromCart } = useShoppingCart( cartKey );

	// In some cases, the cloud.jetpack.com/pricing page sends a `checkoutBackUrl` url query param to checkout.
	const checkoutBackUrl = useValidCheckoutBackUrl( siteSlug || siteSlugLoggedOutCart );

	const redirectDueToEmptyCart = useCallback( () => {
		debug( 'cart is empty; redirecting...' );
		let cartEmptyRedirectUrl = `/plans/${ siteSlug || '' }`;

		if ( createUserAndSiteBeforeTransaction ) {
			cartEmptyRedirectUrl = siteSlugLoggedOutCart ? `/plans/${ siteSlugLoggedOutCart }` : '/start';
		}

		debug( 'Before redirect, first clear redirect url cookie' );
		clearSignupDestinationCookie();

		if ( createUserAndSiteBeforeTransaction ) {
			try {
				window.localStorage.removeItem( 'shoppingCart' );
				window.localStorage.removeItem( 'siteParams' );
			} catch ( err ) {}

			// We use window.location instead of page.redirect() so that if the user already has an account and site at
			// this point, then window.location will reload with the cookies applied and takes to the /plans page.
			// (page.redirect() will take to the log in page instead).
			window.location.href = cartEmptyRedirectUrl;
			return;
		}
		if ( checkoutBackUrl ) {
			window.location.href = checkoutBackUrl;
		} else {
			page.redirect( cartEmptyRedirectUrl );
		}
	}, [ createUserAndSiteBeforeTransaction, siteSlug, siteSlugLoggedOutCart, checkoutBackUrl ] );

	const isMounted = useRef( true );
	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, [] );

	const [ isRemovingProductFromCart, setIsRemovingFromCart ] = useState< boolean >( false );
	const removeProductFromCartAndMaybeRedirect = useCallback(
		( uuid: string ) => {
			setIsRemovingFromCart( true );
			return removeProductFromCart( uuid ).then( ( cart: ResponseCart ) => {
				if ( cart.products.length === 0 ) {
					redirectDueToEmptyCart();
					// Don't turn off isRemovingProductFromCart if we are redirecting so that the loading page remains active.
					return cart;
				}
				isMounted.current && setIsRemovingFromCart( false );
				return cart;
			} );
		},
		[ redirectDueToEmptyCart, removeProductFromCart ]
	);

	return {
		isRemovingProductFromCart,
		removeProductFromCartAndMaybeRedirect,
	};
}
